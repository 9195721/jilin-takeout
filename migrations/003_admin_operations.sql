-- ============================================================
-- 吉林外卖平台 - 运营功能扩展 SQL 迁移
-- 执行时间: 2026-04-22
-- ============================================================

-- ============================================================
-- 1. merchants 表扩展：加运营字段
-- ============================================================
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS is_visible   BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_top       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_weight  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags         TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS open_hours   TEXT DEFAULT '09:00-22:00';

-- 已有 updated_at 字段但没有默认值时设置
ALTER TABLE merchants
  ALTER COLUMN updated_at SET DEFAULT now();

-- ============================================================
-- 2. profiles 表扩展：加管理字段
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'banned')),
  ADD COLUMN IF NOT EXISTS member_level_id INTEGER REFERENCES member_levels(id),
  ADD COLUMN IF NOT EXISTS banned_reason   TEXT;

-- ============================================================
-- 3. admin_logs 表（操作日志）
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id         BIGSERIAL PRIMARY KEY,
  admin_id   TEXT NOT NULL REFERENCES profiles(id),
  admin_name TEXT,
  action     TEXT NOT NULL,
  target     TEXT,
  detail     TEXT,
  ip         TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE admin_logs IS '管理员操作日志';
COMMENT ON COLUMN admin_logs.action  IS '操作类型: create/update/delete/approve/reject/toggle';
COMMENT ON COLUMN admin_logs.target  IS '操作对象: merchants/profiles/categories/banners/announcements等';

-- ============================================================
-- 4. banners 表（首页轮播图）
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  image_url   TEXT NOT NULL,
  link_type   TEXT DEFAULT 'none' CHECK (link_type IN ('none', 'merchant', 'category', 'url')),
  link_value  TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_visible  BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE banners IS '首页轮播图管理';

-- ============================================================
-- 5. announcements 表（公告）
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  type       TEXT DEFAULT 'notice' CHECK (type IN ('notice', 'activity', 'system')),
  is_pinned  BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE announcements IS '平台公告';

-- ============================================================
-- 6. RLS 策略更新
-- ============================================================
ALTER TABLE admin_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners     ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- admin_logs: 仅 admin 角色可读写
DROP POLICY IF EXISTS "admin_logs_admin_all" ON admin_logs;
CREATE POLICY "admin_logs_admin_all" ON admin_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'authenticated');

DROP POLICY IF EXISTS "admin_logs_select" ON admin_logs;
CREATE POLICY "admin_logs_select" ON admin_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "admin_logs_insert" ON admin_logs;
CREATE POLICY "admin_logs_insert" ON admin_logs
  FOR INSERT WITH CHECK (true);

-- banners: admin 可读写，公开可读
DROP POLICY IF EXISTS "banners_public_read" ON banners;
CREATE POLICY "banners_public_read" ON banners
  FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "banners_admin_all" ON banners;
CREATE POLICY "banners_admin_all" ON banners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- announcements: admin 可写，公开可读
DROP POLICY IF EXISTS "announcements_public_read" ON announcements;
CREATE POLICY "announcements_public_read" ON announcements
  FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "announcements_admin_all" ON announcements;
CREATE POLICY "announcements_admin_all" ON announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- 更新 merchants RLS：让 is_visible 字段生效（管理员全读，用户只能读 is_visible=true）
DROP POLICY IF EXISTS "merchants_is_visible_filter" ON merchants;
CREATE POLICY "merchants_is_visible_filter" ON merchants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    OR is_visible = true
  );

-- profiles 扩展字段 RLS
DROP POLICY IF EXISTS "profiles_admin_full" ON profiles;
CREATE POLICY "profiles_admin_full" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role IN ('admin', 'super_admin'))
  );

-- ============================================================
-- 7. 初始数据
-- ============================================================
-- 默认超级管理员（ID 为空占位，实际由系统创建时填充）
-- 初始公告
INSERT INTO announcements (title, content, type, is_pinned, is_visible)
SELECT '欢迎使用吉林外卖平台', '平台正式上线，欢迎商家入驻、用户使用！', 'notice', true, true
WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE title = '欢迎使用吉林外卖平台');
