# 吉林外卖 - Jilin Takeout

> **代码托管**: [CODING](https://coding.net) | **镜像**: [GitHub](https://github.com/9195721/jilin-takeout)（只读）
>
> **自动化部署**: CODING CI → Vercel（push 即部署）

一个基于 React + TypeScript + Tailwind CSS + Supabase 的外卖平台应用。

## 技术栈

- **前端**: React 18 + TypeScript + Tailwind CSS
- **UI 设计**: Liquid Glass (液态玻璃) 风格
- **后端**: Supabase (PostgreSQL + Auth + Storage)
- **部署**: Vercel

## 功能特性

- 用户注册/登录
- 商家浏览与搜索
- 分类筛选
- 收藏与点赞
- 订单管理
- 优惠券系统
- 消息通知
- 评价系统

## 快速开始

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build
```

### 部署到 Vercel

> 部署通过 CODING 持续集成自动化完成，每次 push 到 CODING 仓库后自动触发构建与部署。

#### 手动触发构建（本地开发时）

```bash
# 推送到 CODING，CI 自动部署
git push origin main
```

#### Vercel 部署历史

访问 [Vercel Dashboard](https://vercel.com/dashboard) 查看部署记录和回滚。

### 环境变量配置

> 所有敏感配置（Supabase、COS 等）已在代码中硬编码，不需要手动设置。
>
> Vercel Token 存储在 CODING 项目 CI 环境变量中（`VERCEL_TOKEN`），不对外暴露。

## 项目结构

```
├── src/
│   ├── components/     # 公共组件
│   ├── layouts/        # 布局组件
│   ├── pages/          # 页面组件
│   │   ├── consumer/   # 用户端页面
│   │   ├── merchant/   # 商家端页面
│   │   ├── admin/      # 管理端页面
│   │   └── auth/       # 认证页面
│   ├── supabase/       # Supabase 客户端
│   ├── styles/         # 全局样式
│   └── utils/          # 工具函数
├── functions/          # Edge Functions
├── migrations/         # 数据库迁移
├── dist/              # 构建输出
└── vercel.json        # Vercel 配置
```

## 设计系统

### Liquid Glass 风格

- **背景**: 深色渐变 `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`
- **卡片**: `bg-white/15 backdrop-blur-[40px] backdrop-saturate-[180%]`
- **边框**: `border-white/30`
- **阴影**: `shadow-[0_16px_48px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.35)]`
- **文字**: 白色系，使用透明度区分层次

## 许可证

MIT
