-- ============================================
-- jilin-takeout 完整建表脚本（合并所有 migration）
-- 在 Supabase SQL Editor 中一次性执行
-- 执行前请确保数据库为空（无同名表/函数/类型）
-- ============================================

-- 1. 创建用户角色枚举
CREATE TYPE public.app_role AS ENUM ('user', 'merchant', 'admin');

-- 2. 创建会员等级表
CREATE TABLE public.member_levels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(10),
  color VARCHAR(20),
  min_views INTEGER DEFAULT 0,
  privileges TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 创建用户资料表
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  phone VARCHAR(20),
  avatar_url TEXT,
  role app_role DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. 创建商家信息表
CREATE TABLE public.merchants (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  shop_name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  description TEXT,
  cover_image TEXT,
  images TEXT[],
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  member_level_id INTEGER REFERENCES public.member_levels(id),
  views INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  sales_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. 创建分类表
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(10),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. 创建菜品/服务表
CREATE TABLE public.menus (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES public.merchants(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES public.categories(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. 创建点赞表
CREATE TABLE public.likes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_id INTEGER NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, merchant_id)
);

-- 8. 创建评论表
CREATE TABLE public.reviews (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_id INTEGER NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. 创建收藏表
CREATE TABLE public.favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_id INTEGER NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, merchant_id)
);

-- 10. 创建订单表
CREATE TABLE public.orders (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_id INTEGER NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. 创建订单详情表
CREATE TABLE public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_id INTEGER NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 12. 创建优惠券表
CREATE TABLE public.coupons (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES public.merchants(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  discount_amount DECIMAL(10,2),
  min_amount DECIMAL(10,2) DEFAULT 0,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  total_quantity INTEGER DEFAULT 100,
  used_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 13. 创建用户优惠券表
CREATE TABLE public.user_coupons (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_id INTEGER NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, coupon_id)
);

-- 14. 创建消息通知表
CREATE TABLE public.notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  type VARCHAR(50) DEFAULT 'system',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 函数 & 触发器
-- ============================================

-- 角色检查函数（必须在 RLS 策略之前创建）
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = _role
  )
$$;

-- 浏览量自动升级触发器
CREATE OR REPLACE FUNCTION public.check_merchant_level_upgrade()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  new_level_id INTEGER;
BEGIN
  SELECT id INTO new_level_id
  FROM public.member_levels
  WHERE min_views <= NEW.views
  ORDER BY min_views DESC
  LIMIT 1;
  
  IF new_level_id IS NOT NULL AND new_level_id != NEW.member_level_id THEN
    NEW.member_level_id = new_level_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- 启用 RLS
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS 策略（已合并所有修复）
-- ============================================

-- profiles 策略
CREATE POLICY "允许用户插入自己的资料" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "用户可以查看自己的资料" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "用户可以更新自己的资料" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "管理员可以查看所有用户资料" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- merchants 策略
CREATE POLICY "商家可查看自己的店铺信息" ON public.merchants FOR SELECT USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR status = 'approved'
);
CREATE POLICY "认证用户可创建商家申请" ON public.merchants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "商家可更新自己的店铺信息" ON public.merchants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "管理员可管理所有商家" ON public.merchants FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- categories 策略
CREATE POLICY "所有人可查看分类" ON public.categories FOR SELECT USING (true);
CREATE POLICY "管理员可管理分类" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- menus 策略
CREATE POLICY "所有人可查看可用菜品" ON public.menus FOR SELECT USING (
  is_available = true OR
  EXISTS (SELECT 1 FROM public.merchants WHERE id = menus.merchant_id AND user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "商家可管理自己的菜品" ON public.menus FOR ALL USING (
  EXISTS (SELECT 1 FROM public.merchants WHERE id = menus.merchant_id AND user_id = auth.uid())
);
CREATE POLICY "管理员可管理所有菜品" ON public.menus FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- member_levels 策略
CREATE POLICY "所有人可查看会员等级" ON public.member_levels FOR SELECT USING (true);
CREATE POLICY "管理员可管理会员等级" ON public.member_levels FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- likes 策略
CREATE POLICY "所有人可查看点赞数" ON public.likes FOR SELECT USING (true);
CREATE POLICY "认证用户可点赞" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可取消自己的点赞" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- reviews 策略
CREATE POLICY "所有人可查看评论" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "认证用户可发表评论" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可更新自己的评论" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "用户可删除自己的评论" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- favorites 策略
CREATE POLICY "用户可查看自己的收藏" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可添加收藏" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可取消收藏" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- orders 策略
CREATE POLICY "用户可查看自己的订单" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "商家可查看关联订单" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.merchants WHERE id = merchant_id AND user_id = auth.uid())
);
CREATE POLICY "用户可创建订单" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可更新自己的订单" ON public.orders FOR UPDATE USING (auth.uid() = user_id);

-- order_items 策略
CREATE POLICY "用户可查看自己的订单详情" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "商家可查看关联订单详情" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o JOIN public.merchants m ON o.merchant_id = m.id WHERE o.id = order_id AND m.user_id = auth.uid())
);

-- coupons 策略
CREATE POLICY "所有人可查看优惠券" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "商家可管理自己的优惠券" ON public.coupons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.merchants WHERE id = merchant_id AND user_id = auth.uid())
);

-- user_coupons 策略
CREATE POLICY "用户可查看自己的优惠券" ON public.user_coupons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户可领取优惠券" ON public.user_coupons FOR INSERT WITH CHECK (auth.uid() = user_id);

-- notifications 策略
CREATE POLICY "用户可查看自己的通知" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "系统可发送通知" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "用户可标记通知已读" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 触发器
-- ============================================
CREATE TRIGGER trigger_check_merchant_level
  BEFORE UPDATE OF views ON public.merchants
  FOR EACH ROW
  EXECUTE FUNCTION public.check_merchant_level_upgrade();

-- ============================================
-- 初始数据
-- ============================================
INSERT INTO public.member_levels (name, icon, color, min_views, privileges) VALUES
('普通商家', '🏪', '#94a3b8', 0, '基础展示'),
('银牌商家', '🥈', '#64748b', 1000, '优先展示,专属标识'),
('金牌商家', '🥇', '#fbbf24', 5000, '首页推荐,专属客服'),
('钻石商家', '💎', '#3b82f6', 10000, '顶级曝光,营销支持');

INSERT INTO public.categories (name, icon, sort_order) VALUES
('餐饮美食', '🍜', 1),
('洗浴汗蒸', '🛁', 2),
('汽车服务', '🚗', 3),
('生鲜果蔬', '🥬', 4),
('休闲娱乐', '🎮', 5),
('美容美发', '💇', 6),
('教育培训', '📚', 7),
('生活服务', '🔧', 8);
