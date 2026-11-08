---
sidebar_position: 6
title: 配置文件与环境变量
description: conf.ini 结构、CR_CONF_ 环境变量覆盖、Docker 中定位配置文件、Debug 模式。
---

# 配置文件与环境变量

Cloudreve 的配置分两部分：**程序运行必需的关键配置**在配置文件里，**其他应用层配置**在数据库里（管理后台修改）。本页介绍配置文件。

默认配置文件是 `data/conf.ini`，也可以启动时指定：

```bash
./cloudreve -c /path/to/conf.ini
```

修改后需要**重启** Cloudreve 才生效。

## 配置文件结构

```ini
[System]
; 运行模式：master 或 slave
Mode = master
; HTTP 监听端口，默认 5212
Listen = :5212
; 是否开启 Debug 模式，默认 false
Debug = false
; 用来传递客户端 IP 的头，默认空。头里有多个 IP 用 , 分隔时取第一个
; 反代部署可设为 X-Forwarded-For，但有被伪造的风险，确认可信时才用
ProxyHeader =
; 安全退出的最长缓冲时间，默认 0 不限制
GracePeriod = 0
; 日志级别：debug / info / warning / error，默认 info
LogLevel = info
; pprof 监听地址，如 localhost:6060，空则关闭
Pprof =

[SSL]
; SSL 监听端口，默认 443
Listen = :443
CertPath =
KeyPath =

; 启用 Unix Socket 监听
[UnixSocket]
Listen = /run/cloudreve/cloudreve.sock
; 生成的 socket 文件权限
Perm = 0666

; 只想用内置 SQLite 的话，可以删掉整个 [Database] 段
[Database]
; 类型：sqlite / mysql / postgres / mariadb，默认 sqlite
Type = sqlite
Port = 3306
User =
Password =
Host = 127.0.0.1
Name = cloudreve
; 连接字符集，默认 utf8mb4
Charset = utf8mb4
; SQLite 文件路径，默认 data/cloudreve.db
DBFile = cloudreve.db
; 是否用 Unix Socket 连接，开启后在 Host 里填 socket 路径
UnixSocket = false
; 连接串，设置后其他数据库配置忽略，但 Type 仍然必填
; MySQL 示例：root:123456@tcp(127.0.0.1:3306)/cloudreve?charset=utf8mb4&parseTime=True&loc=Local
DatabaseURL =

; 从节点模式配置
[Slave]
; 通信密钥
Secret =
; 回调请求超时（秒），默认 20
CallbackTimeout = 20
; 签名有效期（秒），默认 600
SignatureTTL = 600

[CORS]
AllowOrigins = *
AllowMethods = OPTIONS,GET,POST
AllowHeaders = *
AllowCredentials = false

[Redis]
; 连接类型，默认 tcp
Network = tcp
; 地址，默认空即不启用
Server = 127.0.0.1:6379
Password =
DB = 0
User =
UseTLS = false
TLSSkipVerify = false

; 从节点覆盖主站的设置，直接用「设置名 = 值」
[OptionOverwrite]
queue_slave_worker_num = 50
```

:::tip配置值里含有 `#` 或 `;` 时，它后面的内容会被当成注释。用反引号包起来即可：

```ini
Password = `#123456`
```

:::

## 用环境变量覆盖配置

配置文件里的**任何值**都能用 `CR_CONF_` 前缀的环境变量覆盖，容器部署时尤其方便。格式是：

```text
CR_CONF_<段名>.<键名>=<值>
```

例如：

```bash
CR_CONF_System.Listen=:8080
CR_CONF_Database.Type=mysql
CR_CONF_Database.Host=127.0.0.1
CR_CONF_Redis.Server=127.0.0.1:6379
```

覆盖值在启动时合并进配置，**优先级高于** `conf.ini`。

### 双下划线分隔符

一些平台（如 Fly.io 的 `fly.toml`、旧版 Docker Compose）会把环境变量名里的 `.` 当成嵌套路径，导致变量被拒绝或丢弃。这时可以用 `__` 代替 `.`：

```toml
[env]
  CR_CONF_System__Listen = ":8080"
  CR_CONF_Database__Type = "mysql"
```

两种写法等价。格式错误的条目（缺少段名或键名）会记录警告并跳过，不会导致启动失败。

## Docker 中的配置文件在哪

容器内路径是 `/cloudreve/data/conf.ini`，在你挂载的目录里能找到。不确定挂载位置时：

```bash
docker container ls | grep cloudreve
docker inspect --format="{{.Mounts}}" 容器ID
```

输出里的 Source 路径（如 `/var/lib/docker/volumes/cloudreve_backend_data/_data`）就是宿主机上的目录。改完配置重启容器生效。

:::warning用环境变量启动容器时传入的配置，不能再通过编辑 `conf.ini` 修改，要改环境变量并重建容器。:::

## Debug 模式

```ini
[System]
Mode = master
Listen = :5212
Debug = true
```

开启后：

- 日志级别强制为 `debug`，无视配置文件里的设置
- 启动时打印所有可用路由
- 所有数据库查询打印详细日志，**可能包含敏感信息**
- 展示给用户的错误信息会带上原始错误

排错完请关掉，不要长期开启。
