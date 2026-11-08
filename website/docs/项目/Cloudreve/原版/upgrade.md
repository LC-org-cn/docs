---
sidebar_position: 9
title: 升级与备份
description: v4 小版本升级、备份清单，以及从 v3 迁移到 v4。
---

# 升级与备份

## 备份

升级前先备份，哪怕升级理论上不会改动现有数据库。

| 要备份的 | 怎么做 |
| --- | --- |
| 数据库 | MySQL 用 [`mysqldump`](https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html)；PostgreSQL 用 `pg_dump`；SQLite 直接复制 `cloudreve.db` 文件 |
| `data` 目录 | 内含 `conf.ini`、头像、临时文件，以及**本地存储策略上传的文件**。Docker 部署备份挂载的数据卷 |
| 外部存储 | 使用 S3、OSS 等对象存储时，文件在对象存储里，按对应服务商的方式备份 |

```bash
# PostgreSQL（Docker Compose 示例）
docker exec postgresql pg_dump -U cloudreve cloudreve > cloudreve.sql
```

:::warning只备份数据库不够。没有 `data` 目录，你会丢失本地上传的文件，开启文件加密的话还会丢失主密钥，加密文件将无法解密。:::

## 升级 v4 小版本

以下步骤只适用于 **v4.x.x 内部**升级。

### 二进制部署

替换主程序文件为新版本，然后重启 Cloudreve。

### Docker 单容器

```bash
docker stop cloudreve
docker rm cloudreve
docker pull cloudreve/cloudreve:latest

# 参数与之前启动时保持一致，尤其是 -v 挂载的数据目录
docker run -d --name cloudreve \
    -p 5212:5212 \
    -v ~/cloudreve/data:/cloudreve/data \
    cloudreve/cloudreve:latest
```

### Docker Compose

```bash
docker compose down
docker compose pull
docker compose up -d
```

### 升级之后

使用了从节点的话，**把从节点的 Cloudreve 也升级到相同版本**，否则节点通信会报版本不一致。

:::tip生产环境建议固定镜像版本（如 `cloudreve/cloudreve:4.x.y`），读过更新日志再手动升级，不要依赖 `latest`。:::

## 从 v3 迁移到 v4

官方提供了迁移工具，把 v3 数据库的数据转换后写入 v4 数据库。**请先完整备份。**

### 1. 备份配置

备份现有 v3 的 `conf.ini`。

### 2. 准备 v4 程序和配置

```bash
# 把 v4 主程序重命名为 cloudreve
mv cloudreve_v4 cloudreve

# 创建 v4 的数据目录
mkdir data

# 复制 v3 的配置文件到数据目录
cp conf.ini data/conf.ini

# 修改数据库连接信息
nano data/conf.ini
```

在 `data/conf.ini` 里，把 `Database` 的 `Name` 改成 **v4 使用的新数据库名**，或指定一个新的 SQLite 文件。**请新建一个与 v3 分开的数据库**，不要复用 v3 的。

### 3. 运行迁移工具

```bash
./cloudreve migrate --v3-conf conf.ini -c data/conf.ini
```

`-c` 指定 v4 配置文件，`--v3-conf` 指定 v3 配置文件。工具会读取 v3 数据库，转换成 v4 格式写入 v4 数据库。数据量大时可能运行**几分钟到几小时**。

### 4. 启动 v4

迁移完成后启动：

```bash
./cloudreve
```

### 迁移中断了怎么办

重新运行迁移工具即可。Cloudreve 会把进度保存在 `migration_state.json`，再次运行时会从中断处继续。想从头开始迁移，请参考[官方文档](https://docs.cloudreve.org/en/maintain/upgrade-from-v3)。

## 升级到 Pro

参见[官方文档](https://docs.cloudreve.org/en/maintain/upgrade-to-pro)。
