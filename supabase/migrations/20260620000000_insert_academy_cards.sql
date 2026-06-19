-- Migration: Insert Magic Academy Cards and Skills (IDs 101-140 / 3101-3140)

-- 1. Insert cards
INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (101, 'card_catharsis', 'カタルシス', 'Magic', 3, 'none', 0, 30, 'single_enemy', 'catharsis', '/images/items/book_catharsis_1781803499014.png', '毒・炎上の起爆。対象が毒または炎上の場合、その残りDoTダメージを即座に全て発生させて状態異常を解除する（起爆）。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (102, 'card_wound_tear', '傷口をえぐる', 'Skill', 2, 'none', 0, 25, 'single_enemy', 'bleed_exploit', '/images/items/book_wound_tear_1781808056310.png', '出血付け足し攻撃。対象が出血状態の場合、威力が2.5倍(62)になり、出血の残りターンを2延長する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (103, 'card_defpless_prey', '無防備な獲物', 'Skill', 2, 'none', 0, 40, 'single_enemy', 'stun_exploit', '/images/items/book_defpless_prey_1781808066149.png', '隙のある敵への強襲。対象がスタン、拘束、凍結状態の場合、DEFを完全に無視してダメージを与える。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (104, 'card_epidemic_fog', '伝染病の霧', 'Magic', 3, 'none', 0, 15, 'all_enemies', 'poison_spread', '/images/items/book_epidemic_fog_1781808075688.png', '毒の拡散。対象のいずれかが毒状態の場合、他の全ての敵に同じ持続時間の毒を付与する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (105, 'card_shield_slam', 'シールドスラム', 'Skill', 3, 'none', 0, 10, 'single_enemy', 'shield_slam', '/images/items/book_shield_slam_1781803510217.png', '盾を叩きつける。威力：10＋自身の現在のDEF増加バフ値。発動後、自身のDEFバフは解除される。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (106, 'card_spike_armor', 'スパイクアーマー', 'Defense', 2, 'none', 0, 0, 'self', 'counter_spike', '/images/items/book_spike_armor_1781808088434.png', '棘の鎧を構える。3ターンの間、自身が攻撃を受けるたびに、自身のDEFの半分を物理ダメージとして反射する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (107, 'card_unyielding_wall', '不屈の防陣', 'Defense', 3, 'none', 0, 0, 'all_allies', 'unyielding_barrier', '/images/items/book_unyielding_wall_1781808100088.png', '不屈 of 防壁。2ターンの間、全体のDEF+25。自身の残りHPが30%以下ならバリア効果（ダメージ30軽減）を追加。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (108, 'card_sacrifice_oath', '犠牲の誓約', 'Defense', 2, 'none', 0, 0, 'single_ally', 'sacrifice_oath', '/images/items/book_sacrifice_oath_1781808111009.png', '身代わりの誓い。指定した味方のデバフを全て自身に引き受け、自身のDEFを2ターンの間+20する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (109, 'card_desperado', 'デスペラード', 'Skill', 3, 'none', 0, 50, 'single_enemy', 'desperado', '/images/items/book_desperado_1781808120065.png', '背水の一撃。自身の残りHPの割合が低いほど威力が上昇（最大3倍の150ダメージ）。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (110, 'card_sacrificial_ritual', '生贄の儀式', 'Support', 1, 'none', 0, 0, 'self', 'sacrificial_ap', '/images/items/book_sacrificial_ritual_1781808130718.png', '血の儀式。最大HPの15%を自傷。2ターンの間、手札の全ての物理スキルの消費APを1減少させる。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (111, 'card_desperate_strike', '捨て身の一撃', 'Skill', 2, 'none', 0, 70, 'single_enemy', 'desperate_debuff', '/images/items/book_desperate_strike_1781808140404.png', '捨て身の攻撃。70のダメージを与えるが、自身に2ターンの防御力DOWN（被ダメ1.5倍）を付与する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (112, 'card_detonation', 'デトネーション', 'Magic', 4, 'none', 0, 90, 'all_enemies', 'detonate_discard', '/images/items/book_detonation_1781808151205.png', '超絶全体魔法。全体に90ダメージを与えるが、発動後、使用者の手札からランダムに2枚のカードを除外する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (113, 'card_mana_charge', 'マナチャージ', 'Support', 2, 'none', 0, 0, 'self', 'mana_charge', '/images/items/book_mana_charge_1781808165101.png', '魔力集中。3ターンの間、スペルチャージを得る。効果中、Magicカードを使用するたびにAPが1回復する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (114, 'card_freeze_lancer', 'フリーズランサー', 'Magic', 2, 'none', 0, 30, 'single_enemy', 'freeze_exploit', '/images/items/book_freeze_lancer_1781808176255.png', '氷槍の追撃。威力: 30。対象が拘束または凍結の場合、1ターンのスタンを追加し、ダメージが1.5倍になる。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (115, 'card_chain_lightning', '雷電の連鎖', 'Magic', 3, 'none', 0, 20, 'random_enemy', 'chain_lightning', '/images/items/book_chain_lightning_1781808185985.png', '連鎖する雷。威力: 20の雷ダメージをランダムな敵に3回放つ。同一対象に連続ヒット時スタン率上昇。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (116, 'card_prominence', 'プロミネンス', 'Magic', 4, 'none', 0, 50, 'all_enemies', 'burn_exploit', '/images/items/book_prominence_1781808195431.png', '極大炎上魔法。敵全体に50の炎ダメージ＋炎上付与。すでに炎上の敵には、炎上残りターン×10の追加ダメージ。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (133, 'card_element_resonance', '属性の共鳴', 'Support', 1, 'none', 0, 0, 'all_allies', 'element_resonance', '/images/items/book_element_resonance_1781808352432.png', 'エレメンタル。次に使用するMagic属性に応じ全員にバフ(炎:ATK+10%/氷:DEF+10/雷:回避+10%)を付与。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (134, 'card_plasma_shower', 'プラズマシャワー', 'Magic', 3, 'none', 0, 30, 'all_enemies', 'plasma_stun', '/images/items/book_plasma_shower_1781808367043.png', '落雷の雨。全体に30の雷ダメージ。15%の確率で被弾した全ての敵に1ターンのスタンを付与。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (135, 'card_absolute_zero', 'アブソリュートゼロ', 'Magic', 3, 'none', 0, 25, 'all_enemies', 'absolute_zero', '/images/items/book_absolute_zero_1781808375050.png', '絶対零度。全体に25の氷ダメージ＋2ターンの間、敵全体の被クリティカル確率を15%上昇させる。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (136, 'card_fire_wave', 'ファイアウェーブ', 'Magic', 2, 'none', 0, 20, 'all_enemies', 'burn_extend', '/images/items/book_fire_wave_1781808385428.png', '烈火の波。全体に20の炎ダメージ＋炎上状態の持続ターンを1ターン延長する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (137, 'card_quick_draw', 'クイックドロー', 'Support', 1, 'none', 0, 0, 'self', 'quick_draw', '/images/items/book_quick_draw_1781808396512.png', '速引き。カードを2枚ドロー。このカードがこのターン中に使用された最初のカードなら、APを1回復。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (138, 'card_tactical_plan', 'タクティカルプラン', 'Support', 1, 'none', 0, 0, 'self', 'tactical_plan', '/images/items/book_tactical_plan_1781808406275.png', '作戦立案。デッキの上を3枚確認し、1枚を手札に加える。残りを任意の順番でデッキの上か下に戻す。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (139, 'card_time_reverse', 'タイムリバース', 'Support', 2, 'none', 0, 0, 'self', 'time_reverse', '/images/items/book_time_reverse_1781808416548.png', '時の巻き戻し。直前の使用カードを捨て札から戻し、そのAPコストをこのターンのみ半分(端数切り捨て)にする。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (140, 'card_mana_filter', 'マナフィルター', 'Support', 1, 'none', 0, 0, 'self', 'mana_filter', '/images/items/book_mana_filter_1781808425325.png', '魔力ろ過。手札のSupportまたはMagicカードを1枚捨て、APを3回復する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (121, 'card_death_sentence', '死神の宣告', 'Support', 4, 'none', 0, 0, 'single_enemy', 'death_sentence', '/images/items/book_death_sentence_1781808236722.png', '即死の呪い。対象に「宣告」を付与する（5ターン後、対象の残りHPに関わらず即死させる）。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (122, 'card_blood_pursuit', '血の追撃', 'Skill', 1, 'none', 0, 20, 'single_enemy', 'blood_pursuit', '/images/items/book_blood_pursuit_1781808246566.png', '出血追撃。威力: 20。対象が出血状態の場合、使用後にこのカードが手札に戻り、このターンの消費APが0になる（1T1回）。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (123, 'card_flame_burst', 'フレイムバースト', 'Magic', 2, 'none', 0, 15, 'all_enemies', 'burn_double', '/images/items/book_flame_burst_1781808256666.png', '炎上起爆魔法。全体に15ダメージ。対象が炎上状態の場合、その対象に対するダメージが2倍になる。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (124, 'card_frozen_wave', '凍てつく波動', 'Magic', 3, 'none', 0, 0, 'all_enemies', 'dispel_freeze', '/images/items/book_frozen_wave_1781808267687.png', '氷の波動。敵全体のすべてのバフ効果を解除し、1ターンの間「拘束（凍結）」状態にする。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (125, 'card_iron_bastion', 'アイアンバスティオン', 'Defense', 3, 'none', 0, 0, 'all_allies', 'cover_all', '/images/items/book_iron_bastion_1781808278646.png', '鉄壁の防壁。パーティ全員への単体攻撃を使用者が肩代わりし、自身のDEFを3ターンの間+35する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (126, 'card_revenge_shield', 'リベンジシールド', 'Defense', 2, 'none', 0, 0, 'self', 'revenge_shield', '/images/items/book_revenge_shield_1781808287823.png', '报复の盾。自身のDEF+15。次のターン、自分が受けたダメージの100%を相手に物理ダメージとして反射する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (127, 'card_giant_body', '巨人の肉体', 'Support', 1, 'none', 0, 0, 'single_ally', 'hp_cap_up', '/images/items/book_giant_body_1781808298415.png', '肉体強化。指定した味方の最大HPを戦闘終了まで+50し、HPを50回復する（最大HP上昇は累積しない）。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (128, 'card_grounding', 'グラウンディング', 'Defense', 2, 'none', 0, 0, 'self', 'stun_immune_up', '/images/items/book_grounding_1781808308871.png', '大地の構え。自身に「2ターンの間、スタン・拘束無効（スタン免疫）」を付与し、DEFを+15する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (129, 'card_pay_to_win', '成金の一撃', 'Skill', 2, 'none', 0, 30, 'single_enemy', 'gold_recoil', '/images/items/book_pay_to_win_1781803536472.png', 'ゴールド消費攻撃。威力: 30。所持ゴールドの2%(最大1')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (130, 'card_gambler_dice', 'ギャンブラーダイス', 'Skill', 1, 'none', 0, 60, 'single_enemy', 'random_dice', '/images/items/book_gambler_dice_1781808320188.png', '運試し。敵単体にランダムで 1 〜 120 の物理ダメージを与える（期待値60）。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (131, 'card_soul_boost', 'ソウルブースト', 'Support', 2, 'none', 0, 0, 'self', 'soul_boost', '/images/items/book_soul_boost_1781808330743.png', '魂の暴走。自身のHPを現在値の20%消費し、次の物理または魔法カードの威力を2.5倍にする。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (132, 'card_ruin_pact', '破滅の契約', 'Magic', 3, 'none', 0, 0, 'random_enemy', 'discard_all_damage', '/images/items/book_ruin_pact_1781808341084.png', '破滅の契約。手札の他のカードを全て除外し、除外したカード1枚につき25の魔法ダメージをランダムにばら撒く。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (117, 'card_brain_spin', 'ブレインスピン', 'Support', 1, 'none', 0, 0, 'self', 'brain_spin', '/images/items/book_brain_spin_1781808206627.png', '手札を全て捨て、新しく同じ枚数だけデッキからドローする。さらにAPを1回復する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (118, 'card_search_light', 'サーチライト', 'Support', 1, 'none', 0, 0, 'self', 'search_light', '/images/items/book_search_light_1781808216346.png', 'デッキから「Heal」または「Defense」タイプのカードを1枚指定して手札に加える。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (119, 'card_double_cast', 'ダブルキャスト', 'Support', 2, 'none', 0, 0, 'self', 'double_cast', '/images/items/book_double_cast_1781803523307.png', '次に使用する「Magic」または「Skill」カードが消費AP0で2回連続発動する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.cards (id, slug, name, type, ap_cost, cost_type, cost_val, effect_val, target_type, effect_id, image_url, description)
VALUES (120, 'card_recycle', 'リサイクル', 'Support', 1, 'none', 0, 0, 'self', 'recycle_focus', '/images/items/book_recycle_1781808226651.png', '捨て札から「Item」以外のランダムなカードを1枚手札に戻す。そのカードのAPコストは戦闘終了まで-1。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, type=EXCLUDED.type, ap_cost=EXCLUDED.ap_cost, cost_type=EXCLUDED.cost_type, cost_val=EXCLUDED.cost_val, effect_val=EXCLUDED.effect_val, target_type=EXCLUDED.target_type, effect_id=EXCLUDED.effect_id, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

-- 2. Insert skills
INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3101, 'book_catharsis', '魔術書:カタルシス', 101, 12000, 4, '{any}', 1, false, '/images/items/book_catharsis_1781803499014.png', '毒・炎上を即座に爆発させて大ダメージを与える魔術書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3102, 'book_wound_tear', '教本:傷口をえぐる', 102, 6000, 3, '{any}', 1, false, '/images/items/book_wound_tear_1781808056310.png', '出血状態の敵に真価を発揮する剣術書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3103, 'book_defpless_prey', '教本:無防備な獲物', 103, 7000, 3, '{any}', 1, false, '/images/items/book_defpless_prey_1781808066149.png', '行動不能状態の敵を容赦なく撃ち抜く刺突の書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3104, 'book_epidemic_fog', '魔術書:伝染病の霧', 104, 8000, 3, '{any}', 1, false, '/images/items/book_epidemic_fog_1781808075688.png', '毒の呪いを周囲に伝染させる禁忌の魔導書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3105, 'book_shield_slam', '教本:シールドスラム', 105, 8000, 3, '{any}', 1, false, '/images/items/book_shield_slam_1781803510217.png', '自身の防御バフの威力を衝撃波に変える盾闘術の書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3106, 'book_spike_armor', '教本:スパイクアーマー', 106, 5000, 2, '{any}', 1, false, '/images/items/book_spike_armor_1781808088434.png', '受けた攻撃の衝撃をトゲで返す反射防御の教本。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3107, 'book_unyielding_wall', '巻物:不屈の防陣', 107, 14000, 4, '{any}', 1, false, '/images/items/book_unyielding_wall_1781808100088.png', '危機的状況で味方を強固に守る不屈の防壁巻物。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3108, 'book_sacrifice_oath', '巻物:犠牲の誓約', 108, 4500, 2, '{any}', 1, false, '/images/items/book_sacrifice_oath_1781808111009.png', '仲間の厄災を引き受け、自身の盾とする近衛騎士の誓約書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3109, 'book_desperado', '教本:デスペラード', 109, 15000, 4, '{any}', 1, false, '/images/items/book_desperado_1781808120065.png', '自身の傷が深いほど破壊力を増す背水の一撃の書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3110, 'book_sacrificial_ritual', '教本:生贄の儀式', 110, 10000, 3, '{any}', 1, false, '/images/items/book_sacrificial_ritual_1781808130718.png', '自らの血肉を捧げ、物理スキルの消費APを減らす儀式教本。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3111, 'book_desperate_strike', '教本:捨て身の一撃', 111, 6000, 3, '{any}', 1, false, '/images/items/book_desperate_strike_1781808140404.png', '強力な一撃と引き換えに防御能力を低下させる捨て身の教本。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3112, 'book_detonation', '魔術書:デトネーション', 112, 16000, 4, '{any}', 1, false, '/images/items/book_detonation_1781808151205.png', '手札を犠牲にして破滅の炎を呼び覚ます魔導書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3113, 'book_mana_charge', '魔術書:マナチャージ', 113, 12000, 4, '{any}', 1, false, '/images/items/book_mana_charge_1781808165101.png', '魔法の詠唱速度と効率を高め、APを回復させる魔導書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3114, 'book_freeze_lancer', '魔術書:フリーズランサー', 114, 7500, 3, '{any}', 1, false, '/images/items/book_freeze_lancer_1781808176255.png', '凍りついた敵をさらに氷漬けにして砕き割る氷術書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3115, 'book_chain_lightning', '魔術書:雷電の連鎖', 115, 9000, 3, '{any}', 1, false, '/images/items/book_chain_lightning_1781808185985.png', '敵から敵へと伝う紫電を放つ連鎖雷撃の書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3116, 'book_prominence', '魔術書:プロミネンス', 116, 20000, 5, '{any}', 1, false, '/images/items/book_prominence_1781808195431.png', '戦場全体を焼き尽くす極大炎上魔法の古代魔導書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3117, 'book_brain_spin', '教本:ブレインスピン', 117, 5000, 2, '{any}', 1, false, '/images/items/book_brain_spin_1781808206627.png', '戦況に応じて手札を一気に整え直す精神統一の教本。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3118, 'book_search_light', '教本:サーチライト', 118, 8500, 3, '{any}', 1, false, '/images/items/book_search_light_1781808216346.png', 'デッキから守りや癒やしの技術を瞬時に呼び出す検索の書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3119, 'book_double_cast', '巻物:ダブルキャスト', 119, 22000, 5, '{any}', 1, false, '/images/items/book_double_cast_1781803523307.png', '次に放つ術や技を強制的に二重発動させる奥義の巻物。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3120, 'book_recycle', '教本:リサイクル', 120, 9500, 3, '{any}', 1, false, '/images/items/book_recycle_1781808226651.png', '使用済みの技術を脳内に呼び戻し、コストを下げる技術書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3121, 'book_death_sentence', '禁書:死神の宣告', 121, 25000, 4, '{any}', 1, true, '/images/items/book_death_sentence_1781808236722.png', '闇市: 5ターン後に相手を即死させる死神の呪い。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3122, 'book_blood_pursuit', '教本:血の追撃', 122, 5500, 2, '{any}', 1, false, '/images/items/book_blood_pursuit_1781808246566.png', '出血している敵を斬った勢いで即座に次の行動へ移る剣術書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3123, 'book_flame_burst', '魔術書:フレイムバースト', 123, 7500, 3, '{any}', 1, false, '/images/items/book_flame_burst_1781808256666.png', '燃え盛る対象を起爆し大炎上を引き起こす炎魔法の書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3124, 'book_frozen_wave', '魔術書:凍てつく波動', 124, 18000, 4, '{any}', 1, false, '/images/items/book_frozen_wave_1781808267687.png', '敵のバフを全て打ち消し凍結させる凍気魔法の書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3125, 'book_iron_bastion', '巻物:アイアンバスティオン', 125, 15000, 4, '{any}', 1, false, '/images/items/book_iron_bastion_1781808278646.png', '味方への攻撃を一手に引き受け、強固に耐え抜く重装騎士の巻物。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3126, 'book_revenge_shield', '教本:リベンジシールド', 126, 8000, 3, '{any}', 1, false, '/images/items/book_revenge_shield_1781808287823.png', '受けた攻撃のダメージを100%反射して返す報復の盾闘術書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3127, 'book_giant_body', '教本:巨人の肉体', 127, 4500, 2, '{any}', 1, false, '/images/items/book_giant_body_1781808298415.png', '肉体の限界値を一時的に引き上げ、強靭にする活性化の書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3128, 'book_grounding', '教本:グラウンディング', 128, 5000, 2, '{any}', 1, false, '/images/items/book_grounding_1781808308871.png', '大地の構えを取り、あらゆる拘束やスタンを跳ね返す防御教本。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3129, 'book_pay_to_win', '禁書:成金の一撃', 129, 15000, 4, '{any}', 1, true, '/images/items/book_pay_to_win_1781803536472.png', '闇市: 所持ゴールドを直接威力に変換する金満攻撃の禁書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3130, 'book_gambler_dice', '教本:ギャンブラーダイス', 130, 4000, 2, '{any}', 1, false, '/images/items/book_gambler_dice_1781808320188.png', '運を天に任せて破格の破壊力を狙うギャンブル教本。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3131, 'book_soul_boost', '教本:ソウルブースト', 131, 9000, 3, '{any}', 1, false, '/images/items/book_soul_boost_1781808330743.png', '自らの生命力を限界まで絞り出し、次の威力を跳ね上げる禁術書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3132, 'book_ruin_pact', '禁書:破滅の契約', 132, 18000, 3, '{any}', 1, true, '/images/items/book_ruin_pact_1781808341084.png', '闇市: 手札を全て除外して無数の魔弾を放つ破滅の契約書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3133, 'book_element_resonance', '教本:属性の共鳴', 133, 5000, 2, '{any}', 1, false, '/images/items/book_element_resonance_1781808352432.png', '次に唱える属性魔法に応じて味方全員を強化する共鳴の教本。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3134, 'book_plasma_shower', '魔術書:プラズマシャワー', 134, 8500, 3, '{any}', 1, false, '/images/items/book_plasma_shower_1781808367043.png', '広範囲に雷撃を落とし、敵全体をスタンさせる大雷撃の魔導書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3135, 'book_absolute_zero', '魔術書:アブソリュートゼロ', 135, 9000, 3, '{any}', 1, false, '/images/items/book_absolute_zero_1781808375050.png', '極寒の冷気で敵の熱量を奪い、クリティカルを受けやすくする氷術書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3136, 'book_fire_wave', '魔術書:ファイアウェーブ', 136, 6000, 2, '{any}', 1, false, '/images/items/book_fire_wave_1781808385428.png', '烈火の波。全体に20の炎ダメージ＋炎上状態の持続ターンを1ターン延長する。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3137, 'book_quick_draw', '教本:クイックドロー', 137, 5000, 2, '{any}', 1, false, '/images/items/book_quick_draw_1781808396512.png', 'ターンの初めに行うことでAPを減らさずにカードを引く速引の書。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3138, 'book_tactical_plan', '教本:タクティカルプラン', 138, 5000, 2, '{any}', 1, false, '/images/items/book_tactical_plan_1781808406275.png', 'デッキの上を予測し、完璧な配牌へと導く戦術立案の教本。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3139, 'book_time_reverse', '巻物:タイムリバース', 139, 12000, 4, '{any}', 1, false, '/images/items/book_time_reverse_1781808416548.png', '直前に使用した魔法や技をAP半減で呼び戻す時間遡行の巻物。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

INSERT INTO public.skills (id, slug, name, card_id, base_price, deck_cost, nation_tags, min_prosperity, is_black_market, image_url, description)
VALUES (3140, 'book_mana_filter', '教本:マナフィルター', 140, 5000, 2, '{any}', 1, false, '/images/items/book_mana_filter_1781808425325.png', '不要な魔力をAPへと変換し、大技へと繋げる魔力ろ過の教本。')
ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, name=EXCLUDED.name, card_id=EXCLUDED.card_id, base_price=EXCLUDED.base_price, deck_cost=EXCLUDED.deck_cost, nation_tags=EXCLUDED.nation_tags, min_prosperity=EXCLUDED.min_prosperity, is_black_market=EXCLUDED.is_black_market, image_url=EXCLUDED.image_url, description=EXCLUDED.description;

NOTIFY pgrst, 'reload schema';
