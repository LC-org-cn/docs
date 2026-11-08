---
sidebar_position: 7
title: 存储策略
description: 本地存储、Cloudflare R2 及其他存储策略的配置要点。
---

# 存储策略

存储策略决定文件实际存放在哪里。在管理后台「存储策略」添加，再到「用户组」里把策略绑定给用户组，用户才能使用。

:::warning只添加策略不绑定用户组，用户上传时会报找不到可用的存储策略。:::

## 支持的存储

| 类型 | 说明 | 官方文档 |
| --- | --- | --- |
| 本地 | 文件存在 Cloudreve 所在服务器 | [Local](https://docs.cloudreve.org/en/usage/storage/local) |
| 从机（Remote） | 文件存在从节点的磁盘上 | [Remote](https://docs.cloudreve.org/en/usage/storage/remote) |
| 阿里云 OSS |  | [OSS](https://docs.cloudreve.org/en/usage/storage/oss) |
| 腾讯云 COS |  | [COS](https://docs.cloudreve.org/en/usage/storage/cos) |
| OneDrive / SharePoint | 需在策略页授权 | [OneDrive](https://docs.cloudreve.org/en/usage/storage/onedrive) |
| Cloudflare R2 | S3 兼容 | [R2](https://docs.cloudreve.org/en/usage/storage/r2) |
| Google Cloud Storage | S3 兼容 | [GCS](https://docs.cloudreve.org/en/usage/storage/gcs) |
| MinIO | S3 兼容 | [MinIO](https://docs.cloudreve.org/en/usage/storage/minio) |
| Backblaze B2 | S3 兼容 | [B2](https://docs.cloudreve.org/en/usage/storage/b2) |
| 负载均衡 | 在多个策略间分流 | [Load Balance](https://docs.cloudreve.org/en/usage/storage/load-balance) |

## 本地存储

### 存储路径

在策略配置的「Blob 存储目录」里指定。新建的本地策略默认使用主程序同级目录下的 `data/uploads`。填相对路径时，相对于主程序所在目录。

:::tip如果启动参数用了 `--use-working-dir`，相对路径则相对于启动时的工作目录。:::

Docker 部署时，这个目录在容器内的 `/cloudreve/data/uploads`，随 `data` 卷持久化。想放到别的磁盘，额外挂载一个目录并把「Blob 存储目录」改成容器内对应路径。

### 预分配磁盘空间

Linux 和 macOS 上开启「预分配磁盘空间」后，Cloudreve 会在上传开始时预先分配空间，减少分片上传造成的磁盘碎片。

## Cloudflare R2

R2 使用 S3 兼容的存储策略。

### 配置步骤

1. 在 Cloudflare 控制台创建 R2 存储桶，进入设置，拿到桶信息。
2. 在存储策略里填写：
   - **Bucket Name**：刚创建的桶名
   - **Endpoint**：R2 提供的 `S3 API` 地址，**去掉末尾的桶名**
   - 勾选 **Force path style**
   - **Region**：填 `auto`
3. 在 R2 的 `API` → `Manage API Tokens` 创建用户 API 令牌，权限选 `Admin Read & Write`，把得到的 `Access Key ID` 和 `Secret Access Key` 填到策略的访问凭据里。

### CORS 策略

存储桶必须配置 CORS，才能用 Cloudreve 网页端上传和浏览文件。通常在添加存储策略时让 Cloudreve 自动配置即可。需要手动配置时，在 R2 桶的「设置 → CORS 策略」里添加：

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 公开存储桶

:::warning使用公开存储桶时，任何人都可以不经授权访问你的文件。:::

在 R2 桶设置里开启 `Public Access` 并绑定自定义域名，然后在存储策略里：

- 开启「下载流量使用 CDN」，在「下载 CDN」里填你的自定义域名
- **取消勾选** Force path style

### 反代私有桶的下载请求

想反代私有桶的下载请求，同样开启「下载流量使用 CDN」并填自定义域名。配置反代时注意：

- 反代目标是**不带桶名**的 R2 Endpoint，如 `https://a02xxxxxxxxx.r2.cloudflarestorage.com`
- 回源请求要**改写 `Host` 头**为该 R2 域名

Caddy 示例：

```text
reverse_proxy {
    to https://a09xxxxxxxxxxx.r2.cloudflarestorage.com
    header_up Host a09xxxxxxxxxxx.r2.cloudflarestorage.com
}
```

### R2 常见错误

| 现象 | 处理 |
| --- | --- |
| 上传报 `Request failed: AxiosError: Network Error` | 检查 Endpoint 是否正确；检查 CORS 是否已设置且正确；检查「设置 → 文件系统 → 上传会话有效期（秒）」，须小于 `604800` |
| 中转上传失败，`Unable to parse response` | 展开详细错误，若含 `413 Request Entity Too Large`，调大 Nginx 的 `client_max_body_size`，须大于上传文件大小；另外检查是否被外部 WAF 拦截 |
| 报 `failed to create multipart upload: AccessDenied` | 访问凭据不对，令牌必须有 `Admin Read & Write` 权限 |

## Cloudflare 免费版的 100 MB 限制

Cloudflare 免费套餐默认限制单个请求最大 100 MB。如果你的站点经过 Cloudflare 代理：

- 给存储策略开启**分片上传**，且分片大小必须**小于 100 MB**，即可绕过限制。
- 同时确认 Cloudflare 的缓存级别（Cache Level）设为 `Standard`。

## 其他常见问题

下载不了、缩略图不显示、一直显示「上传中」等问题，见[排错](./troubleshooting.md)。
