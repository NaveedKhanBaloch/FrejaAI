import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.engine import make_url

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routers import analytics, auth, calls, dashboard, demo_voice, elevenlabs_agent, menu, orders, restaurants, vonage
from app.services.restaurant_seed import ensure_demo_restaurant
from app.utils.logger import configure_logging, get_logger

configure_logging()
settings = get_settings()
logger = get_logger(__name__)

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
app.include_router(elevenlabs_agent.router)
app.include_router(dashboard.router)
app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(calls.router)
app.include_router(menu.router)
app.include_router(restaurants.router)
app.include_router(analytics.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
async def seed_demo_data() -> None:
    safe_database_url = make_url(settings.database_url).render_as_string(hide_password=True)
    last_error: Exception | None = None
    for attempt in range(1, 11):
        try:
            async with engine.begin() as connection:
                await connection.run_sync(Base.metadata.create_all)
            async with SessionLocal() as session:
                await ensure_demo_restaurant(session)
            return
        except Exception as exc:
            last_error = exc
            logger.warning("database_startup_waiting", attempt=attempt, database_url=safe_database_url, error=str(exc))
            await asyncio.sleep(1.5)
    logger.error("database_startup_failed", database_url=safe_database_url, error=str(last_error))
    raise RuntimeError(
        f"Could not connect to PostgreSQL at {safe_database_url}. "
        "Start Postgres with `docker compose up -d postgres redis` or check that Docker Desktop is running."
    ) from last_error
