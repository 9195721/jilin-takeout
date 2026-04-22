---
name: admin-backend-system
overview: 为吉林外卖平台补全完整后台管理系统：数据库扩展（运营字段+日志表+轮播图表+公告表）+ 6个新管理页面 + 简易权限体系 + 操作日志，基于现有 Supabase + React 18 + Tailwind 技术栈。
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Dark Admin Dashboard
    - Professional Enterprise
    - Sidebar Navigation
    - Data-Dense Tables
    - Purple Accent Theme
    - Framer Motion Micro-interactions
  fontSystem:
    fontFamily: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
    heading:
      size: 24px
      weight: 700
    subheading:
      size: 18px
      weight: 600
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#7C3AED"
      - "#6D28D9"
      - "#5B21B6"
    background:
      - "#0F172A"
      - "#1E293B"
      - "#334155"
    text:
      - "#F8FAFC"
      - "#CBD5E1"
      - "#94A3B8"
    functional:
      - "#10B981"
      - "#EF4444"
      - "#F59E0B"
      - "#3B82F6"
todos:
  - id: db-migration
    content: 编写并执行 SQL 迁移脚本：merchants 加 7 个运营字段 + profiles 加 3 个管理字段 + 新建 admin_logs/banners/announcements 3 张表 + RLS 策略 + 种子数据
    status: completed
  - id: types-update
    content: 更新 types.ts：新增字段类型定义 + 3 张新表的 Row/Insert/Update 类型 + AdminContext 相关类型
    status: completed
    dependencies:
      - db-migration
  - id: auth-permissions
    content: 搭建权限体系：创建 AdminContext + useAdmin Hook + ProtectedRoute 升级支持 permission 控制 + role 扩展(super_admin)
    status: completed
    dependencies:
      - types-update
  - id: layout-upgrade
    content: 重构 AdminLayout：底部 TabBar 改为左侧固定侧边栏（桌面端 240px + 折叠图标模式）+ 导航扩展到 9 项
    status: completed
    dependencies:
      - auth-permissions
  - id: merchant-manage
    content: 新建 MerchantManage.tsx 完整商家管理页面：列表(搜索/筛选/排序/分页) + 新增/编辑弹窗(完整表含分类/区域/图片/营业时间/推荐/置顶/标签) + 上下架/推荐/置顶操作
    status: completed
    dependencies:
      - layout-upgrade
  - id: user-manage
    content: 新建 UserManage.tsx 会员管理页面：用户列表(搜索/角色/状态筛选) + 详情抽屉(收藏/浏览记录) + 手动改等级 + 禁用/解禁
    status: completed
    dependencies:
      - layout-upgrade
  - id: banner-announce
    content: 新建 BannerManage.tsx 轮播图管理 + AnnouncementManage.tsx 公告管理（均含 COS 图片上传）
    status: completed
    dependencies:
      - layout-upgrade
  - id: dashboard-enhance
    content: 增强 Dashboard.tsx：加 Recharts 图表(访问量趋势/商家分布饼图) + 最近操作日志 + 快捷操作入口优化
    status: completed
    dependencies:
      - merchant-manage
      - user-manage
  - id: log-settings
    content: 新建 OperationLog.tsx 操作日志查看(时间/类型/目标筛选+分页表格) + SystemSettings.tsx 系统设置 + adminLogger.ts 日志工具函数集成到各管理操作
    status: completed
    dependencies:
      - banner-announce
      - dashboard-enhance
  - id: build-deploy
    content: 本地 npm run build 构建验证 → git commit push → Vercel 部署
    status: completed
    dependencies:
      - log-settings
---

## 产品概述

为吉林外卖平台（moojilin55.site）补全完整后台管理系统，从"能看不能管"升级为可运营的本地商家推广平台。

## 核心功能

- **管理员权限体系**：超级管理员（全权）+ 普通管理员（只读+编辑商家，不能删数据/改权限）+ 操作日志审计
- **商家管理增强**：从纯审核页面升级为完整 CRUD，支持新增/编辑/删除商家、上下架（is_visible）、推荐置顶标签（is_featured/is_top/tags）、设置分类区域、上传图片、营业时间、排序权重
- **会员/用户管理**：新增用户列表页，支持查看所有用户、手动修改会员等级、禁用/解禁账号、查看收藏和浏览记录
- **运营工具**：轮播图后台上传管理、公告/活动发布、数据统计面板增强（访问量/商家点击量趋势图）
- **系统设置**：操作日志查看、平台参数配置

## 技术栈

