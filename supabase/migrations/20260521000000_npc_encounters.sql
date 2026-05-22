-- NPC遭遇記録（コレクション用）
-- user_bestiary / user_item_history と同パターン
CREATE TABLE IF NOT EXISTS public.user_npc_encounters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  npc_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, npc_slug)
);
CREATE INDEX IF NOT EXISTS idx_user_npc_encounters_user ON public.user_npc_encounters(user_id);
ALTER TABLE public.user_npc_encounters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own npc encounters" ON public.user_npc_encounters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert npc encounters" ON public.user_npc_encounters FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can delete npc encounters" ON public.user_npc_encounters FOR DELETE USING (true);
