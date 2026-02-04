-- Update Slime Quest to include Battle Node
UPDATE scenarios 
SET flow_nodes = '[
  {
    "id": "start", 
    "text": "森の奥でスライムの群れを発見した。", 
    "choices": [
      {"label": "戦いを挑む", "next_node": "battle"}, 
      {"label": "見逃す", "next_node": "COMPLETED"}
    ]
  }
]'::jsonb 
WHERE title = 'スライム退治';
