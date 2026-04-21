-- 修复 profiles 表缺少 INSERT 策略的问题
-- 在 Supabase SQL Editor 中执行此 SQL

-- 添加 profiles 的 INSERT 策略：允许认证用户插入自己的资料
CREATE POLICY "用户可以创建自己的资料" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 添加 merchants 的 SELECT 策略补充：允许商家查看自己的 pending 申请
-- （原有的策略只允许查看 approved 状态的商家，商家自己也看不到 pending 状态）
CREATE POLICY "商家可查看自己的申请" ON public.merchants FOR SELECT USING (auth.uid() = user_id);
