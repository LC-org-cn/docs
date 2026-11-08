---
sidebar_position: 5
title: 部署后配置
description: 站点地址、存储策略、用户组、反向代理、HTTPS、真实 IP、缓存与 WebDAV。
---

# 部署后配置

这些步骤官方说不是强制，但**都建议做完**。

## 在管理后台配置站点

第一个注册的用户是管理员。登录后访问 `你的域名/admin` 进入管理后台，建议先完成：

1. **站点 URL**：在「设置」里修改或添加站点地址。
2. **存储策略**：在「存储策略」里添加或修改策略，默认只有一个本地存储策略，见[存储](./storage.md)。
3. **用户组**：在「用户组」里添加或修改用户组，并**给用户组绑定存储策略**。

:::tip 站点 URL 会影响分享链接、下载链接，也是从节点回调主站的地址，务必填对。可以填多个，见[排错](./troubleshooting.md)。:::

## 配置反向代理

默认只能通过 `http://服务器IP:5212` 访问，用户直接连 Cloudreve 内置的 Web 服务。个人或小规模使用可以这样；要放到公网，建议加一层反向代理，获得日志、SSL、WAF 等能力。

### Nginx

在 `server` 块里加入：

```nginx
location / {
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $http_host;   # 重要：部分功能依赖 Host 头
    proxy_redirect off;
    proxy_pass http://127.0.0.1:5212;   # 换成你的 Cloudreve 实际地址

    # 最大上传大小。本地存储策略的分片大小、WebDAV 最大上传、中转服务最大上传
    # 理论上都不应超过这里的设置。需要时取消注释：
    # client_max_body_size 20000m;
}
```

:::warning `Host` 头必须原样转发，否则下载链接的域名会错，缩略图和下载都会失败。:::

### Caddy

```text
files.example.com {
    reverse_proxy 127.0.0.1:5212
    encode zstd gzip
    request_body {
        max_size 10GB
    }
}
```

`max_size` 按你最大的上传文件调整。Caddy 会自动申请和续期 Let's Encrypt 证书。

### 用内置 Web 服务器配置 SSL

不想用反代但需要 HTTPS，可在 `data/conf.ini` 里加：

```ini
[SSL]
Listen = :443
CertPath = /path/to/your/fullchain.pem
KeyPath = /path/to/your/privkey.pem
```

### 传递客户端真实 IP

事件日志会尝试记录客户端真实 IP。使用反代时，真实 IP 会被放进 `X-Forwarded-For` 头，需要告诉 Cloudreve 从这里取：

```ini
[System]
Mode = master
Listen = :5212
ProxyHeader = X-Forwarded-For
```

:::caution `X-Forwarded-For` 可能被客户端伪造。只有确认请求一定经过你信任的反代时才启用。:::

反代外面还有 CDN 时，请参考 CDN 服务商文档传递真实 IP。以 Cloudflare 加 Nginx 为例，需要用 `ngx_http_realip_module` 让 Nginx 从 Cloudflare 提取真实 IP：

```nginx
set_real_ip_from 192.0.2.1;            # 换成最新的 Cloudflare IP 段
real_ip_header CF-Connecting-IP;
proxy_set_header X-Forwarded-For $realip_remote_addr;
```

## 检查缓存配置

Cloudreve 用 Service Worker 缓存静态资源，版本更新后要靠检查 `sw.js` 来决定是否更新缓存。如果 Web 服务器错误地缓存了 `sw.js`，用户的页面缓存就无法正常更新。

确保以下路径**不被**缓存：

- `/sw.js`
- `/index.html`
- `/manifest.json`

一些服务器管理面板会在你不知情时加入类似下面的配置，请删除：

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
}
```

Cloudreve 内置服务器已经对静态资源做了缓存优化，这类配置会让 `sw.js` 被错误缓存。

## WebDAV

1. 在「用户组」编辑页给用户组开启 WebDAV 权限。
2. 用户在「连接与挂载」里创建 WebDAV 账号，得到的是专用密码，不是登录密码。
3. 客户端地址填 `https://你的域名/dav`。

:::note 通过反代使用 WebDAV 时，上传大小同样受 `client_max_body_size` 限制，大文件请调大。:::

## 下一步

- [配置文件与环境变量](./configuration.md)
- [存储策略](./storage.md)
- [从节点与离线下载](./slave-node.md)
