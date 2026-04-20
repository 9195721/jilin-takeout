# 快速部署指南

## 一键部署

```bash
chmod +x outputs/quick-deploy.sh
./outputs/quick-deploy.sh
```

## 手动步骤

### 1. 构建项目
```bash
pnpm run build
```

### 2. 推送到 GitHub
```bash
git init
git add .
git commit -m "Deploy"
git remote add origin https://github.com/9195721/jilin-takeout.git
git push -u origin main
```

### 3. Vercel 部署
1. 访问 https://vercel.com
2. GitHub 登录 → Add New Project
3. 导入 `jilin-takeout`
4. Framework Preset: **Other**
5. 点击 Deploy

## 配置信息

- **Supabase**: 已内置在代码中
- **主题**: Liquid Glass (液态玻璃)
- **GitHub**: 9195721/jilin-takeout

## 部署后

获得域名：`https://jilin-takeout-xxx.vercel.app`
