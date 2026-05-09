import os

docs = {
    "7010": {
        "slug": "qst_rol_heretic",
        "title": "異端者の粛清",
        "time": "2",
        "diff": "3",
        "rewards": "Gold:600|Order:10|Exp:100|Rep:5",
        "bg_thumb": "/images/quests/bg_church.png",
        "short_desc": "[討伐] 教会に背く異端の信徒たちを、騎士団に代わって旧市街の廃教会で処理する。",
        "long_desc": "聖騎士団からの非公式な依頼。王都の旧市街、光の届かない廃教会で「星の導き」を騙る異端者たちが集会を開いているという。彼らの教義は聖王国の秩序を乱す危険思想と認定された。騎士団が直接手を下せば民衆の反感を買うため、影の処理役が必要とされている。彼らを「浄化」し、街の秩序を保て。",
        "nodes": [
            ("start", "text", "bg_guild", "bgm_quest_calm", None, "聖騎士団の詰め所に呼ばれた。\n薄暗い執務室で、副隊長が分厚い羊皮紙を机に放り投げる。"),
            ("intro_1", "text", "bg_guild", None, "副隊長", "「旧市街の廃教会で、異端者どもが夜な夜な集会を開いている。\n　『偽りの神を捨て、真の星の導きに従え』などと妄言を吐く連中だ」"),
            ("intro_2", "text", "bg_guild", None, "副隊長", "「我々が直接動けば、無用な騒ぎになる。\n　冒険者よ、お前に『浄化』を頼みたい。手荒な真似になっても構わん」"),
            ("arrive_slum", "text", "bg_slums", "bgm_quest_tense", None, "王都の華やかな表通りから外れ、旧市街へと足を踏み入れる。\n日差しが遮られ、じめじめとした空気が肌を撫でた。"),
            ("slum_desc", "text", "bg_slums", None, None, "やせ細った野良犬が路地裏へ逃げ込む。\nこの辺りの住民たちは、異端の教えに救いを求めるほど追い詰められているのだろうか。"),
            ("church_out", "text", "bg_ruined_church", None, None, "目的の廃教会に到着した。\nステンドグラスは割れ、女神の彫像は顔が削り取られている。"),
            ("church_in", "text", "bg_ruined_church", None, None, "きしむ木の扉を押し開け、地下への階段を下りる。\nカビの匂いに混じって、甘ったるい香の匂いが漂ってきた。"),
            ("ritual_scene", "text", "bg_ruined_church", None, None, "地下の礼拝堂。\n黒いローブを着た十数人の男女が、奇妙な文様を描いた祭壇を囲んでいる。"),
            ("ritual_dialogue", "text", "bg_ruined_church", None, "異端の司祭", "「光は我らを救わない！ 真の救済は、星の海から訪れる！\n　今こそ偽りの偶像を打ち砕き??」"),
            ("confront", "text", "bg_ruined_church", None, None, "松明の光がこちらを照らし出した。\n信徒たちが一斉にこちらを振り返る。その目には異常な熱が宿っていた。"),
            ("cultist_shout", "text", "bg_ruined_church", None, "異端の司祭", "「騎士団の犬め！\n　星の導きを邪魔する者は、我らが手で排除する！」"),
            ("battle_cultists", "battle", "bg_ruined_church", "bgm_battle_tense", None, "異端者たちが隠し持っていた短剣を抜き、襲いかかってきた！\n(enemy_group_id: 102)"),
            ("after_battle_1", "text", "bg_ruined_church", "bgm_quest_calm", None, "狂信者たちは床に伏し、動かなくなった。\n祭壇の火が消え、地下室に再び冷たい静寂が戻る。"),
            ("after_battle_2", "text", "bg_ruined_church", None, None, "彼らが本当に国を脅かす存在だったのかは分からない。\nだが、これが依頼だ。証拠となる異端の教典を回収し、教会を後にした。"),
            ("report_knights", "text", "bg_guild", None, None, "騎士団の詰め所に戻り、教典を机の上に置く。"),
            ("knight_reply", "text", "bg_guild", None, "副隊長", "「見事な働きだ。これで王都の秩序は守られた。\n　お前のことは、口の堅い使える者として記憶しておこう」"),
            ("end_success", "end_success", "bg_guild", None, None, "報酬を受け取った。\n手の中の金貨の重さが、命の重さのように感じられた。"),
            ("end_failure", "end_failure", "bg_ruined_church", None, None, "狂信者たちの数の暴力に押し潰された。\n意識が遠のく中、彼らの祈りの声が不気味に響いていた。")
        ]
    },
    "7011": {
        "slug": "qst_rol_holywater",
        "title": "最前線への聖水輸送",
        "time": "4",
        "diff": "2",
        "rewards": "Gold:500|Exp:120|Rep:5",
        "bg_thumb": "/images/quests/bg_road_day.png",
        "short_desc": "[輸送] アンデッド対策として、前線の砦に祝福された聖水を運ぶ。",
        "long_desc": "教会からの正式な依頼。最前線の砦では腐臭が充満し、戦死者がアンデッドとして歩き出すという異常事態が発生している。彼らを土へ還し、兵士たちの士気を保つためには教会の「祝福された聖水」が不可欠だ。重い木箱を荷車に積み、魔物や亡者が彷徨う危険な街道を越えて、前線基地へと物資を輸送せよ。",
        "nodes": [
            ("start", "text", "bg_guild", "bgm_quest_calm", None, "教会の地下室で、大司祭から木箱を引き渡された。\n中には銀色の小瓶が何十本も隙間なく詰められている。"),
            ("intro_1", "text", "bg_guild", None, "大司祭", "「最前線の砦で、死者が歩き出しているという報告がありました。\n　この聖水は、彼らに安らかな眠りを与えるためのものです」"),
            ("intro_2", "text", "bg_guild", None, "大司祭", "「道中は危険ですが、兵士たちの命がかかっています。\n　どうか、無事に届けてください」"),
            ("travel_start", "text", "bg_road_day", "bgm_road", None, "木箱を荷車に載せ、王都の門を出発した。\n前線までは片道二日の道のりだ。"),
            ("travel_mid", "text", "bg_road_day", None, None, "街道は荒れ果て、すれ違う旅人もほとんどいない。\nただ、時折冷たい風に乗って、微かな腐臭が漂ってくる。"),
            ("camp", "text", "bg_camp", "bgm_quest_calm", None, "夜が訪れ、街道沿いの廃墟で野営の準備をする。\n焚き火の光だけが、周囲の闇を押し返していた。"),
            ("night_watch", "text", "bg_camp", "bgm_quest_tense", None, "見張りに立っていると、暗闇の奥から引きずるような足音が聞こえた。\n一つではない。複数だ。"),
            ("encounter_undead", "text", "bg_camp", None, None, "焚き火の光の端に、甲冑を着た骸骨や腐敗した兵士の姿が浮かび上がった。\n荷車に積まれた聖水の気配に引かれて集まってきたらしい。"),
            ("battle_undead", "battle", "bg_camp", "bgm_battle_tense", None, "亡者の群れが荷車に向かって群がってくる。聖水を守り抜け！\n(enemy_group_id: 101)"),
            ("after_battle", "text", "bg_camp", "bgm_quest_calm", None, "亡者たちは力尽き、再びただの骸となった。\n荷車を確認する。木箱は無事だ。"),
            ("morning_travel", "text", "bg_road_day", "bgm_road", None, "夜が明け、再び荷車を進める。\n遠くに、最前線の砦の堅牢な石壁が見えてきた。"),
            ("arrive_fort", "text", "bg_fort", None, None, "砦の門をくぐると、負傷兵のうめき声と血の匂いが充満していた。\n誰もが疲弊しきった顔をしている。"),
            ("meet_commander", "text", "bg_fort", None, "砦の守備隊長", "「教会からの支援物資か！ 助かった……！\n　これで今夜は、死んだ仲間と戦わずに済む」"),
            ("deliver", "text", "bg_fort", None, None, "守備隊長に木箱を引き渡す。\n彼は丁寧に木箱を受け取り、深く頭を下げた。"),
            ("end_success", "end_success", "bg_guild", None, None, "王都に戻り、教会に完了を報告した。\n報酬を受け取る。前線の兵士たちの安堵の顔が目に浮かんだ。"),
            ("end_failure", "end_failure", "bg_camp", None, None, "亡者の群れに押し切られ、荷車を奪われた。\n散乱した聖水が地面に吸い込まれていくのを、朦朧とする意識の中で見ていた。")
        ]
    },
    "7012": {
        "slug": "qst_rol_pilgrim",
        "title": "聖地巡礼者の護衛",
        "time": "5",
        "diff": "3",
        "rewards": "Gold:700|Exp:150|Rep:10",
        "bg_thumb": "/images/quests/bg_road_day.png",
        "short_desc": "[護衛] 狂信的な巡礼者を護送する。彼が死ねば報酬はない。",
        "long_desc": "教会からの依頼。西の山脈にある古い聖地の祠まで、熱心な巡礼者「アルバート」を護衛する任務。道中は山賊や魔物が出没する危険地帯だが、アルバートは「神の御加護」を盲信しており、一切の危険を省みずに歩き続けるという厄介な人物だ。彼を死なせずに聖地へ届け、無事に祈りを捧げさせることができれば高額な報酬が約束されている。",
        "nodes": [
            ("start", "text", "bg_guild", "bgm_quest_calm", None, "教会の入り口で、依頼主である巡礼者と対面した。\n質素なローブを纏い、首から大きな十字架を下げた男だ。"),
            ("intro_1", "text", "bg_guild", None, "巡礼者アルバート", "「あなたが護衛の方ですね。\n　主神の声が聞こえるのです。あの危険な谷の奥底へ行かねばなりません」"),
            ("intro_2", "text", "bg_guild", None, "巡礼者アルバート", "「あなたが私の盾となるのは、神の思し召しです。\n　さあ、参りましょう。神の御導きのままに」"),
            ("join_albert", "text", "bg_road_day", None, None, "まったく話が通じない相手だ。\nともかく、彼が死ねば報酬はない。聖地への長い旅が始まった。"),
            ("mountain_road", "text", "bg_mountain", "bgm_road", None, "数日後、険しい山道に差し掛かった。\n岩肌が露出し、道幅は馬車一台がやっと通れる程度しかない。"),
            ("albert_walk", "text", "bg_mountain", None, "巡礼者アルバート", "「おお……神の試練が私の足元に。\n　この苦難こそが、信仰の証なのです」"),
            ("warning", "text", "bg_mountain", None, None, "アルバートは足元の悪さも気にせず、祈りを呟きながら歩き続ける。\n周囲の岩陰から、殺気を感じた。"),
            ("ambush", "text", "bg_mountain", "bgm_quest_tense", None, "「そこまでだ、巡礼者さんよ」\n前方の岩の上から、弓を番えた男が顔を出した。背後からも足音がする。"),
            ("bandit_threat", "text", "bg_mountain", None, "山賊の頭", "「教会からたっぷり旅の資金を持たされてるんだろ？\n　置いていきな。命までは取らねえよ」"),
            ("albert_ignore", "text", "bg_mountain", None, "巡礼者アルバート", "「……（ぶつぶつと祈りの言葉を唱え続けている）」"),
            ("albert_ignore_2", "text", "bg_mountain", None, None, "アルバートは全く動じず、山賊の脅しを完全に無視して歩き出そうとする。\n山賊たちが怒りの形相で得物を構えた！"),
            ("battle_bandit", "battle", "bg_mountain", "bgm_battle_tense", None, "山賊の群れが襲いかかってきた！アルバートを守り抜け！\n(enemy_group_id: 102)"),
            ("after_battle", "text", "bg_mountain", "bgm_quest_calm", None, "山賊たちを撃退した。\nアルバートを見ると、彼はかすり傷一つ負わず、ただ祈り続けていた。"),
            ("albert_praise", "text", "bg_mountain", None, "巡礼者アルバート", "「神の御加護が、悪漢どもを退けたのですね。\n　主よ、感謝いたします」"),
            ("sigh", "text", "bg_mountain", None, None, "戦ったのはこちらなのだが。\nため息をつきつつ、先を急ぐことにする。"),
            ("arrive_shrine", "text", "bg_shrine", None, None, "ついに目的の聖地の祠に到着した。\n風化して苔生した小さな石造りの祠だ。"),
            ("albert_pray", "text", "bg_shrine", None, None, "アルバートは祠の前に跪き、地面に額をつけて長い祈りを始めた。\n日が暮れるまで、彼はそこから動かなかった。"),
            ("albert_thanks", "text", "bg_shrine", None, "巡礼者アルバート", "「……お前がいてくれてよかったかもしれぬ。\n　神の意志を実現する手足として、よく働いてくれました」"),
            ("leave_albert", "text", "bg_shrine", None, None, "珍しく素直な言葉だった。\nアルバートをその場に残し、帰途につく。"),
            ("end_success", "end_success", "bg_guild", None, None, "教会に戻り、護衛完了を報告して報酬を受け取った。\nあの男は今も、あの山奥で祈り続けているのだろうか。"),
            ("end_failure", "end_failure", "bg_mountain", None, None, "山賊の凶刃がアルバートを貫いた。\n神の加護は、彼を護ってはくれなかった。護衛失敗だ。")
        ]
    },
    "7013": {
        "slug": "qst_rol_undead",
        "title": "遺体安置所の亡者討伐",
        "time": "2",
        "diff": "3",
        "rewards": "Gold:450|Exp:100|Rep:8",
        "bg_thumb": "bg_crypt",
        "short_desc": "[討伐] 瘴気によって動き出した腐乱死体たちを土へと還す。",
        "long_desc": "聖騎士団からの緊急依頼。王都の地下にある教区の共同墓地（遺体安置所）で、死体が瘴気に当てられてアンデッド化し、徘徊している。このままでは地上に被害が出るため、安置所は現在封鎖されている。内部へ潜入し、動く死体たちを物理的に「昇天」させ、元凶となっている瘴気の源を絶つ必要がある。閉鎖空間での連戦に備えよ。",
        "nodes": [
            ("start", "text", "bg_guild", "bgm_quest_calm", None, "聖騎士団の詰め所に呼ばれた。\n緊迫した空気が漂う中、担当の騎士が地図を広げる。"),
            ("intro_1", "text", "bg_guild", None, "担当の騎士", "「教区の共同墓地を閉鎖した。\n　罪深き霊が肉体を求めて彷徨い、死体が動き出している」"),
            ("intro_2", "text", "bg_guild", None, "担当の騎士", "「彼らの手足を切り落とし、物理的に昇天させたまえ。\n　そして、なぜ瘴気が発生しているのか、原因を突き止めてくれ」"),
            ("enter_crypt", "text", "bg_crypt", "bgm_quest_tense", None, "閉鎖された遺体安置所の鉄格子を開け、地下への石段を下りる。\n途端に、強烈な腐敗臭と冷気が押し寄せてきた。"),
            ("crypt_desc", "text", "bg_crypt", None, None, "壁面に並んだ棺の一部が破壊され、中身がもぬけの殻になっている。\n暗闇の奥から、湿った足音とうめき声が聞こえてきた。"),
            ("encounter_wave1", "text", "bg_crypt", None, None, "松明を掲げると、通路を塞ぐように数体の腐乱死体が立っていた。\n生者の熱を感知し、こちらへ向き直る。"),
            ("battle_wave1", "battle", "bg_crypt", "bgm_battle_tense", None, "遺体安置所の亡者たちが襲いかかってきた！\n(enemy_group_id: 101)"),
            ("after_wave1", "text", "bg_crypt", "bgm_quest_tense", None, "最初の群れを切り伏せた。\n腐肉を焼く匂いが地下にこもる。だが、奥からさらに濃い瘴気が流れてくる。"),
            ("deeper", "text", "bg_crypt", None, None, "血糊を払い、安置所のさらに深部へと進む。\n床は冷たく湿り、壁には黒いカビのようなものがびっしりと生えている。"),
            ("find_altar", "text", "bg_crypt", None, None, "最奥の広間。かつては祈りを捧げる場所だったのだろう。\nそこには、一際巨大で、甲冑を着たままの死鬼が待ち構えていた。"),
            ("boss_desc", "text", "bg_crypt", None, None, "その背後の祭壇には、黒く脈打つ不気味な石が置かれている。\nあれが瘴気の源か。"),
            ("battle_wave2", "battle", "bg_crypt", "bgm_battle_boss", None, "安置所の奥底で、強力な亡者との戦闘！\n(enemy_group_id: 103)"),
            ("after_wave2", "text", "bg_crypt", "bgm_quest_calm", None, "甲冑の死鬼が崩れ落ち、沈黙した。\n残るは、祭壇で不気味な波動を放つ黒い石だけだ。"),
            ("destroy_stone", "text", "bg_crypt", None, None, "剣を振り下ろし、黒い石を真っ二つに叩き割る。\nガラスが割れるような甲高い音と共に、地下を満たしていた瘴気が一気に霧散した。"),
            ("purge_done", "text", "bg_crypt", None, None, "空気が澄んでいくのが分かる。もう死体が起き上がることはないだろう。\nそれにしても、誰がこんなものを持ち込んだのか。"),
            ("report", "text", "bg_guild", None, None, "騎士団に戻り、討伐の完了と黒い石の破片を報告した。"),
            ("knight_thanks", "text", "bg_guild", None, "担当の騎士", "「見事だ。この石は……異端の呪具か。\n　背後関係はこちらで洗おう。助かった」"),
            ("end_success", "end_success", "bg_guild", None, None, "報酬を受け取った。\n地下の腐臭は、まだ鼻の奥にこびりついている気がした。"),
            ("end_failure", "end_failure", "bg_crypt", None, None, "無数の亡者の手に引きずり倒された。\n自分もまた、この冷たい地下で永遠に彷徨う肉の塊となるのだ。")
        ]
    },
    "7014": {
        "slug": "qst_rol_tithe",
        "title": "強圧的な十分の一税徴収",
        "time": "1",
        "diff": "2",
        "rewards": "Gold:600|Exp:50|Evil:10",
        "bg_thumb": "bg_slums",
        "short_desc": "[徴収] 貧民層から無理やり税を取り立てる任務。抵抗者は力でねじ伏せろ。",
        "long_desc": "教会からの裏の依頼。聖王国の教義で定められた「十分の一税」を、旧市街の貧民街から強制的に徴収する。彼らに払う余裕などないことは明白だが、教会の権威を示すための見せしめとしての意味合いが強い。住民の怒りと抵抗は必至。倫理を捨て、ただ任務として金目のものを根こそぎ奪い取ってこい。",
        "nodes": [
            ("start", "text", "bg_guild", "bgm_quest_calm", None, "酒場の裏口で、教会の使いと名乗る男から小袋を渡された。\n中には旧市街の住民のリストが入っている。"),
            ("intro_1", "text", "bg_guild", None, "教会の使い", "「税を払わぬゴミ共は、聖帝国の恩恵を受ける資格がありません。\n　リストの家から、十分の一税を回収してください」"),
            ("intro_2", "text", "bg_guild", None, "教会の使い", "「金がなければ、家財を売ってでも。抵抗するなら、力ずくで。\n　正式な記録には残りません。あなたの裁量にお任せします」"),
            ("arrive_slum", "text", "bg_slums", "bgm_quest_tense", None, "リストを手に、旧市街の貧民街へ足を踏み入れる。\nすれ違う人々の目が、警戒と敵意に満ちているのが分かった。"),
            ("first_house", "text", "bg_slums", None, None, "最初の対象の家。半壊した長屋の扉を叩く。\n中から、怯えた様子の老夫婦が出てきた。"),
            ("demand_1", "text", "bg_slums", None, "貧民街の老人", "「税の徴収……？ 勘弁してくだされ。\n　昨日のパンを買う金すら、もう残っとらんのです」"),
            ("demand_2", "text", "bg_slums", None, None, "老人の服は継ぎ接ぎだらけで、部屋の中には本当に何もない。\nだが、これも仕事だ。払え、と剣の柄に手をかけて脅す。"),
            ("mob_anger", "text", "bg_slums", None, "周囲の住民", "「おい！ また教会の手先か！」\n「ふざけるな！ 俺たちからこれ以上何を奪う気だ！」"),
            ("mob_gather", "text", "bg_slums", None, None, "騒ぎを聞きつけ、周囲から怒り狂った住民たちが集まってきた。\n彼らの手には、棍棒や農具が握られている。"),
            ("mob_shout", "text", "bg_slums", None, "貧民街の若者", "「こんな奴ら、ここで殺して川に流しちまえ！\n　やっちまえ！！」"),
            ("battle_mob", "battle", "bg_slums", "bgm_battle_tense", None, "怒り狂った暴徒たちが押し寄せてきた！容赦なく叩き伏せろ！\n(enemy_group_id: 404)"),
            ("after_battle", "text", "bg_slums", "bgm_quest_calm", None, "血を流し、うめき声を上げて倒れる住民たち。\nこれ以上の抵抗の意志は完全に砕かれたようだ。"),
            ("extort", "text", "bg_slums", None, None, "倒れた者たちの懐を探り、隠し持っていたなけなしの銅貨や銀貨を奪う。\n家探しをして、少しでも金になりそうなガラクタを袋に詰めた。"),
            ("extort_2", "text", "bg_slums", None, None, "周囲の家からはすすり泣く声が聞こえる。\n誰もこちらを見ようとはしなかった。任務は完了だ。"),
            ("report", "text", "bg_guild", None, None, "夜更けの路地裏で、教会の使いに回収した袋を渡す。\n彼は中身を数えもせず、重さだけで満足そうに頷いた。"),
            ("end_success", "end_success", "bg_guild", None, None, "約束の報酬を受け取った。\n手の中の金は、酷く汚いものに思えたが、これが現実だ。"),
            ("end_failure", "end_failure", "bg_slums", None, None, "飢えと絶望に駆られた暴徒の力は凄まじかった。\n農具で殴り倒され、貧民街の泥の中に沈んだ。")
        ]
    },
    "7015": {
        "slug": "qst_rol_relic",
        "title": "盗まれた聖遺物の奪還",
        "time": "3",
        "diff": "4",
        "rewards": "Gold:700|Exp:200|Rep:10",
        "bg_thumb": "bg_ruined_church",
        "short_desc": "[奪還] 盗賊団のアジトを襲撃し、教会から盗まれた聖杯を奪い返す。",
        "long_desc": "王都の教会宝物庫から、国宝級の最古の聖杯が盗み出された。情報提供者によれば、実行犯は王都近郊の森に潜む大規模な盗賊団だという。闇市に流れる前に強襲をかけ、一味を壊滅させて聖杯を取り戻すのが目的だ。敵は手練れの盗賊たちであり、頭目はかなりの腕利きらしい。血まみれになってでも主の器を取り戻せ。",
        "nodes": [
            ("start", "text", "bg_guild", "bgm_quest_calm", None, "教会の司教から直々の依頼を受けた。\n宝物庫から最古の聖杯が盗み出されたという。"),
            ("intro_1", "text", "bg_guild", None, "司教", "「身の程知らずのネズミどもが、主の器を汚しました。\n　奴らの隠れ家は、東の森の奥にある廃城跡だと判明しています」"),
            ("intro_2", "text", "bg_guild", None, "司教", "「闇市に流される前に、必ず取り戻してください。\n　血まみれにしてでも構いません。神罰を下すのです」"),
            ("forest_approach", "text", "bg_forest_day", "bgm_road", None, "東の森を抜け、廃城跡に近づく。\n苔むした石壁の隙間に、見張りの男たちが立っているのが見えた。"),
            ("stealth_or_assault", "text", "bg_forest_day", None, None, "隠れて潜入するには見張りの数が多すぎる。\n正面突破が手っ取り早いだろう。武器を構え、歩み出る。"),
            ("spotted", "text", "bg_forest_day", "bgm_quest_tense", None, "「誰だ！？ 騎士団の犬か！」\n見張りの一人が声を上げ、クロスボウを構えた。"),
            ("assault", "text", "bg_forest_day", None, None, "矢を弾き落とし、見張りの懐へ飛び込む。\n一気にアジト内が騒がしくなり、無数の足音がこちらへ向かってきた。"),
            ("battle_wave1", "battle", "bg_forest_day", "bgm_battle_tense", None, "盗賊団の構成員たちが立ちはだかる！\n(enemy_group_id: 102)"),
            ("after_wave1", "text", "bg_forest_day", "bgm_quest_tense", None, "前衛の盗賊たちを斬り伏せた。\n悲鳴と怒号を聞きつけ、廃城の奥から大柄な男が姿を現す。"),
            ("boss_appear", "text", "bg_forest_day", None, "盗賊団の頭目", "「てめえ、たった一人で乗り込んできやがったのか。\n　いい度胸だが、死に場所を間違えたな」"),
            ("boss_talk", "text", "bg_forest_day", None, "盗賊団の頭目", "「あの金ピカの杯は俺たちのモンだ。\n　あれを売れば、一生遊んで暮らせるんだよ！」"),
            ("battle_wave2", "battle", "bg_forest_day", "bgm_battle_boss", None, "盗賊団の頭目と精鋭部隊との決戦！\n(enemy_group_id: 401)"),
            ("after_wave2", "text", "bg_forest_day", "bgm_quest_calm", None, "激闘の末、頭目が崩れ落ちた。\n残った手下たちは蜘蛛の子を散らすように逃げていった。"),
            ("find_relic", "text", "bg_forest_day", None, None, "頭目のテントを漁ると、厳重に鍵の掛かった木箱が見つかった。\n錠を壊して開けると、見事な金の聖杯が鎮座している。"),
            ("check_relic", "text", "bg_forest_day", None, None, "傷ひとつない。無事だ。\nこれを布に包んで背負い、血に染まった廃城を後にした。"),
            ("report", "text", "bg_guild", None, None, "王都に戻り、司教に聖杯を献上する。\n彼は聖杯を受け取ると、震える手でそれを高く掲げた。"),
            ("bishop_thanks", "text", "bg_guild", None, "司教", "「おお……主よ。あなたの器が戻りました。\n　冒険者よ、大儀であった。これは教会からの感謝の印だ」"),
            ("end_success", "end_success", "bg_guild", None, None, "多額の報酬を受け取った。\n盗賊たちの命の代償としては、十分すぎる額だった。"),
            ("end_failure", "end_failure", "bg_forest_day", None, None, "盗賊団の連携は見事だった。\n多勢に無勢。剣を弾かれ、意識が闇に沈んでいく。")
        ]
    }
}

