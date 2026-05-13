const currentNode = {
  "text": "英霊の遺産が反応している——",
  "type": "check_item",
  "bg_key": "bg_memory_gawain",
  "params": {
    "items": [
      505,
      506,
      507
    ],
    "fail_node": "text_relics_missing",
    "success_node": "text_relics_glow"
  },
  "choices": []
};

// Simulate useScenarioNodeProcessor
const failNode = currentNode.params?.fail_node || currentNode.fallback || currentNode.choices?.[1]?.next;
console.log("failNode:", failNode);

// Let's assume failNode is evaluated correctly.
// Does ScenarioEngine handle failNode?
// Yes, setCurrentNodeId(failNode) -> "text_relics_missing"
// Does text_relics_missing render? Yes.
