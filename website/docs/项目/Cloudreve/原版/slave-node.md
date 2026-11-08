---
sidebar_position: 8
title: 从节点与离线下载
description: 添加从节点、启用节点功能、负载均衡，以及用 Aria2 或 qBittorrent 做离线下载。
---

# 从节点与离线下载

可以在其他服务器上以**从机模式**运行 Cloudreve。主站能与它通信，把任务分派过去执行，或把它当作文件存储节点。

## 添加从节点

1. 进入「管理后台 → 节点 → 新建节点」，弹窗里会给出从机的配置文件内容。
2. 在要做从节点的服务器上创建 `conf.ini`，粘贴弹窗里的内容，监听端口等可以按需修改：

   ```bash
   mkdir -p ~/cloudreve_slave/data
   nano ~/cloudreve_slave/conf.ini
   ```

   配置的核心大致是：

   ```ini
   [System]
   Mode = slave
   Listen = :5212

   [Slave]
   Secret = 弹窗里给出的密钥
   ```

3. 把**与主站相同版本**的 Cloudreve 主程序放到 `~/cloudreve_slave`，启动：

   ```bash
   ./cloudreve
   # 或指定配置文件路径
   ./cloudreve -c data/conf.ini
   ```

4. 回到管理后台新建节点的表单，填节点名称和地址，**测试通信**。失败的话可以先保存，按下文排错。
5. 可选：参照[二进制部署](./deploy-binary.md)用进程守护工具运行从节点。
6. 可选：参照[反向代理](./post-install.md)给从节点配反代。

:::warning 从节点和主站的 Cloudreve **版本必须一致**，升级主站时也要同步升级从节点。:::

## 启用节点功能

添加节点后，进入节点设置页可以开启各项功能。

### 压缩与解压

开启后，在线压缩和解压任务会分派到该节点，文件的下载、处理和传输都在该节点完成。

- 创建压缩包：节点先压缩到临时目录再传输，所需空间等于压缩包大小。
- 解压：`zip` 格式要先把完整压缩包下载到临时目录再解压，所需空间等于压缩包大小；其他格式整个解压过程不写磁盘。

### 远程下载

