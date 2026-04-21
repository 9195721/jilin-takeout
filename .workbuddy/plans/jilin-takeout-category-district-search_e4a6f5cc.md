---
name: jilin-takeout-category-district-search
overview: 为吉林外卖网站添加 4 个核心功能：① 分类筛选生效（修复 category_id 缺失 bug）② 商家增加分类+区域字段 ③ 多字段搜索（店名+服务/描述）④ 区域筛选栏（船营/昌邑/丰满/高新）。涉及数据库 DDL 变更、类型定义更新、Home/Merchants/Search 页面改造。
design:
  architecture:
    framework: react
  styleKeywords:
    - Liquid Glass
    - Dark Theme
    - Frosted Glass
    - Neon Accent
    - Pill Filters
    - Micro-interaction
  fontSystem:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto"
    heading:
      size: 20px
      weight: 700
    subheading:
      size: 16px
      weight: 600
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#3B82F6"
      - "#60A5FA"
      - "#93C5FD"
    background:
      - "#0F172A"
      - "#1E293B"
      - "#1A1A2E"
    text:
      - "#FFFFFF"
      - "#94A3B8"
      - "#CBD5E1"
    functional:
      - "#22C55E"
      - "#EF4444"
      - "#F59E0B"
todos:
  - id: sql-migration
    content: 编写 SQL 迁移脚本：新建 districts 表 + merchants 加 category_id/district 字段 + 种子数据 + RLS
    status: completed
  - id: types-update
    content: 更新 supabase/types.ts：merchants Row 补充新字段 + 新增 districts 表类型定义
    status: completed
    dependencies:
      - sql-migration
  - id: layout-search
    content: ConsumerLayout 顶导新增全局搜索框（毛玻璃风格，回车跳转 Search）
    status: completed
  - id: merchants-fix
    content: Merchants.tsx 修复 category_id 筛选 + 新增区域筛选栏（船营/昌邑/丰满/高新）+ 卡片显示区域标签
    status: completed
    dependencies:
      - types-update
  - id: search-enhance
    content: Search.tsx 改造为多字段搜索(shop_name+description) + 分类/区域组合筛选
    status: completed
    dependencies:
      - types-update
  - id: detail-tags
    content: MerchantDetail.tsx 店铺信息区新增分类标签和区域标签展示
    status: completed
    dependencies:
      - types-update
  - id: shopinfo-form
    content: ShopInfo.tsx 商家编辑表单新增「服务分类」下拉和「所在区域」选择器
    status: completed
    dependencies:
      - types-update
  - id: build-deploy
    content: npm run build + git commit push 触发 Vercel 部署
    status: completed
    dependencies:
      - sql-migration
      - types-update
      - layout-search
      - merchants-fix
      - search-enhance
      - detail-tags
      - shopinfo-form
---

## 产品概述

吉林外卖（jilin-takeout）网站增加 4 项核心功能，让分类筛选、区域筛选、搜索功能完整可用，使网站达到专业级水准。

## 核心功能

### 功能1：点击分类 → 只显示该分类下的商家

- 首页点击分类图标 → 跳转商家列表页并自动筛选该分类
- 商家列表页顶部横向分类按钮栏 → 切换分类即时过滤
- **修复现有 bug**：merchants 表缺少 `category_id` 字段，当前筛选实际不生效

### 功能2：商家属性扩展（分类 + 所在区域）

- 每个商家新增两个属性字段：
- **category_id**：关联 categories 表（餐饮美食、洗浴汗蒸等 8 个分类）
- **district**：所在区域（船营 / 昌邑 / 丰满 / 高新）
- 商家后台编辑页面增加「服务分类」和「所在区域」下拉选择器
- 新建 `districts` 区域表，预置吉林市 4 个主城区数据

### 功能3：顶部全局搜索框（搜店名 + 服务/菜品）

- ConsumerLayout 顶部导航栏增加搜索输入框
- 搜索范围覆盖：店铺名称 + 描述 + 关联菜品名称（多字段联合模糊匹配）
- 搜索结果页支持分类和区域二次筛选
- 保留搜索历史记录功能（已有）

### 功能4：区域筛选栏

