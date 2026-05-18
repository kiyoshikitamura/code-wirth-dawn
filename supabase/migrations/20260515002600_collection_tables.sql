-- Collection Feature: user_bestiary + user_item_history tables
-- For encyclopedia/collection feature tracking

-- エネミー遭遇記録
CREATE TABLE IF NOT EXISTS public.user_bestiary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enemy_id INT NOT NULL,
  first_encountered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, enemy_id)
);
CREATE INDEX IF NOT EXISTS idx_user_bestiary_user ON public.user_bestiary(user_id);
ALTER TABLE public.user_bestiary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own bestiary" ON public.user_bestiary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert bestiary" ON public.user_bestiary FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can delete bestiary" ON public.user_bestiary FOR DELETE USING (true);

-- アイテム入手記録（一度入手したら永久解放）
CREATE TABLE IF NOT EXISTS public.user_item_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id INT NOT NULL,
  first_obtained_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_user_item_history_user ON public.user_item_history(user_id);
ALTER TABLE public.user_item_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own item history" ON public.user_item_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert item history" ON public.user_item_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can delete item history" ON public.user_item_history FOR DELETE USING (true);
