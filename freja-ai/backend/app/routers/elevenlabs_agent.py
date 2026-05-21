from typing import Any

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import AliasChoices, BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.order_builder import MenuValidationError
from app.config import get_settings
from app.database import get_session
from app.services.elevenlabs_agent_service import ElevenLabsAgentService
from app.utils.logger import get_logger

router = APIRouter(prefix="/elevenlabs", tags=["elevenlabs-agent"])
logger = get_logger(__name__)


class SignedUrlResponse(BaseModel):
    signed_url: str | None = None
    conversation_token: str | None = None
    agent_id: str
    auth_mode: str
    prompt: str
    first_message: str
    voice_id: str
    restaurant_name: str


class ValidateItemRequest(BaseModel):
    item_name: str = Field(validation_alias=AliasChoices("item_name", "itemName"), min_length=1)
    quantity: int = Field(default=1, ge=1)
    modifiers: dict[str, Any] = Field(default_factory=dict)


class ConfirmOrderRequest(BaseModel):
    order: dict[str, Any]


def _verify_tool_secret(x_freja_tool_secret: str | None) -> None:
    expected = get_settings().elevenlabs_tool_secret
    if expected and x_freja_tool_secret != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid ElevenLabs tool secret")


@router.get("/signed-url", response_model=SignedUrlResponse)
async def get_signed_url(session: AsyncSession = Depends(get_session)) -> SignedUrlResponse:
    service = ElevenLabsAgentService()
    try:
        conversation_token = await service.get_conversation_token()
        return SignedUrlResponse(
            conversation_token=conversation_token,
            agent_id=service.agent_id(),
            auth_mode="conversation_token",
            prompt=await service.demo_prompt(session),
            first_message=f"Hej! Välkommen till {get_settings().demo_restaurant_name}. Vill du beställa för avhämtning eller leverans?",
            voice_id=get_settings().demo_elevenlabs_voice_id,
            restaurant_name=get_settings().demo_restaurant_name,
        )
    except httpx.HTTPStatusError as exc:
        logger.exception("elevenlabs_token_failed", status_code=exc.response.status_code, response=exc.response.text[:500])
    try:
        signed_url = await service.get_signed_url()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except httpx.HTTPStatusError as exc:
        response_text = exc.response.text[:500]
        logger.exception("elevenlabs_signed_url_failed", status_code=exc.response.status_code, response=response_text)
        if exc.response.status_code in {401, 403}:
            return SignedUrlResponse(
                signed_url=None,
                agent_id=service.agent_id(),
                auth_mode="public_agent_fallback",
                prompt=await service.demo_prompt(session),
                first_message=f"Hej! Välkommen till {get_settings().demo_restaurant_name}. Vill du beställa för avhämtning eller leverans?",
                voice_id=get_settings().demo_elevenlabs_voice_id,
                restaurant_name=get_settings().demo_restaurant_name,
            )
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"ElevenLabs rejected the signed URL request: {response_text}") from exc
    return SignedUrlResponse(
        signed_url=signed_url,
        agent_id=service.agent_id(),
        auth_mode="signed_url",
        prompt=await service.demo_prompt(session),
        first_message=f"Hej! Välkommen till {get_settings().demo_restaurant_name}. Vill du beställa för avhämtning eller leverans?",
        voice_id=get_settings().demo_elevenlabs_voice_id,
        restaurant_name=get_settings().demo_restaurant_name,
    )


@router.get("/tools/menu")
async def get_menu(x_freja_tool_secret: str | None = Header(default=None), session: AsyncSession = Depends(get_session)) -> dict[str, Any]:
    _verify_tool_secret(x_freja_tool_secret)
    return await ElevenLabsAgentService().get_menu(session)


@router.post("/tools/validate-item")
async def validate_item(payload: ValidateItemRequest, x_freja_tool_secret: str | None = Header(default=None), session: AsyncSession = Depends(get_session)) -> dict[str, Any]:
    _verify_tool_secret(x_freja_tool_secret)
    try:
        return await ElevenLabsAgentService().validate_item(session, payload.item_name, payload.quantity, payload.modifiers)
    except MenuValidationError as exc:
        return {"valid": False, "message": str(exc)}


@router.post("/tools/confirm-order")
async def confirm_order(payload: ConfirmOrderRequest, x_freja_tool_secret: str | None = Header(default=None), session: AsyncSession = Depends(get_session)) -> dict[str, Any]:
    _verify_tool_secret(x_freja_tool_secret)
    try:
        return await ElevenLabsAgentService().confirm_order(session, payload.order)
    except MenuValidationError as exc:
        return {"confirmed": False, "message": str(exc)}


@router.post("/tools/handoff")
async def handoff(x_freja_tool_secret: str | None = Header(default=None)) -> dict[str, str]:
    _verify_tool_secret(x_freja_tool_secret)
    return {"status": "handoff_requested", "message": "A staff handoff has been requested."}
