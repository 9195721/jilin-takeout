# 吉林外卖 - Jilin Takeout

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

#### 方式一：使用脚本（推荐）

```bash
chmod +x outputs/deploy-to-vercel.sh
./outputs/deploy-to-vercel.sh
```

#### 方式二：手动部署

1. **推送到 GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/9195721/jilin-takeout.git
git push -u origin main
```

2. **Vercel 部署**
   - 访问 https://vercel.com
   - 使用 GitHub 登录
   - 点击 "Add New Project"
   - 导入 `jilin-takeout` 仓库
   - Framework Preset 选择 "Other"
   - 添加环境变量（见下方）
   - 点击 "Deploy"

### 环境变量配置

✅ **已配置**：Supabase 连接信息已写入代码，无需手动设置环境变量

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
