from typing import Any

import httpx

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class AutomationService:
    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._settings = get_settings()
        self._client = client

    async def trigger(self, event: str, payload: dict[str, Any]) -> None:
        if self._settings.n8n_webhook_url is None:
            return
        body = {"event": event, "payload": payload}
        if self._client is not None:
            response = await self._client.post(str(self._settings.n8n_webhook_url), json=body, timeout=5)
            response.raise_for_status()
            return
        async with httpx.AsyncClient(timeout=5) as client:
            try:
                response = await client.post(str(self._settings.n8n_webhook_url), json=body)
                response.raise_for_status()
            except httpx.HTTPError as exc:
                logger.exception("n8n_webhook_failed", event=event, error=str(exc))
                raise
