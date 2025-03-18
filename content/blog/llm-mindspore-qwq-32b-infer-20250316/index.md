---
title: QWQ-32B模型(MindSpore)推理实践教程
summary: 描述了昇腾芯片下使用MindSpore对QwQ-32B模型推理的实践过程。
date: 2025-03-16
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

## 模型介绍
QwQ-32B是千问于2025年3月6日发布的人工智能大型语言模型。这是一款拥有 320 亿参数的模型，其性能可与具备 6710 亿参数（其中 370 亿被激活）的 DeepSeek-R1 媲美。这一成果突显了将强化学习应用于经过大规模预训练的强大基础模型的有效性。QwQ-32B 在一系列基准测试中进行了评估，测试了数学推理、编程能力和通用能力。以下结果展示了 QwQ-32B 与其他领先模型的性能对比，包括 DeepSeek-R1-Distilled-Qwen-32B、DeepSeek-R1-Distilled-Llama-70B、o1-mini 以及原始的 DeepSeek-R1。

## 实践教程

本实验硬件环境：一台Atlas 800T A2（32G），实际使用四卡。
### 下载镜像
拉取昇思 MindSpore 推理容器镜像：
```bash
docker pull swr.cn-central-221.ovaijisuan.com/mindformers/deepseek_v3_mindspore2.5.0-infer:20250217
```
### 启动容器
```bash
docker run -it --name=qwq-32b --net=host \
   --shm-size 500g \
   --device=/dev/davinci0 \
   --device=/dev/davinci1 \
   --device=/dev/davinci2 \
   --device=/dev/davinci3 \
   --device=/dev/davinci_manager \
   --device=/dev/hisi_hdc \
   --device /dev/devmm_svm \
   -v /usr/local/Ascend/driver:/usr/local/Ascend/driver \
   -v /usr/local/Ascend/firmware:/usr/local/Ascend/firmware \
   -v /usr/local/sbin/npu-smi:/usr/local/sbin/npu-smi \
   -v /usr/local/sbin:/usr/local/sbin \
   -v /etc/hccn.conf:/etc/hccn.conf \
   -v /root/.cache:/root/.cache \
   swr.cn-central-221.ovaijisuan.com/mindformers/deepseek_v3_mindspore2.5.0-infer:20250217 \
   bash
```
### 模型下载
下载openmind_hub：
```bash
pip install openmind_hub
# 检查是否安装成功
python -c "from openmind_hub import repo_info; print(repo_info('PyTorch-NPU/t5_small'))"
```
执行以下命令为自定义下载路径 `/home/work/QwQ-32B` 添加白名单：
```bash
export HUB_WHITE_LIST_PATHS=/home/work/QwQ-32B
```
从魔乐社区下载昇思 MindSpore 版本的 QwQ-32B 文件至指定路径 `/home/work/QwQ-32B` (包含模型代码、权重、分词模型和示例代码，占用约 62GB 的磁盘空间)：
```python
from openmind_hub import snapshot_download

snapshot_download(
    repo_id="MindSpore-Lab/QwQ-32B",
    local_dir="/home/work/QwQ-32B",
    local_dir_use_symlink=False,
)
```

下载完成的 `/home/work/QwQ-32B` 文件夹目录结构如下：

```
QwQ-32B
  ├── config.json                         # 模型json配置文件
  ├── vocab.json                          # 词表vocab文件
  ├── merges.txt                          # 词表merges文件
  ├── tokenizer.json                      # 词表json文件
  ├── tokenizer_config.json               # 词表配置文件
  ├── predict_qwq_32b.yaml                # 模型yaml配置文件
  ├── qwen2_5_tokenizer.py                # 模型tokenizer文件
  ├── model-xxxxx-of-xxxxx.safetensors    # 模型权重文件
  └── param_name_map.json                 # 模型权重映射文件
```
需要将权重目录和映射文件单独存放
```bash
# 新建权重目录
mkdir /home/work/qwq32b-weight
mv /home/work/QwQ-32B/*.safetensors /home/work/qwq32b-weight/
mv /home/work/QwQ-32B/param_name_map.json /home/work/qwq32b-weight/
```
### 服务化部署
### 1. 修改模型配置文件

在 `/home/work/QwQ-32B/predict_qwq_32b.yaml` 中对以下配置进行修改：

```yaml
auto_trans_ckpt: True     # 打开权重自动切分，自动将权重转换为分布式任务所需的形式
load_checkpoint: '/home/work/qwq32b-weight'       # 配置为模型权重的绝对路径
processor:
  tokenizer:
	vocab_file: "/home/work/QwQ-32B/vocab.json"   # 配置为vocab文件的绝对路径
	merges_file: "/home/work/QwQ-32B/merges.txt"  # 配置为merges文件的绝对路径
parallel_config:
	model_parallel: 4                             # 配置成4
max_device_memory: "28GB"                         # 将最大可用显存设置为28GB
```

### 2.一键启动MindIE

mindformers仓上提供一键拉起MindIE脚本，脚本中已预置环境变量设置和服务化配置，仅需输入模型文件目录后即可快速拉起服务。
进入`/home/work/mindformers/scripts`目录下，执行MindIE启动脚本

```bash
cd /home/work/mindformers/scripts
bash run_mindie.sh --model-name QwQ-32B --model-path /home/work/QwQ-32B --max-prefill-batch-size 1
```
#### 查看日志：
```bash
tail -f output.log
```
当log日志中出现`Daemon start success!`，表示服务启动成功。
（如果启动失败，检查`/root/mindie/log/debug/` 下日志输出）

### 3. 执行推理请求测试
直接执行以下命令发送流式推理请求进行测试：
```bash
curl -w "\ntime_total=%{time_total}\n" -H "Accept: application/json" -H "Content-type: application/json" -X POST -d '{"inputs": "请介绍一个北京的景点", "parameters": {"do_sample": false, "max_new_tokens": 128}, "stream": false}' http://127.0.0.1:1025/generate_stream &
```
也可以调用带思考过程的接口：
```bash
curl -i --location --request POST 'http://127.0.0.1:1025/v1/chat/completions' \
--header 'Content-Type: application/json' \
--data-raw '{
  "model": "QwQ-32B",
  "messages": [{"role": "user", "content": "请介绍一个北京的景点"}],
  "max_tokens": 2048,
  "temperature": 0.6,
  "top_p": 0.95,
  "top_k": 40,
  "n": 1,
  "stream": false,
  "frequency_penalty": 1.00
}'
```

### 停止MindIE服务
可以通过`pkill -9 mindie`终止 MindIE 服务，终止前后可以通过`npu-smi info`显存占用情况。

## 参考
[昇思MindSpore支持QwQ-32B并上线开源社区](https://mp.weixin.qq.com/s/f4esIyrEyl1VhVtlwemCVQ)
