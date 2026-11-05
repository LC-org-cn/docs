# 部署说明（GitHub Pages）

本仓库站点通过 **GitHub Actions + GitHub Pages** 自动构建与发布。

## 线上地址

- 站点根：`https://doc.legspcpd.top`（自定义域名，由仓库管理员在 Pages 设置中绑定 CNAME）

## 工作流

- 触发：推送到 `main` 分支。
- 构建：`pnpm install --frozen-lockfile` → `pnpm build:website`（`DOCUSAURUS_LOCALES=zh-CN,en`）。
- 产物：`website/build/`，末尾写入 `.nojekyll` 以保留下划线路径。
- 发布：`actions/upload-pages-artifact` + `actions/deploy-pages`（Environment: github-pages）。

## 本地预览

```bash
pnpm install
pnpm build:website
pnpm serve:website
```

## 说明

- 旧的 Cloudflare Worker/Pages 部署已废弃，相关 `cloudflare/` 目录与 `CLOUDFLARE.md` 已移除。
- 如需重新绑定自定义域名，请在仓库 Settings → Pages 中设置 CNAME，并开启 Enforce HTTPS。
