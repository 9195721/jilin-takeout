-- ============================================
-- 2026-04-22 分类筛选 + 区域筛选 功能迁移脚本
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 1. 新建 districts 区域表
CREATE TABLE IF NOT EXISTS public.districts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. merchants 表加字段（兼容已有数据）
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES public.categories(id),
  ADD COLUMN IF NOT EXISTS district VARCHAR(20);

-- 3. districts 种子数据（吉林市 4 个主城区）
INSERT INTO public.districts (name, sort_order) VALUES
('船营', 1),
('昌邑', 2),
('丰满', 3),
('高新', 4)
ON CONFLICT (name) DO NOTHING;

-- 4. 启用 RLS
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

-- 5. RLS 策略：所有人可查看区域
CREATE POLICY "所有人可查看区域" ON public.districts FOR SELECT USING (true);
CREATE POLICY "管理员可管理区域" ON public.districts FOR ALL USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);
