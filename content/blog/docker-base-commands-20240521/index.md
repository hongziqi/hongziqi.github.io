---
title: Docker 基础指令
summary: 简述了容器操作、镜像操作中的基础指令
date: 2024-05-21
draft: false
featured: false
highlight: true
categories:
  - Docker

toc: true
comments: true
---

## 镜像操作
```bash
# 检索镜像，从仓库中检索
docker search <镜像名称>
# 下载镜像
docker pull <镜像名称>
# 镜像列表
docker images 
# 删除镜像
docker rmi <镜像名称/ID>
# 获取镜像的元数据信息
docker inspect <镜像名称/ID> 
# 清理无容器使用的镜像
docker images prune -a
```

## 容器操作
### 运行容器
```shell
docker run -it <镜像ID> /bin/bash
-i : 交互式操作
-t : 终端
-d : 不进入容器
-p : 映射端口(8080:80)主机8080端口映射到容器的80端口
/bin/bash : 交互式shell
```

### 查看所有容器
```shell
# 列出所有的容器
docker ps 
# 列出所有的容器，包括不活跃的容器
docker ps -a
```

### 启动/暂停/重启/删除容器
```shell
# 启动容器
docker start <容器名称/ID> 
# 关闭容器
docker stop <容器名称/ID>
# 重启
docker restart <容器名称/ID>
# 删除容器
docker rm <容器名称/ID>
```

### 进入容器
```shell
docker exec -it <容器名称/ID> /bin/bash
```

### 清除不常用的数据
```
docker container prune
```

### 获取容器的元数据信息
```shell
docker inspect <容器名称/ID>
```

### 查看容器的日志
```shell
docker logs <容器名称/ID>
--since : 此参数指定了输出日志开始日期，即只输出指定日期之后的日志。
-f: 查看实时日志
-t: 查看日志产生的日期
--tail=10: 查看最后的 10 条日志。
```

### 文件拷贝
```shell
# 将当前目录的 test.txt 文件拷贝到容器的 /tmp 目录下
docker cp test.txt <容器名称/ID>:/tmp

# 将容器的/tmp/test.txt目录拷贝到当前目录下
docker cp <容器名称/ID>:/tmp/test.txt ./out.txt
```
