import json
from types import SimpleNamespace
from typing import Any

import pytest

from app.ai.voice_agent_graph import VoiceAgentGraph


class FakeCompletions:
    async def create(self, **_: Any) -> Any:
        content = json.dumps(
            {
                "assistant_text": "Pickup is noted. Would you like a medium Kebabpizza?",
                "order_complete": False,
                "call_ended": False,
                "order": {"items": [], "order_type": "pickup", "delivery_address": None, "total_amount": 0},
            }
        )
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])


class FakeClient:
    def __init__(self) -> None:
        self.chat = SimpleNamespace(completions=FakeCompletions())


@pytest.mark.asyncio
async def test_voice_agent_graph_locks_language_and_updates_order_state() -> None:
    graph = VoiceAgentGraph(FakeClient())  # type: ignore[arg-type]

    state = await graph.run_turn(
        {
            "transcript": "mujhe kebab pizza chahiye",
            "stt_language": None,
            "stt_confidence": 0.0,
            "restaurant_name": "Pizza Palazzo",
            "menu": [],
            "language": "sv",
            "language_locked": False,
            "language_candidates": ["ur"],
            "history": [],
            "order_state": {},
        }
    )

    assert state["language"] == "ur"
    assert state["language_locked"] is True
    assert state["assistant_text"] == "Pickup is noted. Would you like a medium Kebabpizza?"
    assert state["order_state"]["order_type"] == "pickup"