- 前端：React 18 + TypeScript + Tailwind CSS 3.3 + Framer Motion + Recharts（图表）
- 后端：Supabase (PostgreSQL + Auth + RLS) — 无额外后端服务
- 存储：腾讯云 COS（图片上传）
- 路由：React Router v6 HashRouter
- 部署：Vercel

## 实施方案

采用 **4 阶段递进式实施**：

**阶段一：数据库扩展** — 新增运营字段 + 新表 + RLS 策略 + 种子数据
**阶段二：权限体系** — profiles 表加 role 细分 + AdminContext 权限控制 Hook + 路由守卫升级
**阶段三：核心管理页面** — 商家完整管理 + 用户/会员管理 + 操作日志自动记录
**阶段四：运营工具** — 轮播图管理 + 公告管理 + Dashboard 数据统计增强

### 关键技术决策

1. **权限设计（最简实用版）**

- `profiles.role` 扩展为: `'user' | 'merchant' | 'admin' | 'super_admin'`
- 前端通过 React Context (`AdminContext`) 注入当前用户角色和权限
- `ProtectedRoute` 组件增加 `permission` 属性级控制（`can_delete` / `can_manage_users` / `can_manage_roles`）
- 超级管理员独有：删除商家、修改用户角色/等级、添加子管理员、系统设置
- 普通管理员：编辑商家信息、审核商家、查看用户列表（只读）

2. **merchants 表扩展字段**

```sql
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;      -- 上下架
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;   -- 推荐
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS is_top BOOLEAN DEFAULT false;        -- 置顶
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS sort_weight INTEGER DEFAULT 0;       -- 排序权重
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';            -- 热门标签
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS open_hours VARCHAR(100);             -- 营业时间
```

3. **profiles 表扩展字段**

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'; -- active/banned
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP;
```

4. **新表设计**

- `admin_logs` — id, admin_id(UUID), action, target_type(merchant/user/category等), target_id, detail(JSONB), created_at
- `banners` — id, title, image_url, link_url, sort_order, is_active, created_at
- `announcements` — id, title, content, type(system/promotion), is_active, created_at, expires_at

5. **操作日志实现方式**

- 创建 `src/utils/adminLogger.ts` 工具函数
- 在每个管理操作的 `.then()` 成功回调中调用日志记录
- 通过 Supabase RPC 或直接 insert 写入 admin_logs 表
- 不影响主业务流程，日志写入失败静默处理

6. **复用现有模式**

- 所有新页面遵循现有 Admin 页面的代码风格：useState + useEffect + motion 动画 + AnimatePresence 消息提示
- 表单验证沿用现有 pattern（前端 validate + Supabase 错误兜底）
- 图片上传复用 `utils/cos.ts` 的 `uploadImage`
- 分页/筛选复用 MerchantAudit.tsx 的 filter tabs 模式

### 性能与可靠性

- 商家列表查询使用 Supabase 的分页（range）避免一次加载过多
- Dashboard 统计数据使用 Supabase aggregate 查询（count）而非全量拉取再 filter
- 操作日志异步写入，不阻塞主操作 UI
- RLS 策略确保普通管理员无法执行越权操作（数据库层兜底）

## 架构设计

```
AdminLayout (侧边栏导航)
├── Dashboard (统计概览 + 快捷操作)     [已有 - 增强]
├── MerchantManage (商家完整CRUD)         [新建 - 替代 MerchantAudit]
│   ├── 列表视图 (筛选/搜索/排序)
│   ├── 新增/编辑弹窗 (完整表单)
│   └── 操作 (上下架/推荐/置顶/删除)
├── UserManage (用户/会员管理)             [新建]
│   ├── 用户列表 (搜索/筛选/状态)
│   ├── 详情弹窗 (收藏/浏览记录)
│   └── 操作 (改等级/禁用/解禁)
├── CategoryManage (分类管理)              [已有 - 保持]
├── MemberLevels (会员等级)                [已有 - 保持]
├── BannerManage (轮播图管理)              [新建]
├── AnnouncementManage (公告管理)          [新建]
├── OperationLog (操作日志)                [新建]
└── SystemSettings (系统设置)              [新建]

AdminContext (权限注入)
└── useAdmin() Hook → { role, permissions, isAdmin, isSuperAdmin }

