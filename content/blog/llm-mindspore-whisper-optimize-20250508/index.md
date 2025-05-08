---
title: 基于MindSpore的Whisper模型推理优化实践
summary: 介绍了基于MindSpore的Whisper模型推理优化实践，包括FlashAttention2算法接入及Conv1D算子加速等。
date: 2025-05-08
draft: false
featured: false
highlight: true
categories:
  - Large Language Model
tags:
  - MindSpore

toc: true
comments: true
---


在使用 MindSpore NLP 的 Whisper 模型进行推理时，模力方舟团队发现推理性能存在瓶颈。例如，对于一段 91 秒的音频，模型的识别时间达到 95 秒，推理开销较大。当前环境为 `mindspore==2.5.0` 与 `mindnlp==0.4.0`，且模型仅支持 **Eager** 模式，无法充分发挥硬件性能。

为解决此问题，我们系统分析了注意力机制的执行方式，并尝试引入高性能的 **FlashAttention2** 实现。同时，我们也借助 **MindSpore Profiler** 定位性能瓶颈，最终通过引入原生的 **Conv1D** 算子，进一步提升整体推理性能。

## 一、三种注意力机制对比
| 模式                                     | 特点                  | 性能表现        |
| -------------------------------------- | ------------------- | ----------- |
| **Eager**                              | 默认执行方式，算子按顺序执行，调试友好 | 无融合优化，推理慢   |
| **SDPA**（Scaled Dot-Product Attention） | 经典注意力实现             | 适用于普通推理需求   |
| **FlashAttention2**                   | 高性能实现，显著减少显存和加速计算   | 长序列推理性能大幅提升 |
## 二、接入 FlashAttention2 模式
为提升推理速度，我们在原始 eager 模式基础上引入了 **FlashAttention2** 。改动包括：
### 1. 适配 `flash-attn` 库
适配 `flash-attn` 库中 `bert-padding.py` 中的关键方法，包括：
- `index_put_first_axis`
- `index_first_axis`
- `unpad_input`
- `pad_input`
### 2. 新增支撑模块 `modeling_flash_attention_utils.py`
新增辅助函数实现：
- `_get_unpad_data`
- `_unpad_input`
- `_prepare_fa2_from_position_ids`
- `_fa_peft_integration_check`
- `_flash_attention_forward`
### 3. 修改 Whisper 模型支持 FlashAttention2
在 `modeling_whisper.py` 中加入 `WhisperFlashAttention2` 逻辑，允许初始化模型时通过：
```python
attn_implementation="flash_attention_2"
```
来启用新模式。
### 4. 性能初步评估
推理耗时从 95s 降至约 85s，性能提升约 **10% 性能**。但通过 Profiler 分析，发现瓶颈仍存在。

