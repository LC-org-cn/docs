---
sidebar_position: 2
title: Docker Compose 部署
description: 使用官方 docker-compose 仓库部署 Cloudreve、PostgreSQL 和 Redis。
---

# Docker Compose 部署

一次启动 Cloudreve、PostgreSQL 和 Redis，是官方推荐的部署方式。

## 前置条件

- 已安装 Docker 和 Docker Compose v2 插件，参见 [Docker 安装文档](https://docs.docker.com/install/) 和 [Compose 安装文档](https://docs.docker.com/compose/install/)。
- 放行 `5212/tcp`；要做 BT 离线下载，再放行 `6888/tcp` 和 `6888/udp`。

## 获取编排文件

```bash
git clone https://github.com/cloudreve/docker-compose.git ~/cloudreve
cd ~/cloudreve
cp .env.example .env
```

仓库里的文件：

| 文件                     | 说明                                         |
| ------------------------ | -------------------------------------------- |
| `docker-compose.yml`     | 基础栈：Cloudreve + PostgreSQL + Redis       |
| `docker-compose.pro.yml` | Pro 版覆盖文件：换成 Pro 镜像并加入授权码    |
| `docker-compose.fts.yml` | 全文搜索附加组件：Apache Tika 和 Meilisearch |

## 启动

```bash
docker compose up -d
docker compose ps
```

三个容器都显示 `Up` 即成功。访问 `http://服务器IP:5212`，注册第一个账号，它自动成为管理员，然后继续[部署后配置](./post-install.md)。

## 参考编排

下面是基础栈的参考写法（以仓库中的文件为准）：

```yaml
services:
  cloudreve:
    image: cloudreve/cloudreve:latest
    container_name: cloudreve
    depends_on:
      postgresql:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    ports:
      - 5212:5212
      - 6888:6888
      - 6888:6888/udp
    environment:
      - CR_CONF_Database.Type=postgres
      - CR_CONF_Database.Host=postgresql
      - CR_CONF_Database.User=cloudreve
      - CR_CONF_Database.Name=cloudreve
      - CR_CONF_Database.Port=5432
      - CR_CONF_Redis.Server=redis:6379
    volumes:
      - backend_data:/cloudreve/data

  postgresql:
    image: postgres:17
    container_name: postgresql
    restart: unless-stopped
    environment:
      - POSTGRES_USER=cloudreve
      - POSTGRES_DB=cloudreve
      - POSTGRES_HOST_AUTH_METHOD=trust
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U cloudreve -d cloudreve']
      interval: 5s
      timeout: 5s
      retries: 10
    volumes:
      - database_postgres:/var/lib/postgresql/data

  redis:
    image: redis:latest
    container_name: redis
    restart: unless-stopped
    volumes:
      - redis_data:/data

volumes:
  backend_data:
  database_postgres:
  redis_data:
```

:::note `healthcheck` 加上 `condition: service_healthy` 能避免 Cloudreve 先于 PostgreSQL 就绪而首次迁移失败。没有这两处时，Cloudreve 会因为 `connection refused` 崩溃一次，靠 `restart: unless-stopped` 重启后才正常，日志里会留下一段堆栈。:::

## 生产环境建议

**给 PostgreSQL 设密码。** `POSTGRES_HOST_AUTH_METHOD=trust` 在数据库端口不出 Docker 网络时可用，但不适合长期使用：

```yaml
# postgresql 服务
environment:
  - POSTGRES_PASSWORD=换成强密码

# cloudreve 服务，追加
environment:
  - CR_CONF_Database.Password=换成强密码
```

改完执行 `docker compose down && docker compose up -d`。

**固定镜像版本。** `latest` 或 `v4` 这类移动标签会随新版本变化，`docker compose pull` 可能在你不知情时升级。生产环境请固定到具体版本，如 `cloudreve/cloudreve:4.x.y`，看过更新日志再升级。

**只暴露反代端口。** 前面有 Nginx 或 Caddy 时，把端口映射改成 `127.0.0.1:5212:5212`，只让 443 对外。

**备份。** 至少备份两样：PostgreSQL 数据库（`docker exec postgresql pg_dump -U cloudreve cloudreve > cloudreve.sql`）和 `backend_data` 卷。后者保存 `conf.ini`、头像和本地存储策略上传的文件；开启文件加密的话还有主密钥，丢了就解不开文件。

## 常见问题

**容器一直重启**

```bash
docker logs -f 容器名
```

启动失败几乎都是配置问题：数据库配置错误、Redis 配置错误、授权码错误（Pro 版）。

**报 `Please specify license key by ...`**

这是 Pro 版提示，检查 `CR_LICENSE_KEY` 环境变量是否设置正确，值来自 [Pro 授权管理面板](https://cloudreve.org/login)。社区版不会出现。

**升级**

```bash
docker compose down
docker compose pull
docker compose up -d
```

升级前请先看[升级与备份](./upgrade.md)。