for q_id, data in docs.items():
    file_path = f"docs/quest/quest_{q_id}_{data['slug'].replace('qst_rol_', '')}.md"
    content = f"""# クエスト仕様書：{q_id} ? {data['title']}

## 0. ファイル概要

| 項目 | 値 |
|-----|-----|
| **Quest ID** | {q_id} |
| **Slug** | {data['slug']} |
| **クエスト種別** | 聖王国クエスト（Roland） |
| **推奨レベル** | 4（Normal） |
| **難度** | {data['diff']} |
| **依頼主** | 教会 / 聖騎士団 |
| **出現条件** | 制限なし / 出現拠点: loc_holy_empire |
| **リピート** | リピート可能 |
| **難易度Tier** | Normal（rec_level: 4） |
| **経過日数 (time_cost)** | {data['time']} |
| **ノード数** | {len(data['nodes'])}ノード |
| **サムネイル画像** | {data['bg_thumb']} |

## 1. クエスト概要

### 短文説明
`
{data['short_desc']}
`

### 長文説明
`
{data['long_desc']}
`

## 2. 報酬定義

**CSV記載形式:**
`
{data['rewards']}
`

## 3. シナリオノードフロー

"""
    for node in data['nodes']:
        node_id, n_type, bg, bgm, speaker, text = node
        content += f"#### {node_id}（{n_type}）\n"
        meta = []
        if bg: meta.append(f"bg: {bg}")
        if bgm: meta.append(f"bgm: {bgm}")
        if speaker: meta.append(f"speaker: {speaker}")
        if meta:
            content += f"**演出:** {', '.join(meta)}\n"
        content += "`	ext\n"
        content += f"{text}\n"
        content += "`\n\n"
        
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated {file_path}")