ProtectedRoute 升级 → 支持 permission 级别控制
```

## 目录结构

```
src/
├── App.tsx                              # [MODIFY] 路由扩展 + 新增6个路由
├── contexts/
│   └── AdminContext.tsx                  # [NEW] 权限上下文
├── hooks/
│   └── useAdmin.ts                       # [NEW] 权限Hook
├── layouts/
│   └── AdminLayout.tsx                   # [MODIFY] 导航扩展到8项
├── pages/admin/
│   ├── Dashboard.tsx                     # [MODIFY] 增强：加图表+最近操作
│   ├── MerchantManage.tsx                # [NEW] 完整商家管理（替代MerchantAudit）
│   ├── UserManage.tsx                    # [NEW] 用户/会员管理
│   ├── CategoryManage.tsx                # [KEEP] 已有
│   ├── MemberLevels.tsx                  # [KEEP] 已有
│   ├── BannerManage.tsx                  # [NEW] 轮播图管理
│   ├── AnnouncementManage.tsx            # [NEW] 公告/活动管理
│   ├── OperationLog.tsx                  # [NEW] 操作日志查看
│   ├── SystemSettings.tsx                # [NEW] 系统设置
│   └── MerchantAudit.tsx                 # [DEPRECATE] 由 MerchantManage 取代
├── utils/
│   ├── cos.ts                            # [KEEP] 已有
│   └── adminLogger.ts                    # [NEW] 操作日志工具
├── supabase/
│   └── types.ts                          # [MODIFY] 新增类型定义
migrations/
└── 20260422_admin_complete_system.sql    # [NEW] 完整数据库迁移脚本
```

## 设计风格

采用深色专业后台风格（Dark Admin Dashboard），与 C 端的 Liquid Glass 风格形成明确区分。管理后台需要传达专业感、效率感和可控性。

## 设计架构

基于现有 AdminLayout 的紫色主题进行升级，改为左侧固定侧边栏 + 右侧内容区的经典后台布局（替代当前底部 TabBar 移动端布局）。保留 Framer Motion 微交互动画。

## 页面规划（6 个核心页面）

### Page 1: Dashboard 控制台首页

- **统计卡片行**：总商家数 / 待审核 / 今日访问 / 总用户数（带趋势箭头）
- **快捷操作区**：4个入口按钮（商家审核 / 用户管理 / 发公告 / 上传轮播图）
- **最近操作日志**：最新10条操作记录表格
- **访问量趋势图**：近7天折线图（Recharts）

### Page 2: MerchantManage 商家管理

- **顶部工具栏**：搜索框 + 状态筛选(全部/待审/已过/已拒/已下架) + 分类筛选 + 区域筛选 + "新增商家"按钮
- **商家卡片/列表**：封面缩略图 + 店名 + 分类/区域标签 + 状态Badge + 推荐置顶标记 + 浏览量/评分
- **操作按钮组**：编辑 / 审核 / 上下架 / 推荐 / 置顶 / 删除（按权限显隐）
- **新增/编辑弹窗**：完整表单（店名/电话/地址/分类/区域/描述/图片/营业时间/推荐置顶/排序权重/标签）

### Page 3: UserManage 会员管理

- **顶部工具栏**：搜索框 + 角色筛选(全部/普通/VIP/商家/管理员) + 状态筛选(正常/禁用)
- **用户列表**：头像 + 用户名/手机 + 角色 Badge + 会员等级 + 注册时间 + 状态
- **操作**：查看详情（抽屉：收藏列表+浏览记录）/ 改等级下拉 / 禁用-解禁切换

### Page 4: BannerManage 轮播图管理

- **轮播图列表**：图片预览 + 标题 + 链接 + 排序拖拽 + 启用开关
- **上传区**：点击上传新轮播图（COS）+ 填写标题/链接

### Page 5: AnnouncementManage 公告管理

- **公告列表**：标题 + 类型Tag + 内容摘要 + 状态(启用/停用) + 发布时间 + 到期时间
- **编辑区**：富文本形式（标题+内容+类型+有效期）

### Page 6: OperationLog 操作日志

- **筛选工具栏**：时间范围选择 + 操作人 + 操作类型 + 目标类型
- **日志表格**：时间 | 操作人 | 操作类型 | 目标 | 详情 | IP（如有）
- **支持分页**

### 共享组件：AdminLayout 侧边栏布局

- 左侧固定侧边栏（桌面端 240px，移动端折叠为图标）
- 顶部面包屑 + 用户信息 + 退出登录
- 右侧内容区滚动

## SubAgent

- **code-explorer**
- Purpose: 在实施前深度探索各模块的具体代码细节，确保方案精准落地
- Expected outcome: 提供关键文件的精确代码片段和依赖关系，减少返工