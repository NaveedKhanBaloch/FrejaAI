import hmac
from hashlib import sha256
from urllib.parse import urlencode

from fastapi import HTTPException, Request, status

from app.config import get_settings


async def verify_vonage_signature(request: Request) -> None:
    signature = request.query_params.get("sig") or request.headers.get("x-vonage-signature")
    if not signature:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Vonage signature")
    params = {key: value for key, value in request.query_params.items() if key != "sig"}
    body = await request.body()
    message = urlencode(sorted(params.items())).encode("utf-8") + body
    expected = hmac.new(get_settings().vonage_api_secret.encode("utf-8"), message, sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Vonage signature")