见下文[离线下载](#离线下载)。

### 存储文件

把节点当存储用，见[官方 Remote 存储文档](https://docs.cloudreve.org/en/usage/storage/remote)。

## 负载均衡

用户创建任务时没有指定节点、而有多个可用节点时，Cloudreve 用**加权轮询**选择。权重在「节点设置 → 负载均衡权重」里设置。例如节点 A 权重 3、节点 B 权重 2，每 5 个任务请求里 A 被选 3 次、B 被选 2 次。

## 从节点排错

| 现象 | 原因与处理 |
| --- | --- |
| 通信失败：`Failed to connect to node: Post "xxx": connect: xxx` | 检查节点地址是否正确、端口是否在防火墙放行。如果错误末尾是 `status code: xxx`，说明地址指向了别的 Web 服务，或请求被 WAF 拦截 |
| 通信失败：`Successfully connected to slave node, but slave returns: ...` | 主站连得上从机，但从机返回了错误，按末尾的具体错误处理，见下面几行 |
| 末尾是 `invalid sign` | 签名校验失败。检查从机配置 `[Slave]` 下的 `Secret` 是否与后台该节点的「从机密钥」一致，改完要重启从机；检查主从服务器时间是否相差过大，有的话先同步时间 |
| 末尾是 `Master: 4.x.x., Slave: 4.x.x.` | 主从版本不一致，把从机换成与主站相同的版本 |
| 末尾是 `Get "xxx/api/v4/site/ping"` 或 `invalid character '<' looking for beginning of value` | 从机访问不到主站。检查主站「设置 → 基本 → 站点 URL」里的主地址是否正确（从机必须能访问它），以及主从之间的防火墙 |
| 任务在从机上失败或部分失败 | 原因很多。在主站后台找到失败任务，用它的 `Request ID` 到从机日志里搜索具体原因。常见原因：任务超时、网络波动 |

从节点任务队列的默认配置：

| 配置项       | 默认值   |
| ------------ | -------- |
| 工作线程数   | 15       |
| 最大执行时间 | 86400 秒 |
| 退避因子     | 4        |
| 最大退避时间 | 3600 秒  |
| 重试延迟     | 5 秒     |
| 最大重试次数 | 5        |

觉得默认值导致任务失败，可在从机配置文件里用 `[OptionOverwrite]` 覆盖：

```ini
[OptionOverwrite]
queue_slave_worker_num = 15
queue_slave_max_execution = 2800
queue_slave_backoff_factor = 4
queue_slave_backoff_max_duration = 3600
queue_slave_max_retry = 5
queue_slave_retry_delay = 5
```

## 离线下载

Cloudreve 可以配合 [Aria2](https://aria2.github.io/) 或 [qBittorrent](https://www.qbittorrent.org/) 做离线下载。用户可以创建磁力链接、HTTP（仅 Aria2）和种子文件的下载任务，由服务器下载，完成后加入用户的文件。

离线下载也能在从节点上执行，把任务分摊到多台服务器，避免占满主机资源。每个负责离线下载的节点都需要运行一套 Cloudreve 和下载器（Aria2 或 qBittorrent），**下载和转存都发生在目标节点上**。

### 准备下载器

要在从节点上做离线下载，先按上文添加节点。在 Cloudreve 同一台服务器上做则跳过。

下载器必须和 Cloudreve 进程**共享同一文件系统**，至少有一个共同的挂载目录来存放下载的文件。

**Aria2**：在配置文件里启用 RPC 并设置 RPC 密钥：

```ini
enable-rpc=true
rpc-listen-port=6800
rpc-secret=你的令牌
```

也可以命令行直接启动：

```bash
aria2c --enable-rpc --rpc-secret=your_rpc_secret --rpc-listen-port=6800
```

**官方镜像已内置 Aria2**，与 Cloudreve 在同一容器里，不需要另外安装。它监听容器内回环地址的 `6800` 端口，**没有设置 RPC 令牌**。要做 BT 下载，启动镜像时映射 `6888` 端口（TCP 和 UDP），有条件的话用宿主机网络（`--network host`）获得更好的传输性能。

**qBittorrent**：安装高于 `4.4` 版本，启动后在设置里开启 Web UI 并设置用户名和密码。qBittorrent 只支持磁力链接和种子文件，不支持 HTTP 下载。

### 配置节点

下载器启动后，在 Cloudreve 节点设置里：在「启用的功能」中勾选「远程下载」，再配置：

| 配置项 | 填写 |
| --- | --- |
| RPC 服务器地址 / Web UI 地址 | Aria2 的 RPC 地址或 qBittorrent 的 Web UI 地址 |
| RPC 授权令牌 / 访问凭据 | Aria2 的 RPC Secret，或 qBittorrent 的 Web UI 用户名和密码 |
| 临时下载目录 | 下载文件存放的目录。留空使用默认的「临时下载目录」，通常是 Cloudreve 同级的 `data/temp`。Cloudreve 需要对它有读、写、执行权限 |

:::warning临时下载目录的**绝对路径**必须同时被 Cloudreve 和下载器访问，且指向**同一个目录**。:::

非容器环境通常没问题。Cloudreve 或下载器在容器里时文件系统是隔离的，需要挂载：

- **Cloudreve 在容器里、下载器在宿主机**：把容器的 `/cloudreve/data` 挂载到宿主机同路径 `/cloudreve/data`；或在节点下载器配置里指定另一个目录（如 `/var/www/cloudreve/download/temp`），再把它挂载到宿主机同路径：

  ```bash
  docker run -d --name cloudreve \
    -v /var/www/cloudreve/download/temp:/var/www/cloudreve/data/temp \
    -p 5212:5212 \
    cloudreve/cloudreve:latest
  ```

- **下载器在容器里、Cloudreve 在宿主机**：把下载器容器的对应目录挂载到宿主机同路径。
- **两者在不同容器里**：两个容器都把该目录挂载到宿主机的同一路径。

使用官方完整镜像（Aria2 在同一容器里）时，不需要关心 Aria2 的路径问题。

### 下载器任务参数

可以配置 Cloudreve 创建任务时额外传给下载器的参数。Aria2 的参数见 [Aria2 官方文档](https://aria2.github.io/manual/en/html/aria2c.html#id2)，用 JSON 格式填写：

```json
{
  "max-download-limit": "100K",
  "max-concurrent-downloads": 5,
  "bt-tracker": ["udp://tracker.opentrackr.org:1337/announce"],
  "seed-ratio": 1.0,
  "seed-time": 1000
}
```

用户组级别也可以用类似的 JSON 单独配置。

### 给用户组开权限

节点下载器配置好后，在对应用户组的编辑页**开启远程下载权限**。

### 离线下载常见问题

| 现象 | 处理 |
| --- | --- |
| 任务完成或失败后文件没被删除 | Cloudreve 会延迟几分钟再删。长时间不删，检查 Cloudreve 对临时下载目录有没有权限 |
| 下载完成后转存失败，错误含 `no such file or directory` | Cloudreve 和下载器没有共享文件系统，或临时下载目录没有挂载到同一目录 |
| BT 下载很慢或没速度 | 由下载器处理，Cloudreve 无法优化。可以手动加 Tracker，如在 Aria2 配置里设置 `bt-tracker`，列表可用 [trackerslist](https://github.com/ngosang/trackerslist) 项目每日更新的 |
| 任务状态更新不及时 | Cloudreve 用异步队列监控下载任务，进度会有延迟，耐心等待 |
| 测试通信报 `dial tcp xxx: connect: connection refused` | 检查下载器是否正常运行、RPC 地址或 Web UI 地址是否正确；在容器里运行时检查端口有没有映射到宿主机 |
| qBittorrent 任务添加后报 `failed to get task status after x retry` | 磁力链接可能短时间内拿不到详细信息导致任务没创建；种子文件任务请检查主站站点 URL 是否正确，因为下载器要通过这个地址下载种子；HTTP 链接 qBittorrent 不支持，请用 Aria2；也可能是 qBittorrent 里已有相同任务，无法重复创建 |
| Aria2 报 `Infohash is already registered` | Aria2 里已有相同任务，暂不支持重复创建 |
