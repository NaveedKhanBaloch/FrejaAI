from typing import Any

import pytest

from app.services.language_detection import LanguageDetectionService, detect_supported_language, fallback_language


class MemorySessionStore:
    def __init__(self) -> None:
        self.data: dict[str, dict[str, Any]] = {}

    async def get(self, call_uuid: str) -> dict[str, Any]:
        return self.data.get(call_uuid, {})

    async def update(self, call_uuid: str, **values: Any) -> dict[str, Any]:
        current = dict(self.data.get(call_uuid, {}))
        current.update(values)
        self.data[call_uuid] = current
        return current


def test_urdu_script_fallback_is_supported() -> None:
    assert fallback_language("مجھے ایک کباب پیزا چاہیے") == "ur"


def test_roman_urdu_fallback_is_supported() -> None:
    assert fallback_language("mujhe ek kebab pizza chahiye") == "ur"


def test_stt_language_normalizes_urdu_region_code() -> None:
    assert detect_supported_language("pizza", "ur-PK", 0.91, 0.70) == "ur"


@pytest.mark.asyncio
async def test_language_locks_after_two_turns() -> None:
    store = MemorySessionStore()
    service = LanguageDetectionService(store)  # type: ignore[arg-type]

    first = await service.detect("call-1", "mujhe pizza chahiye", None, 0.0)
    second = await service.detect("call-1", "delivery kar dena", None, 0.0)
    third = await service.detect("call-1", "hello this is english", "en-US", 0.99)

    assert first == "ur"
    assert second == "ur"
    assert third == "ur"
    assert store.data["call-1"]["language_locked"] == "ur"
