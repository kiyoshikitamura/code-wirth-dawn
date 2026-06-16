-- Fix transition bugs in scenario 7008 (qst_gen_mercy)
UPDATE scenarios 
SET script_data = '{
  "nodes": {
    "start_prep": {
      "text": "冒険者ギルドは喧騒に満ちていた。高額な討伐任務の張り紙の陰で、一枚の薄汚れた紙を見つける。",
      "type": "text",
      "bg_key": "bg_guild",
      "next": "start",
      "choices": [
        {
          "label": "続ける",
          "next": "start"
        }
      ]
    },
    "start": {
      "text": "それは難民野営地からの救援依頼だった。震える手で書かれたような文字が、薬草の調達を必死に懇願していた。",
      "type": "text",
      "bg_key": "bg_guild",
      "next": "text_01",
      "choices": [
        {
          "label": "続ける",
          "next": "text_01"
        }
      ]
    },
    "text_01": {
      "text": "「癒やし草を五束、どうか届けてください」——そう綴られた依頼は、誰にも見向きもされていなかった。",
      "type": "text",
      "bg_key": "bg_guild",
      "next": "text_02",
      "choices": [
        {
          "label": "続ける",
          "next": "text_02"
        }
      ]
    },
    "text_02": {
      "text": "金にならない慈善事業だが、このまま見捨てるのも寝覚めが悪い。依頼書を乱暴に剥ぎ取り、懐へと押し込んだ。",
      "type": "text",
      "bg_key": "bg_guild",
      "next": "meet_01",
      "choices": [
        {
          "label": "続ける",
          "next": "meet_01"
        }
      ]
    },
    "meet_01": {
      "text": "指定された酒場へ向かう。昼間の店内は荒れており、隅の席で若い修道女が小さく身を縮めていた。",
      "type": "text",
      "bg_key": "bg_tavern_day",
      "next": "meet_02",
      "choices": [
        {
          "label": "続ける",
          "next": "meet_02"
        }
      ]
    },
    "meet_02": {
      "text": "彼女の白い法衣は泥に汚れ、目の下には濃い隈が刻まれている。限界はもう目前に違いない。",
      "type": "text",
      "bg_key": "bg_tavern_day",
      "next": "meet_03",
      "choices": [
        {
          "label": "続ける",
          "next": "meet_03"
        }
      ]
    },
    "meet_03": {
      "text": "「引き受けてくださり感謝します。私はシスター・エレナ。難民の治療を行っています」",
      "type": "text",
      "bg_key": "bg_tavern_day",
      "speaker_name": "シスター・エレナ",
      "speaker": "シスター・エレナ",
      "next": "meet_04",
      "choices": [
        {
          "label": "続ける",
          "next": "meet_04"
        }
      ]
    },
    "meet_04": {
      "text": "「怪我人が増え、手持ちの薬草が尽きてしまいました。どうか力を貸してください」",
      "type": "text",
      "bg_key": "bg_tavern_day",
      "speaker_name": "シスター・エレナ",
      "speaker": "シスター・エレナ",
      "next": "camp_01",
      "choices": [
        {
          "label": "続ける",
          "next": "camp_01"
        }
      ]
    },
    "camp_01": {
      "text": "彼女に同行し、街外れの難民野営地を訪れた。粗末な布テントが泥濘にいくつも並んでいる。",
      "type": "text",
      "bg_key": "bg_road_day",
      "next": "camp_scenery",
      "choices": [
        {
          "label": "続ける",
          "next": "camp_scenery"
        }
      ]
    },
    "camp_scenery": {
      "text": "そこら中から咳き込む声や呻き声が聞こえる。衛生的とは言えない過酷な環境だった。",
      "type": "text",
      "bg_key": "bg_road_day",
      "next": "camp_02",
      "choices": [
        {
          "label": "続ける",
          "next": "camp_02"
        }
      ]
    },
    "camp_02": {
      "text": "テントの奥では老人が熱にうなされ、化膿した傷口からは酷い悪臭が立ち上る。",
      "type": "text",
      "bg_key": "bg_road_day",
      "next": "camp_03",
      "choices": [
        {
          "label": "続ける",
          "next": "camp_03"
        }
      ]
    },
    "camp_03": {
      "text": "「皆、矢傷や病で苦しんでいます。傷を癒やすための薬草が、どうしても必要なのです」",
      "type": "text",
      "bg_key": "bg_road_day",
      "speaker_name": "シスター・エレナ",
      "speaker": "シスター・エレナ",
      "next": "info_01",
      "choices": [
        {
          "label": "続ける",
          "next": "info_01"
        }
      ]
    },
    "info_01": {
      "text": "「森の奥、沢沿いの苔むした岩場に白い花を咲かせる薬草です。どうか探してください」",
      "type": "text",
      "bg_key": "bg_road_day",
      "speaker_name": "シスター・エレナ",
      "speaker": "シスター・エレナ",
      "next": "info_02",
      "choices": [
        {
          "label": "続ける",
          "next": "info_02"
        }
      ]
    },
    "info_02": {
      "text": "「怪我人たちの命を救うため、最低でも五束は持ち帰っていただく必要があります」",
      "type": "text",
      "bg_key": "bg_road_day",
      "speaker_name": "シスター・エレナ",
      "speaker": "シスター・エレナ",
      "next": "forest_enter",
      "choices": [
        {
          "label": "続ける",
          "next": "forest_enter"
        }
      ]
    },
    "forest_enter": {
      "text": "日暮れまでに戻らねば、野営地の者たちは手遅れになる。私たちは急ぎ、薄暗い森へ足を踏み入れた。",
      "type": "text",
      "bg_key": "bg_forest_day",
      "next": "gather_01",
      "choices": [
        {
          "label": "続ける",
          "next": "gather_01"
        }
      ]
    },
    "gather_01": {
      "text": "木々の隙間を抜け、冷たい水の音が響く沢に辿り着いた。苔むした岩肌に咲く白い花を見つける。",
      "type": "text",
      "bg_key": "bg_forest_day",
      "next": "gather_02",
      "choices": [
        {
          "label": "続ける",
          "next": "gather_02"
        }
      ]
    },
    "gather_02": {
      "text": "茎を傷つけないよう慎重にナイフで刈り取る。まずは一束目だ。だが、これだけでは足りない。",
      "type": "text",
      "bg_key": "bg_forest_day",
      "next": "gather_03",
      "choices": [
        {
          "label": "続ける",
          "next": "gather_03"
        }
      ]
    },
    "gather_03": {
      "text": "湿った腐葉土を踏みしめ、周囲を探す。倒木の陰に小さな群生を見つけ、さらに二束を確保することに成功した。",
      "type": "text",
      "bg_key": "bg_forest_day",
      "next": "gather_04",
      "choices": [
        {
          "label": "続ける",
          "next": "gather_04"
        }
      ]
    },
    "gather_04": {
      "text": "すでに陽が傾き始めている。森の影が徐々に伸びる中、私たちは沢の上流へと捜索範囲を広げていく。",
      "type": "text",
      "bg_key": "bg_forest_day",
      "next": "branch",
      "choices": [
        {
          "label": "続ける",
          "next": "branch"
        }
      ]
    },
    "branch": {
      "type": "random_branch",
      "bg_key": "bg_forest_day",
      "prob": 70,
      "choices": [
        {
          "label": "success",
          "next": "gather_ok"
        },
        {
          "label": "failure",
          "next": "gather_fail_01"
        }
      ]
    },
    "gather_ok": {
      "text": "運良く上流の岩陰に群生が残っていた。四束目、五束目を刈り取り、用意した布で丁寧に包む。",
      "type": "text",
      "bg_key": "bg_forest_day",
      "next": "deliver",
      "choices": [
        {
          "label": "続ける",
          "next": "deliver"
        }
      ]
    },
    "gather_fail_01": {
      "text": "だが、沢の上流は日照りで乾ききっており、白い花はすべて枯れ果てていた。三束しかない。",
      "type": "text",
      "bg_key": "bg_forest_day",
      "next": "gather_fail_02",
      "choices": [
        {
          "label": "続ける",
          "next": "gather_fail_02"
        }
      ]
    },
    "gather_fail_02": {
      "text": "手持ちの荷物の中に、以前採取した『癒やし草』が残っていれば補填できるかもしれないが……",
      "type": "text",
      "bg_key": "bg_forest_day",
      "next": "check",
      "choices": [
        {
          "label": "続ける",
          "next": "check"
        }
      ]
    },
    "check": {
      "type": "check_delivery",
      "bg_key": "bg_forest_day",
      "params": {
        "item_id": "702",
        "quantity": 5
      },
      "choices": [
        {
          "label": "success",
          "next": "gather_backup"
        },
        {
          "label": "failure",
          "next": "not_enough"
        }
      ]
    },
    "gather_backup": {
      "text": "荷袋から古い薬草を取り出し、合わせる。これでなんとか五束分だ。急いで野営地へ戻ろう。",
      "type": "text",
      "bg_key": "bg_forest_day",
      "next": "deliver",
      "choices": [
        {
          "label": "続ける",
          "next": "deliver"
        }
      ]
    },
    "not_enough": {
      "text": "持ってきた三束だけでは、全員を救う薬としては少なすぎる。だが、持ち帰るしかない。",
      "type": "text",
      "bg_key": "bg_forest_day",
      "next": "not_enough_02",
      "choices": [
        {
          "label": "続ける",
          "next": "not_enough_02"
        }
      ]
    },
    "not_enough_02": {
      "text": "野営地に戻り、薬草を差し出す。エレナは受け取ったが、その表情は陰っていた。",
      "type": "text",
      "bg_key": "bg_road_day",
      "next": "not_enough_03",
      "choices": [
        {
          "label": "続ける",
          "next": "not_enough_03"
        }
      ]
    },
    "not_enough_03": {
      "text": "「ありがとうございます。ですが……これだけでは、救えない命が出てしまいます」",
      "type": "text",
      "bg_key": "bg_road_day",
      "speaker_name": "シスター・エレナ",
      "speaker": "シスター・エレナ",
      "next": "end_failure",
      "choices": [
        {
          "label": "続ける",
          "next": "end_failure"
        }
      ]
    },
    "end_failure": {
      "text": "薬草が足りず、手当ては不完全に終わった。自分の力不足を呪いながら、野営地を去った。",
      "type": "end",
      "result": "failure",
      "bg_key": "bg_road_day",
      "choices": []
    },
    "deliver": {
      "text": "夕闇が野営地を包む頃、私たちは戻った。入り口でシスター・エレナが焦燥した顔で待っていた。",
      "type": "text",
      "bg_key": "bg_road_day",
      "next": "deliver_02",
      "choices": [
        {
          "label": "続ける",
          "next": "deliver_02"
        }
      ]
    },
    "deliver_02": {
      "text": "五束の薬草を手渡すと、彼女はそれを愛おしそうに胸に抱きしめ、張り詰めていた糸が切れたように息を吐く。",
      "type": "text",
      "bg_key": "bg_road_day",
      "next": "deliver_03",
      "choices": [
        {
          "label": "続ける",
          "next": "deliver_03"
        }
      ]
    },
    "deliver_03": {
      "text": "「よかった……これで薬を作れます。本当に、本当にありがとうございました」",
      "type": "text",
      "bg_key": "bg_road_day",
      "speaker_name": "シスター・エレナ",
      "speaker": "シスター・エレナ",
      "next": "deliver_04",
      "choices": [
        {
          "label": "続ける",
          "next": "deliver_04"
        }
      ]
    },
    "deliver_04": {
      "text": "「これしかお渡しできませんが、どうかお受け取りください」",
      "type": "text",
      "bg_key": "bg_road_day",
      "speaker_name": "シスター・エレナ",
      "speaker": "シスター・エレナ",
      "next": "deliver_pay",
      "choices": [
        {
          "label": "続ける",
          "next": "deliver_pay"
        }
      ]
    },
    "deliver_pay": {
      "text": "彼女の細い手から、数枚の汚れた銅貨を受け取った。これが彼らの全財産なのだろう。",
      "type": "text",
      "bg_key": "bg_road_day",
      "next": "deliver_apply",
      "choices": [
        {
          "label": "続ける",
          "next": "deliver_apply"
        }
      ]
    },
    "deliver_apply": {
      "text": "彼女は休む間もなく、すり鉢で薬草の調合を始めた。手際よく怪我人の手当てに当たっていく。",
      "type": "text",
      "bg_key": "bg_road_day",
      "next": "end_success",
      "choices": [
        {
          "label": "続ける",
          "next": "end_success"
        }
      ]
    },
    "end_success": {
      "text": "報酬は銅貨10枚。だが、野営地の呻き声は小さくなった。少しは救いがあったのだろう。",
      "type": "end",
      "result": "success",
      "bg_key": "bg_road_day",
      "params": {
        "rewards": {
          "gold": 10,
          "reputation": 10,
          "alignment_shift": {
            "justice": 10,
            "order": 10
          }
        }
      },
      "choices": []
    }
  }
}'::jsonb 
WHERE id = 7008;