- 商家列表页和搜索页增加「区域筛选」横向按钮组
- 区域选项：全部 / 船营 / 昌邑 / 丰满 / 高新
- 与分类筛选可组合使用（如：「餐饮美食」+「船营区」）
- 商家卡片上展示所属区域小标签

## 技术栈

- 前端框架：React 18 + TypeScript（已有）
- 样式方案：Tailwind CSS + Liquid Glass 毛玻璃风格（已有）
- 动画：framer-motion（已有）
- 数据库：Supabase PostgreSQL（已有）
- 构建工具：Webpack 5 + contenthash（已有）
- 部署：Vercel（自动部署）

## 技术架构

### 系统架构变更

```
消费者端页面层
├── ConsumerLayout (新增全局搜索框)
│   ├── Home (修复: 分类点击联动)
│   ├── Merchants (修复: category_id + 新增: 区域筛选)
│   ├── Search (增强: 多字段搜索 + 分类/区域筛选)
│   └── MerchantDetail (新增: 分类/区域标签展示)

商家端页面层
└── ShopInfo (新增: 分类/区域选择器)

数据库层
├── merchants 表 (新增列: category_id, district)
├── districts 表 (新建: 吉林市 4 个主城区)
└── RLS 策略更新 (districts 表只读策略)
```

### 数据流设计

```
用户操作 → URL 参数 / State 变化 → useEffect 触发重新查询
→ Supabase PostgREST 组合查询:
   .eq('status', 'approved')
   .eq('category_id', categoryId)        [可选]
   .eq('district', districtName)          [可选]
   .or(`shop_name.ilike.%term%,description.ilike.%term%`)  [搜索时]
```

## 实现要点

### 1. 数据库变更（SQL 迁移脚本）

- 新建 `districts` 表：id, name(唯一), sort_order
- `merchants` 表 ADD COLUMN `category_id INTEGER REFERENCES categories(id)`
- `merchants` 表 ADD COLUMN `district VARCHAR(20)`（不用外键，直接存区域名便于展示和筛选）
- districts 表种子数据：船营(1)、昌邑(2)、丰满(3)、高新(4)
- RLS：districts 表 SELECT USING(true)，merchants 新字段无需额外策略

### 2. 类型定义同步

- `src/supabase/types.ts` merchants Row 类型补充 `category_id` 和 `district` 字段
- 新增 `districts` 表类型定义

### 3. 搜索增强策略

- 使用 Supabase 的 `.or()` 进行多字段搜索
- 查询条件：`shop_name.ilike.%term%,description.ilike.%term%`
- 如需搜索菜品名，通过子查询或单独查 menus 表后合并（首版先做 shop_name + description）

### 4. 性能考虑

- 所有筛选在前端组合参数，单次 API 请求完成
- Supabase 自动为 foreign key 和常用查询条件创建索引
- category_id 有 FK 索引，district 为 VARCHAR 但数据量极小（仅 4 个值），性能无问题
- 搜索使用 ilike + B-tree 索引，数据量 < 1000 时响应 < 100ms

## 目录结构变更

```
c:/Users/Administrator/Desktop/xinxiangmh/oneday_zip_1776721924659/
├── migrations/
│   └── 20260422_add_category_district.sql    # [NEW] 迁移脚本
├── src/
│   ├── supabase/
│   │   └── types.ts                          # [MODIFY] 新增 district 类型 + merchants 字段
│   ├── layouts/
│   │   └── ConsumerLayout.tsx                # [MODIFY] 顶导加搜索框
│   ├── pages/consumer/
│   │   ├── Home.tsx                          # [MODIFY] 分类点击正确传参
│   │   ├── Merchants.tsx                     # [MODIFY] 修复筛选 + 区域栏
│   │   ├── Search.tsx                        # [MODIFY] 多字段搜索 + 筛选
│   │   └── MerchantDetail.tsx               # [MODIFY] 展示分类/区域标签
│   └── pages/merchant/
│       └── ShopInfo.tsx                      # [MODIFY] 加分类/区域选择器
└── supabase_init_all_tables.sql             # [MODIFY] 同步表结构文档
```

### 关键代码结构

