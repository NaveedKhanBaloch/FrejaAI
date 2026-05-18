# Freja AI

Production-oriented monorepo for a multilingual AI voice ordering system for Nordic restaurants.

## Stack

- FastAPI, Python 3.12, async SQLAlchemy 2.x, PostgreSQL 16, Redis 7
- Vonage Voice WebSocket, Deepgram streaming STT, OpenAI `gpt-4o-mini`, ElevenLabs streaming TTS
- Next.js 14 App Router, TypeScript, Tailwind, TanStack Query, Zustand-ready client state, Recharts
- Docker Compose for local and production-style deployment

## Local Setup

1. Copy environment values:

```bash
cp .env.example .env
```

2. Fill vendor keys and JWT material in `.env`.

3. Start the stack:

```bash
docker compose up --build
```

4. Run migrations:

```bash
docker compose exec backend alembic upgrade head
```

5. Open the dashboard at `http://localhost:3000`.

## Backend Development

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
pytest
```

Core endpoints:

- `POST /vonage/answer`
- `POST /vonage/event`
- `WS /vonage/ws/{call_uuid}`
- `GET /orders`, `GET /orders/live`, `PATCH /orders/{id}/status`
- `GET /calls`, `GET /calls/{id}/transcript`, `GET /calls/{id}/recording`
- `GET /menu`, `POST /menu/item`, `PATCH /menu/item/{id}`, `DELETE /menu/item/{id}`
- `GET /analytics/summary`, `GET /analytics/calls`, `GET /analytics/orders`
- `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`

All non-Vonage REST endpoints require a bearer JWT. The authenticated user’s `restaurant_id` scopes all data access.

## Deployment

Railway:

1. Create PostgreSQL and Redis services.
2. Add the backend and frontend as separate services from this repo.
3. Set environment variables from `.env.example`.
4. Run `alembic upgrade head` as a backend release command.
5. Configure Vonage answer and event webhooks to `${BACKEND_URL}/vonage/answer` and `${BACKEND_URL}/vonage/event`.

Hetzner VPS:

1. Install Docker and Docker Compose.
2. Copy the repo and `.env`.
3. Run `docker compose -f docker-compose.prod.yml up -d --build`.
4. Put Caddy or Nginx in front of backend/frontend with TLS.
5. Point `BACKEND_URL`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_WS_URL` at the public domains.

## Notes

Money is stored as integer öre/cents. Vendor network calls live behind service classes so local tests cover deterministic conversation and order logic without external credentials.
