import json
from typing import Any

import redis.asyncio as redis

from app.config import get_settings


class CallSessionStore:
    def __init__(self, client: redis.Redis | None = None) -> None:
        self._settings = get_settings()
        self._redis = client or redis.from_url(str(self._settings.redis_url), decode_responses=True)

    def _key(self, call_uuid: str) -> str:
        return f"call_session:{call_uuid}"

    async def get(self, call_uuid: str) -> dict[str, Any]:
        raw = await self._redis.get(self._key(call_uuid))
        if raw is None:
            return {}
        data = json.loads(raw)
        if not isinstance(data, dict):
            return {}
        return data

    async def set(self, call_uuid: str, data: dict[str, Any]) -> None:
        await self._redis.set(self._key(call_uuid), json.dumps(data), ex=self._settings.session_ttl_seconds)

    async def update(self, call_uuid: str, **values: Any) -> dict[str, Any]:
        data = await self.get(call_uuid)
        data.update(values)
        await self.set(call_uuid, data)
        return data

    async def append_history(self, call_uuid: str, role: str, content: str, max_turns: int = 20) -> None:
        data = await self.get(call_uuid)
        history = list(data.get("history", []))
        history.append({"role": role, "content": content})
        data["history"] = history[-max_turns:]
        await self.set(call_uuid, data)

    async def close(self) -> None:
        await self._redis.aclose()