```typescript
// merchants 表新字段类型（types.ts 变更部分）
merchants: {
  Row: {
    // ... 现有字段
    category_id: number | null;      // NEW: FK → categories.id
    district: string | null;         // NEW: '船营' | '昌邑' | '丰满' | '高新'
  }
}

// districts 新表类型
districts: {
  Row: { id: number; name: string; sort_order: number | null; created_at: string | null; }
}
```

## 设计风格延续

保持项目现有的 **Liquid Glass（毛玻璃）深色主题**风格不变。新增 UI 元素（搜索框、筛选栏、标签）全部遵循现有的设计语言：

- 背景：`bg-white/15 backdrop-blur-[40px] backdrop-saturate-[180%]`
- 边框：`border border-white/30` 圆角 `rounded-2xl`/`rounded-full`
- 文字：白色系 `text-white` / `text-white/70`
- 动画：framer-motion 入场动画 + whileHover/whileTap 微交互
- 配色：蓝色主色调 `bg-blue-500`，与现有页面完全一致

## 页面设计说明

### 页面1：ConsumerLayout（全局布局改造）

**改动点：在顶部导航栏 Logo 和登录按钮之间插入搜索框**

Block 1 - 顶部导航栏（修改）

- 左侧：Logo + "吉林外卖"（不变）
- 中间：新增全局搜索框（毛玻璃样式，圆角，带搜索图标）
- 输入后回车跳转到 /search?q=keyword
- placeholder: "搜索商家、服务..."
- 宽度自适应，移动端可收缩
- 右侧：登录/退出按钮（不变）

### 页面2：Merchants（商家列表页改造）

Block 1 - 页面标题（不变）

Block 2 - 分类筛选栏（保留已有，修复功能）

- 横向滚动胶囊按钮组：全部 | 🍜餐饮美食 | 🛁洗浴汗蒸 | ...
-选中态：蓝色实心 bg-blue-500
- 未选中：暗色 bg-slate-700
- 点击切换 selectedCategory，触发重新查询

Block 3 - 【新增】区域筛选栏

- 横向滚动胶囊按钮组：全部 | 船营 | 昌邑 | 丰满 | 高新
- 样式与分类栏一致，视觉层级略低（稍小字号）
- 图标：📍 定位图标
- 点击切换 selectedDistrict，与分类组合过滤

Block 4 - 排序选项（保留已有，不变）

Block 5 - 商家列表网格（修改卡片）

- 每张卡片左下角新增区域小标签（如 `船营`）
- 标签样式：半透明圆角胶囊 `bg-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded-full`

### 页面3：Search（搜索页改造）

Block 1 - 搜索框（保留，增强）

- sticky 定位在顶部
- 输入框下方新增一行筛选条

Block 2 - 【新增】筛选条件行

- 左侧：分类快速筛选（横滚胶囊按钮，同商家列表页）
- 右侧：区域快速筛选（横滚胶囊按钮）
- 搜索关键词 + 分类 + 区域三者组合过滤

Block 3 - 搜索结果列表（修改）

- 结果数显示：(N) 家商户
- 每个结果卡片显示区域标签

### 页面4：MerchantDetail（详情页改造）

在店铺名称旁新增标签行：

- 分类标签：从关联的 menus.category 取第一个，或从 merchant.category_id 直接取
- 区域标签：merchant.district
- 样式：圆角彩色胶囊，紧跟店名右侧

### 页面5：ShopInfo（商家后台编辑页改造）

在「店铺地址」输入框下方新增两个字段：

Block N - 服务分类选择

- 下拉 select 或横排选项按钮组
- 选项来自 categories 表动态加载
- 必填

Block N+1 - 所在区域选择

- 4 个选项按钮：船营 / 昌邑 / 丰满 / 高新
- 必填，默认值可选
- 样式：网格 2x2 选择卡片，选中高亮

## SubAgent

- **code-explorer**
- Purpose: 已用于探索项目全量代码结构（Home/Merchants/Search/MerchantDetail/ShopInfo/types/SQL/layout 等 23 个文件），确认了 merchants 缺少 category_id/district 字段的关键 bug 以及所有需要修改的位置
- Expected outcome: 精确定位了 7 个需修改文件 + 1 个新建 SQL 文件的具体改动点