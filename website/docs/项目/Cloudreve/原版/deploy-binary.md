---
sidebar_position: 4
title: 二进制部署与进程守护
description: 下载预编译主程序，用 Supervisor 或 Systemd 守护运行。
---

# 二进制部署与进程守护

直接在服务器上运行 Cloudreve 主程序，由 Supervisor 或 Systemd 负责开机自启和异常重启。数据库和 Redis 需自行准备。

## 下载

从 [GitHub Releases](https://github.com/cloudreve/Cloudreve/releases) 下载预编译包，命名规则是 `cloudreve_版本_系统_架构`：

| 系统    | 架构                  | 包名                                   |
| ------- | --------------------- | -------------------------------------- |
| Linux   | x86_64                | `cloudreve_版本_linux_amd64.tar.gz`    |
| Linux   | ARM64                 | `cloudreve_版本_linux_arm64.tar.gz`    |
| Linux   | ARMv5 / v6 / v7       | `cloudreve_版本_linux_armv5.tar.gz` 等 |
| Linux   | LoongArch64           | `cloudreve_版本_linux_loong64.tar.gz`  |
| Windows | x86_64 / ARM64        | `cloudreve_版本_windows_amd64.zip` 等  |
| macOS   | Intel / Apple Silicon | `cloudreve_版本_darwin_amd64.zip` 等   |

想自己编译，参见[官方构建文档](https://docs.cloudreve.org/en/overview/build)。

## 试运行

```bash
tar -zxvf cloudreve_VERSION_OS_ARCH.tar.gz
chmod +x ./cloudreve
./cloudreve
```

首次启动会在主程序同级目录创建 `data/conf.ini`。默认监听 `5212`，访问 `http://服务器IP:5212`，注册第一个账号即管理员。

:::warning Cloudreve 默认以**主程序所在目录**计算相对路径。初始化并启动过之后，不要再随意改变工作目录或使用 `-w` 参数，否则本地存储策略和进行中的任务会找不到文件。:::

## 命令行参数

| 参数 | 说明 |
| --- | --- |
| `-c`, `--conf` | 指定配置文件路径，默认主程序同级的 `data/conf.ini` |
| `-w`, `--use-working-dir` | 默认 `false`，按主程序所在目录计算相对路径；设为 `true` 则按当前工作目录 |
| `-l`, `--license-key` | 仅 `server` 子命令，Pro 版授权码 |

```bash
./cloudreve -c /path/to/conf.ini
./cloudreve eject          # 提取内置静态资源
```

## 用 Supervisor 守护

```bash
sudo apt-get install supervisor
sudo mkdir -p /etc/supervisor/conf.d
sudo sh -c 'echo_supervisord_conf > /etc/supervisor/supervisord.conf'
sudo nano /etc/supervisor/supervisord.conf
```

把文件末尾 `[include]` 段的注释符 `;` 去掉，改成：

```ini
[include]
files = /etc/supervisor/conf.d/*.conf
```

创建应用配置 `/etc/supervisor/conf.d/cloudreve.conf`：

```ini
[program:cloudreve]
directory=/home/cloudreve                ; 主程序所在目录
command=/home/cloudreve/cloudreve        ; 主程序路径
autostart=true
autorestart=true
stderr_logfile=/var/log/cloudreve.err
stdout_logfile=/var/log/cloudreve.log
environment=CODENATION_ENV="prod"
```

启动和管理：

```bash
supervisord -c /etc/supervisor/supervisord.conf
sudo supervisorctl start cloudreve
sudo supervisorctl stop cloudreve
sudo supervisorctl status cloudreve
```

## 用 Systemd 守护

创建 `/etc/systemd/system/cloudreve.service`，把 `/PATH_TO_CLOUDREVE` 换成主程序所在目录：

```ini
[Unit]
Description=Cloudreve
Documentation=https://docs.cloudreve.org
After=network.target
Wants=network.target

[Service]
WorkingDirectory=/PATH_TO_CLOUDREVE
ExecStart=/PATH_TO_CLOUDREVE/cloudreve
Restart=on-abnormal
RestartSec=5s
KillMode=mixed

[Install]
WantedBy=multi-user.target
```

数据库在本机且由 Systemd 管理时，在 `[Unit]` 里加上对应的 `After=`，如 `After=mysqld.service` 或 `After=postgresql.service`，保证先启动数据库。

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudreve
sudo systemctl start cloudreve

sudo systemctl restart cloudreve
sudo systemctl status cloudreve
sudo journalctl -u cloudreve -f      # 看日志
```

## 配置数据库

首次启动后编辑 `data/conf.ini`，加入数据库配置：

```ini
[System]
Mode = master
Listen = :5212

[Database]
Type = mysql
Port = 3306
User = cloudreve
Password = cloudreve
Host = 127.0.0.1
Name = cloudreve
```

支持 `postgres`、`mysql`、`sqlite`（以及 `mariadb`）。改完需要重启 Cloudreve。完整字段见[配置文件](./configuration.md)。

## 配置 Redis

```ini
[Redis]
Server = 127.0.0.1:6379
Password = your_redis_password
DB = 0
```

改完需要重启。

## 下一步

继续[部署后配置](./post-install.md)。
