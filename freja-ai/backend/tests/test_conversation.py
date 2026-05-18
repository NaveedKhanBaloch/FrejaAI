import pytest

from app.ai.conversation_engine import ConversationEngine, ConversationStateName


@pytest.mark.asyncio
async def test_human_handoff_from_any_state() -> None:
    engine = ConversationEngine()
    await engine.start()

    result = await engine.handle_input("I want a human please")

    assert result.next_state == ConversationStateName.HUMAN_HANDOFF
    assert result.action == "transfer_to_human"


@pytest.mark.asyncio
async def test_failed_understanding_after_three_attempts_hands_off() -> None:
    engine = ConversationEngine()
    await engine.start()
    await engine.handle_input("hello")
    await engine.handle_input("hello")

    await engine.handle_input("maybe")
    await engine.handle_input("unclear")
    result = await engine.handle_input("still unclear")

    assert result.next_state == ConversationStateName.HUMAN_HANDOFF
    assert result.action == "transfer_to_human"


@pytest.mark.asyncio
async def test_pickup_flow_reaches_confirmation() -> None:
    engine = ConversationEngine()
    await engine.start()

    await engine.handle_input("hello")
    await engine.handle_input("english")
    result = await engine.handle_input("pickup")

    assert result.next_state == ConversationStateName.MENU_SELECTION
    assert engine.context.order_type == "pickup"
