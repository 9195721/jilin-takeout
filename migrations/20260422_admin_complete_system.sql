-- ============================================
-- 2026-04-22 后台管理系统完整升级迁移脚本
-- 在 Supabase SQL Editor 中执行
-- 功能：运营字段 + 权限字段 + 3张新表 + RLS + 种子数据
-- ============================================

-- =====================================================
-- 第一部分：merchants 表扩展（7个运营字段）
-- =====================================================

ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_top BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_weight INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS open_hours VARCHAR(100);

COMMENT ON COLUMN public.merchants.is_visible IS '上下架状态，true=上架';
COMMENT ON COLUMN public.merchants.is_featured IS '是否推荐';
COMMENT ON COLUMN public.merchants.is_top IS '是否置顶';
COMMENT ON COLUMN public.merchants.sort_weight IS '排序权重，越大越靠前';
COMMENT ON COLUMN public.merchants.tags IS '热门标签数组';

-- =====================================================
-- 第二部分：profiles 表扩展（3个管理字段）
-- =====================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS banned_reason TEXT,
  ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.profiles.status IS '账号状态：active/banned';
COMMENT ON COLUMN public.profiles.banned_reason IS '封禁原因';
COMMENT ON COLUMN public.profiles.banned_until IS '封禁到期时间';

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- =====================================================
-- 第三部分：新建 admin_logs 操作日志表
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,              -- create/update/delete/audit/toggle/ban 等
  target_type VARCHAR(30),                  -- merchant/user/category/banner/announcement/system
  target_id VARCHAR(50),                    -- 目标记录 ID
  detail JSONB DEFAULT '{}',                -- 操作详情（变更前后值等）
  ip_address INET,                          -- 操作者 IP（可选）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS 策略：只有管理员可查看日志
CREATE POLICY "管理员可查看操作日志" ON public.admin_logs FOR SELECT USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY "管理员可写入操作日志" ON public.admin_logs FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- 日志索引
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

-- =====================================================
-- 第四部分：新建 banners 轮播图表
-- =====================================================

CREATE TABLE IF NOT EXISTS public.banners (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  link_url VARCHAR(500) DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "所有人可查看启用轮播图" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "管理员可管理所有轮播图" ON public.banners FOR ALL USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_banners_updated_at ON public.banners;
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 第五部分：新建 announcements 公告表
-- =====================================================

CREATE TABLE IF NOT EXISTS public.announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT DEFAULT '',
  type VARCHAR(20) DEFAULT 'system',       -- system / promotion / urgent
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE        -- 过期时间，NULL表示永不过期
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "所有人可查看有效公告" ON public.announcements FOR SELECT USING (
  is_active = true AND (expires_at IS NULL OR expires_at > NOW())
);
CREATE POLICY "管理员可管理所有公告" ON public.announcements FOR ALL USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- updated_at 触发器
DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 公告索引
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_expires ON public.announcements(expires_at);

-- =====================================================
-- 第六部分：商家运营索引
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_merchants_visible ON public.merchants(is_visible);
CREATE INDEX IF NOT EXISTS idx_merchants_featured ON public.merchants(is_featured);
CREATE INDEX IF NOT EXISTS idx_merchants_top ON public.merchants(is_top);
CREATE INDEX IF NOT EXISTS idx_merchants_sort ON public.merchants(sort_weight DESC);

-- =====================================================
-- 第七部分：种子数据 — 示例公告
-- =====================================================

INSERT INTO public.announcements (title, content, type, is_active) VALUES
('吉林外卖平台正式上线！', '欢迎来到吉林外卖平台，本地美食一键送达。商家入驻火热进行中，诚邀优质商家加入！', 'system', true),
('新用户专享优惠', '首单立减 5 元，满 20 元免配送费。活动期间注册即享，快来下单吧！', 'promotion', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 第八部分：验证脚本执行结果
-- =====================================================

SELECT 'merchants 运营字段' AS check_item,
  column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'merchants'
  AND column_name IN ('is_visible','is_featured','is_top','sort_weight','tags','open_hours')
ORDER BY ordinal_position;
