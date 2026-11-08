---
sidebar_position: 3
title: Docker 单容器部署
description: 用官方镜像启动单个 Cloudreve 容器，并配置数据库和 Redis。
---

# Docker 单容器部署

官方镜像支持 amd64、arm64、armv7，镜像内已包含 Aria2、缩略图组件和 FFProbe。数据库和 Redis 需要你自己准备。

## 启动

```bash
docker run -d --name cloudreve \
    -p 5212:5212 \
    -p 6888:6888 \
    -p 6888:6888/udp \
    -v ~/cloudreve/data:/cloudreve/data \
    cloudreve/cloudreve:latest
```

- `6888` 是 Aria2 BT 离线下载用的端口，不做 BT 下载可以不映射。
- `-v ~/cloudreve/data:/cloudreve/data` 把容器内的数据目录挂到宿主机。头像、配置文件、临时目录等都在这里，**务必挂载**，否则删容器就丢数据。

访问 `http://服务器IP:5212`，注册第一个账号，它自动成为管理员。

## 配置数据库

上面的命令没配数据库，Cloudreve 使用 SQLite。要连接其他数据库，在启动容器时用环境变量传入：

```bash
docker run -d --name cloudreve \
    -p 5212:5212 \
    -p 6888:6888 \
    -p 6888:6888/udp \
    -v ~/cloudreve/data:/cloudreve/data \
    -e CR_CONF_Database.Type=postgres \
    -e CR_CONF_Database.Host=127.0.0.1 \
    -e CR_CONF_Database.Port=5432 \
    -e CR_CONF_Database.User=cloudreve \
    -e CR_CONF_Database.Password=cloudreve \
    -e CR_CONF_Database.Name=cloudreve \
    cloudreve/cloudreve:latest
```

| 变量 | 说明 |
| --- | --- |
| `CR_CONF_Database.Type` | 数据库类型：`postgres`、`mysql`、`sqlite`、`mariadb` |
| `CR_CONF_Database.Host` | 数据库地址 |
| `CR_CONF_Database.Port` | 数据库端口 |
| `CR_CONF_Database.User` | 用户名 |
| `CR_CONF_Database.Password` | 密码 |
| `CR_CONF_Database.Name` | 数据库名 |
| `CR_CONF_Database.DBFile` | 可选，SQLite 文件路径 |
| `CR_CONF_Database.UnixSocket` | 可选，`true` 或 `false`，是否用 Unix Socket 连接 |
| `CR_CONF_Database.DatabaseURL` | 可选，连接串；设置后其他数据库配置全部忽略 |

:::tip容器内用 `127.0.0.1` 指的是容器自己。数据库在宿主机或别的容器时，请填宿主机 IP、容器名或 Docker 网络里的服务名。:::

## 配置 Redis

不配置时使用内置内存缓存。要用 Redis：

```bash
docker run -d --name cloudreve \
    -p 5212:5212 \
    -p 6888:6888 \
    -p 6888:6888/udp \
    -v ~/cloudreve/data:/cloudreve/data \
    -e CR_CONF_Redis.Server=127.0.0.1:6379 \
    -e CR_CONF_Redis.Password=your_redis_password \
    -e CR_CONF_Redis.DB=0 \
    cloudreve/cloudreve:latest
```

| 变量 | 说明 |
| --- | --- |
| `CR_CONF_Redis.Server` | Redis 地址 |
| `CR_CONF_Redis.Password` | 连接密码 |
| `CR_CONF_Redis.DB` | 数据库编号，默认 `0` |
| `CR_CONF_Redis.Network` | 网络类型，默认 `tcp`，可选 `tcp4`、`tcp6`、`unix` 等 |
| `CR_CONF_Redis.User` | Redis ACL 用户名 |
| `CR_CONF_Redis.UseTLS` | 可选，是否用 TLS 连接，默认 `false` |
| `CR_CONF_Redis.TLSSkipVerify` | 可选，是否跳过 TLS 校验，默认 `false` |

环境变量的通用规则见[配置文件](./configuration.md)。

## 使用 host 网络（可选）

做 BT 下载时，官方建议让容器使用宿主机网络，传输性能更好：

```bash
docker run -d --name cloudreve \
    --network host \
    -v ~/cloudreve/data:/cloudreve/data \
    cloudreve/cloudreve:latest
```

使用 `--network host` 时不需要 `-p` 映射，端口直接占用宿主机。

## 常见问题

**容器启动不了**

```bash
docker logs -f cloudreve
```

主要原因是配置问题：数据库配置错误、Redis 配置错误、授权码错误（Pro 版）。

**启动时用环境变量传了数据库或 Redis 配置，之后怎么改？**

通过环境变量传入的配置，**不能**再靠编辑 `conf.ini` 修改。用新配置重新创建容器即可，只要 `-v ~/cloudreve/data:/cloudreve/data` 挂载的目录不变，数据就还在。

**升级**

所有配置和数据都在 `/cloudreve/data` 卷里，所以只要用新镜像创建容器并挂载同一个卷：

```bash
docker stop cloudreve
docker rm cloudreve

# 其余参数与之前启动时保持一致
docker run -d --name cloudreve \
    -p 5212:5212 \
    -v ~/cloudreve/data:/cloudreve/data \
    cloudreve/cloudreve:latest
```

升级前请先看[升级与备份](./upgrade.md)。
