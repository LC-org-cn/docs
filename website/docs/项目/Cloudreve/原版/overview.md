---
sidebar_position: 1
title: 概览与部署规划
description: 原版 Cloudreve v4 的部署方式、数据库与 Redis 选择、端口与版本说明。
---

# 概览与部署规划

本章讲**原版 Cloudreve**（上游官方项目，Go 实现）如何部署、配置和维护。内容以官方文档 [docs.cloudreve.org](https://docs.cloudreve.org) 为准，并补充了常见问题。

:::note本章按**社区版**（GPL-3.0）编写。Pro 版需要授权码，启动时通过环境变量 `CR_LICENSE_KEY` 或命令行参数 `--license-key` 传入，其余部署流程相同。:::

## 选择部署方式

| 部署方式 | 内容 |
| --- | --- |
| [Docker Compose](./deploy-docker-compose.md) | 多容器：Cloudreve、Redis、PostgreSQL、离线下载器（Aria2）、缩略图组件（VIPS、FFMpeg、LibreOffice）、视频信息提取（FFProbe） |
| [Docker 单容器](./deploy-docker.md) | 官方镜像一个容器，内含 Aria2、缩略图组件和 FFProbe；数据库和 Redis 需自行配置 |
| [二进制 + 进程守护](./deploy-binary.md) | 直接运行主程序，用 Supervisor 或 Systemd 守护；数据库和 Redis 需自行配置 |

官方推荐 Docker Compose 或 Docker 单容器：更好管理，功能也更完整。只想本地试用，下载二进制直接运行即可。

## 数据库

支持 MySQL、MariaDB、PostgreSQL 和 SQLite。

- 不配置数据库时默认使用 SQLite，数据在 `data/cloudreve.db`。
- SQLite 不适合高并发，生产环境请使用 PostgreSQL 或 MySQL。
- Docker Compose 部署默认已配好 PostgreSQL。

## Redis

Redis 是可选的，用作键值缓存。

- 不配置 Redis 时使用内存缓存，并在程序**正常退出**时把缓存持久化到 `cache_persist.bin`。
- 异常退出（如被 `kill -9`）可能丢失未持久化的缓存。

## 端口

| 端口 | 用途 |
| --- | --- |
| `5212/tcp` | Web 界面和 API，默认监听 |
| `6888/tcp` 与 `6888/udp` | Aria2 的 BT 下载监听，仅在使用官方镜像内置 Aria2 做 BT 下载时需要映射 |
| `443/tcp` | 使用内置 SSL 时的监听端口，见[配置文件](./configuration.md) |

## 参考配置

第三方实测 2 vCPU、4 GB 内存可以流畅运行 Cloudreve + PostgreSQL + Redis，镜像体积合计约 600 MB，其余空间留给上传文件和数据库增长。这不是官方硬性要求。

## 部署流程总览

1. 选择部署方式并启动。
2. 浏览器访问 `http://服务器IP:5212`，注册第一个账号，**第一个注册的账号自动成为管理员**。
3. 进入 `/admin` 管理后台，设置站点地址、添加存储策略、给用户组绑定策略，见[部署后配置](./post-install.md)。
4. 配置反向代理和 HTTPS。
5. 按需配置[存储](./storage.md)、[从节点与离线下载](./slave-node.md)。
6. 做好[备份和升级](./upgrade.md)的准备。

:::note Cloudreve v4 不会预置管理员账号，也不会在日志里打印初始密码（v3 会），请不要去日志里找密码。:::
