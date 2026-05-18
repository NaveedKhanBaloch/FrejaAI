from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import analytics, auth, calls, demo_voice, menu, orders, restaurants, vonage
from app.utils.logger import configure_logging

configure_logging()
settings = get_settings()

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.dashboard_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vonage.router)
app.include_router(demo_voice.router)
app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(calls.router)
app.include_router(menu.router)
app.include_router(restaurants.router)
app.include_router(analytics.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
