---
sidebar_position: 10
title: 常见问题与排错
description: 部署、上传下载、反向代理、节点与离线下载的常见问题汇总。
---

# 常见问题与排错

排错的第一步永远是看日志：

```bash
docker logs -f cloudreve                # Docker
docker compose logs -f cloudreve        # Docker Compose
sudo journalctl -u cloudreve -f         # Systemd
```

需要更多信息时开启 `Debug = true`，见[配置文件](./configuration.md)，排完记得关掉。

## 启动与部署

| 现象 | 原因与处理 |
| --- | --- |
| 容器反复重启 | 看日志。常见原因：数据库配置错误、Redis 配置错误、授权码错误（Pro 版） |
| 报 `Please specify license key by ...` | Pro 版没有正确设置 `CR_LICENSE_KEY`，值来自 Pro 授权管理面板。社区版不应出现 |
| Docker Compose 首次启动出现 `connection refused` 堆栈后才正常 | Cloudreve 先于 PostgreSQL 就绪。给 PostgreSQL 加 `healthcheck`，并让 Cloudreve 用 `condition: service_healthy` 依赖它，见 [Docker Compose 部署](./deploy-docker-compose.md) |
| 改了 `conf.ini` 里的数据库或 Redis 配置不生效 | 这些配置是启动容器时用环境变量传入的，环境变量优先且无法靠改文件覆盖。改环境变量并重建容器 |
| 配置文件里的密码含 `#` 或 `;` 后连不上 | 这两个字符后面会被当成注释，用反引号包起来，如 ``Password = `#123456` `` |
| 重启后缓存丢了（没配 Redis） | 内存缓存只在**正常退出**时才持久化到 `cache_persist.bin`，异常退出会丢，生产环境建议配置 Redis |
| 初始化后改了工作目录，找不到本地文件 | 默认以主程序所在目录计算相对路径，初始化后不要随意改变工作目录或 `-w` 参数 |
| 找不到初始管理员密码 | v4 不预置管理员，也不在日志里打印密码。**第一个注册的账号**就是管理员 |

## 上传与下载

| 现象 | 原因与处理 |
| --- | --- |
| 文件下载不了、缩略图不显示 | 按顺序检查：1. 站点 URL 设置，下载链接的域名是否在站点 URL 列表里，不在就添加，然后在「管理后台 → 文件系统」底部点「清除 Blob URL 缓存」再试；2. 是否在 HTTPS 环境下用了 HTTP 的站点 URL；3. 服务器时间和客户端时间是否相差过大，同步时间后清除 Blob URL 缓存再试；4. 用了 Cloudflare 的话，缓存级别要设为 `Standard` |
| 下载链接里的域名不是我正在使用的那个 | 到「管理后台 → 设置 → 基本」检查当前站点 URL 是否在列表里，不在则添加，再清除 Blob URL 缓存。在列表里但链接域名仍不对，说明反代没有正确转发 `Host` 头，Nginx 里加 `proxy_set_header Host $host;` |
| 文件显示上传成功，列表里仍是「上传中」 | 检查是否被外部 WAF 拦截了上传请求 |
| 上传失败，提示 `Cannot parse response` | 展开详细错误，含 `413 Request Entity Too Large` 的话，调大 Nginx 的 `client_max_body_size`（开启分片上传时须大于分片大小，没开启时须大于文件大小）；另外检查是否被 WAF 拦截 |
| 经过 Cloudflare 后，大于 100 MB 的文件传不上去 | Cloudflare 免费套餐限制单请求 100 MB。给存储策略开启分片上传，分片大小设为小于 100 MB |
| 前端更新后页面还是旧的，或者无法更新缓存 | Web 服务器缓存了 `sw.js`。确保 `/sw.js`、`/index.html`、`/manifest.json` 不被缓存，并删除面板自动加的静态资源 `expires` 配置 |
| 事件日志里记录的 IP 全是反代的 IP | 配置 `ProxyHeader = X-Forwarded-For`；前面还有 CDN 的话，按 CDN 文档传递真实 IP，见[部署后配置](./post-install.md) |

## 站点与反向代理

| 现象 | 原因与处理 |
| --- | --- |
| 分享链接、下载链接的地址不对 | 站点 URL 没设对。多个地址用英文逗号分隔，且**每段都要带** `https://` 或 `http://` |
| 部分功能异常，反代后才出现 | 反代必须转发 `Host` 头，Nginx 用 `proxy_set_header Host $http_host;` |
| 从节点回调不到主站 | 主站站点 URL 里的主地址必须是从节点能访问到的地址 |

## 存储

| 现象 | 原因与处理 |
| --- | --- |
| R2 上传报 `Network Error` | 检查 Endpoint、CORS 策略，以及「上传会话有效期」须小于 `604800` |
| R2 上传报 `AccessDenied` | 访问凭据不对，令牌需要 `Admin Read & Write` 权限 |
| 添加了策略但用户传不了文件 | 没有给用户组绑定该策略 |

详细说明见[存储策略](./storage.md)。

## 从节点与离线下载

从节点通信失败、任务失败、离线下载转存失败等问题的完整排错表，见[从节点与离线下载](./slave-node.md)。常用的几条：

| 现象 | 原因与处理 |
| --- | --- |
| 节点测试通信报 `invalid sign` | 密钥不一致，或主从时间相差过大 |
| 报 `Master: 4.x.x., Slave: 4.x.x.` | 主从版本不一致 |
| 离线下载转存报 `no such file or directory` | Cloudreve 和下载器没有共享同一个临时下载目录 |

## 迁移

| 现象        | 原因与处理                                                   |
| ----------- | ------------------------------------------------------------ |
| v3 迁移中断 | 重新运行迁移命令，会按 `migration_state.json` 记录的进度继续 |

## 仍然解决不了

1. 看官方文档 [docs.cloudreve.org](https://docs.cloudreve.org)。
2. 到上游仓库 [cloudreve/Cloudreve](https://github.com/cloudreve/Cloudreve) 搜索已有 Issue。
3. 提 Issue 时附上版本号、部署方式、相关日志（开 Debug 后的日志注意脱敏）。
