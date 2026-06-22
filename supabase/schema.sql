-- 枢 AI 数据库初始化
-- 在 Supabase Dashboard > SQL Editor 中执行

CREATE TABLE IF NOT EXISTS public.profiles(id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,email TEXT,credits INTEGER NOT NULL DEFAULT 0,role TEXT NOT NULL DEFAULT 'user',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.api_keys(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),provider TEXT NOT NULL,key_value TEXT NOT NULL,weight INTEGER NOT NULL DEFAULT 1,is_active BOOLEAN NOT NULL DEFAULT true,error_count INTEGER NOT NULL DEFAULT 0,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.usage_logs(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,model TEXT NOT NULL,type TEXT NOT NULL,tokens_or_units INTEGER NOT NULL DEFAULT 0,cost INTEGER NOT NULL DEFAULT 0,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.redeem_codes(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),code TEXT UNIQUE NOT NULL,credits INTEGER NOT NULL,is_used BOOLEAN NOT NULL DEFAULT false,used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.models(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),name TEXT UNIQUE NOT NULL,provider TEXT NOT NULL,type TEXT NOT NULL DEFAULT 'chat',price_per_unit INTEGER NOT NULL DEFAULT 1,is_enabled BOOLEAN NOT NULL DEFAULT true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile" ON public.profiles FOR SELECT USING (auth.uid()=id);
CREATE POLICY "update_profile" ON public.profiles FOR UPDATE USING (auth.uid()=id);
CREATE POLICY "own_usage" ON public.usage_logs FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "insert_usage" ON public.usage_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "read_models" ON public.models FOR SELECT USING (is_enabled=true);
CREATE POLICY "read_codes" ON public.redeem_codes FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "no_keys" ON public.api_keys USING (false);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.profiles(id,email) VALUES(NEW.id,NEW.email) ON CONFLICT(id) DO NOTHING; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.deduct_credits(uid UUID,amount INTEGER) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN UPDATE public.profiles SET credits=GREATEST(0,credits-amount) WHERE id=uid; END; $$;

CREATE OR REPLACE FUNCTION public.redeem_code(p_code TEXT,p_user_id UUID) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE v_credits INTEGER; BEGIN SELECT credits INTO v_credits FROM public.redeem_codes WHERE code=p_code AND is_used=false FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Code not found or already used'; END IF; UPDATE public.redeem_codes SET is_used=true,used_by=p_user_id WHERE code=p_code; UPDATE public.profiles SET credits=credits+v_credits WHERE id=p_user_id; END; $$;

INSERT INTO public.models(name,provider,type,price_per_unit) VALUES ('deepseek-chat','deepseek','chat',1),('deepseek-reasoner','deepseek','chat',5),('gpt-4o-mini','openai','chat',2),('gpt-4o','openai','chat',10),('claude-sonnet-4-6','anthropic','chat',10),('gemini-2.0-flash','google','chat',2) ON CONFLICT(name) DO NOTHING;
INSERT INTO public.redeem_codes(code,credits) VALUES('TEST-1000-FREE-CODE',1000),('BETA-5000-AAAA-BBBB',5000) ON CONFLICT(code) DO NOTHING;
