---
title: Markdown 示例文档
description: 一份纯 .md 写法示例，验证 Docusaurus 对标准 Markdown 的兼容
sidebar_position: 1
tags: [示例, Markdown]
---

# Markdown 示例文档

本页用纯 `.md`（标准 Markdown）编写，验证你的站点无需任何配置即可兼容。

## 标题层级

### 三级标题

正文段落：**加粗**、_斜体_、`行内代码`、[链接](https://docusaurus.io)。

## 列表

- 无序列表项一
- 无序列表项二
  - 嵌套项 A
  - 嵌套项 B

1. 有序列表一
2. 有序列表二

## 代码块

```bash
pnpm install
pnpm start:website
```

```ts
function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

## 表格

| 语法          | 是否支持      |
| ------------- | ------------- |
| 标准 Markdown | ✅            |
| 代码高亮      | ✅            |
| front matter  | ✅            |
| JSX 组件      | ❌（需 .mdx） |

## 引用

> 这就是纯 Markdown 文档的全部写法。无需改配置，放进 `docs/` 即可被站点收录。
