-- UGC v2: play_count / clear_count インクリメント用 RPC
-- 仕様: spec_v12_ugc_system_v2.md §9

-- プレイ回数インクリメント
CREATE OR REPLACE FUNCTION increment_ugc_play_count(p_scenario_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE ugc_scenarios
  SET play_count = play_count + 1
  WHERE id = p_scenario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- クリア回数インクリメント
CREATE OR REPLACE FUNCTION increment_ugc_clear_count(p_scenario_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE ugc_scenarios
  SET clear_count = clear_count + 1
  WHERE id = p_scenario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
