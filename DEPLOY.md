# 快速部署指南

## 自动部署（CODING CI）

> 推送代码到 CODING 仓库后，自动触发 CI 流水线：
> `npm install` → `npm run build` → `vercel deploy --prod`
>
> 无需手动操作，等待 5-7 分钟后 [moojilin55.site](https://moojilin55.site) 自动更新。

```bash
# 推送到 CODING（触发自动构建+部署）
git push origin main
```

## 手动本地构建

```bash
# 安装依赖
pnpm install   # 或 npm install

# 构建生产版本
pnpm run build
```

## 回滚操作

Vercel 每次部署都会生成独立 URL，随时可在 [Vercel Dashboard](https://vercel.com) 回滚到任意历史版本。

## 配置信息

| 项目 | 值 |
|------|-----|
| 代码托管 | CODING（主仓库） |
| 只读镜像 | GitHub（9195721/jilin-takeout） |
| 部署目标 | Vercel（moojilin55.site） |
| 构建触发 | CODING CI 流水线 |
| CI 环境变量 | `VERCEL_TOKEN`（存储在 CODING 项目设置中） |

## CODING CI 环境变量设置

在 CODING 项目中配置以下环境变量（不提交到仓库）：

1. 进入项目 → 持续集成 → 构建环境 → 环境变量
2. 添加 `VERCEL_TOKEN`，值为 Vercel Token

## 本地开发

```bash
pnpm install
pnpm run dev
```

## 部署后

访问：[https://moojilin55.site](https://moojilin55.site)