## 三、进一步优化：替换 Conv1D 实现
### 1. Profiler 分析结果
我们使用如下脚本采集性能数据：
```python
import mindspore
from mindnlp.transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
from mindspore import Profiler
from mindspore.profiler import ProfilerLevel, schedule, tensorboard_trace_handler

model_id = ""openai/whisper-large-v3""
model = AutoModelForSpeechSeq2Seq.from_pretrained(
    model_id, 
    ms_dtype=mindspore.float16, 
    low_cpu_mem_usage=True,
    use_safetensors=True,
    attn_implementation="flash_attention_2",
)
processor = AutoProcessor.from_pretrained(model_id)
pipe = pipeline(
    "automatic-speech-recognition",
    model=model,
    tokenizer=processor.tokenizer,
    feature_extractor=processor.feature_extractor,
    ms_dtype=mindspore.float16,
    return_timestamps=True,
)
# Profiler 数据默认存储在路径：
# ./data/modelfoundry-prod-node-xxx/ASCEND_PROFILER_OUTPUT
with Profiler(
        profiler_level=ProfilerLevel.Level0,
        schedule=schedule(wait=0, warmup=0, active=1, repeat=1, skip_first=0),
        on_trace_ready=tensorboard_trace_handler
     ) as prof:
	pipe("/path/to/yourself.mp3")
	prof.step()
```
通过使用 [MindStudio Insight](https://www.hiascend.com/developer/download/community/result?module=pt+sto+cann) 对性能数据进行分析后发现，模型中 `Conv1D` 实现依赖 `Conv2D` 间接方式，且运行在 **CPU** 侧，成为主要的性能瓶颈。
![](images/whisper_profiler_before.png)

### 2. 原因定位
旧版本的 `Conv1D` 是通过 `Conv2D` 间接构造实现，存在：
- 多余维度转换
- CPU 执行
- 内存频繁拷贝
### 3. 解决方案
自 **MindSpore 2.6.0rc1** 起，框架已提供高效的原生 `Conv1D` 实现，支持图模式和硬件加速。在此基础上，我们重构模型中的 `Conv1D` 调用，显著缩短推理时间。
### 4. 最终效果
结合 `FlashAttention2` 和 `Conv1D` 及其它算子优化后，最终在 **MindSpore 2.6.0rc1** 版本下，91 秒音频推理时间缩短至约 **57 秒**，整体性能提升 **40%**，CPU 占用率显著下降。
![](images/whisper_profiler_after.png)

## 四、手把手推理教程

### 1. 下载镜像
执行以下Shell命令，拉取 MindSpore 容器镜像：
```bash
docker pull quay.io/ascend/mindspore:openeuler-python3.10-cann8.1.rc1-mindspore2.6.0rc1
# 推荐国内源加速
# docker pull quay.xzt.me/ascend/mindspore:openeuler-python3.10-cann8.1.rc1-mindspore2.6.0rc1
```
### 2. 创建并进入容器
执行以下命令创建容器，name 设置为 whisper：
```bash
docker run -itd --privileged  --name=whisper --net=host \
   --shm-size 500g \
   --device=/dev/davinci0 \
   --device=/dev/davinci1 \
   --device=/dev/davinci2 \
   --device=/dev/davinci3 \
   --device=/dev/davinci4 \
   --device=/dev/davinci5 \
   --device=/dev/davinci6 \
   --device=/dev/davinci7 \
   --device=/dev/davinci_manager \
   --device=/dev/hisi_hdc \
   --device /dev/devmm_svm \
   -v /usr/local/Ascend/driver:/usr/local/Ascend/driver \
   -v /usr/local/Ascend/firmware:/usr/local/Ascend/firmware \
   -v /usr/local/sbin/npu-smi:/usr/local/sbin/npu-smi \
   -v /usr/local/sbin:/usr/local/sbin \
   -v /etc/hccn.conf:/etc/hccn.conf \
   quay.io/ascend/mindspore:openeuler-python3.10-cann8.1.rc1-mindspore2.6.0rc1 \
   bash
```
进入容器，后续所有操作均在容器内操作
```bash
docker exec -it whisper bash
```
### 3. 安装 MindSpore NLP 与依赖
执行以下脚本，安装 MindSpore NLP 及相关依赖包：
```bash
# 安装相关依赖
yum install ffmpeg git
# 配置国内源
pip config set global.index-url https://repo.huaweicloud.com/repository/pypi/simple/ 
# 升级 pip
pip install --upgrade pip
# 安装 mindnlp
git clone -b 0.4 https://github.com/mindspore-lab/mindnlp.git
cd mindnlp
bash scripts/build_and_reinstall.sh
```
### 4. 推理代码示例
国内可以配置 hf 镜像源拉取模型：
```bash
export HF_ENDPOINT=https://hf-mirror.com
```
执行以下代码进行推理：
```python
import mindspore
from mindnlp.transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline

model_id = "openai/whisper-large-v3"
model = AutoModelForSpeechSeq2Seq.from_pretrained(
    model_id, 
    ms_dtype=mindspore.float16, 
    low_cpu_mem_usage=True,
    use_safetensors=True,
    attn_implementation="flash_attention_2",
)
processor = AutoProcessor.from_pretrained(model_id)
pipe = pipeline(
    "automatic-speech-recognition",
    model=model,
    tokenizer=processor.tokenizer,
    feature_extractor=processor.feature_extractor,
    ms_dtype=mindspore.float16,
    return_timestamps=True,
)

result = pipe("/path/to/yourself.mp3")
```

## 五、相关材料

* [MindNLP:WhisperFlashAttention2](https://github.com/mindspore-lab/mindnlp/pull/2018)
* [MindSpore Profiler](https://www.mindspore.cn/docs/zh-CN/r2.6.0rc1/api_python/mindspore/mindspore.Profiler.html?highlight=profiler#mindspore.Profiler)

