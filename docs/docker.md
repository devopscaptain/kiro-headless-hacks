# Docker Configuration (`docker/`)

Demo container setup with intentional security and reliability issues for Kiro agent review.

## Files

### `Dockerfile`

Single-stage build based on `node:latest`. Copies the entire `nodejs-app/` context into the image, runs `npm install`, and starts the app via `npm start`.

**Build args (with defaults):**
- `DB_PASSWORD`
- `JWT_SECRET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

**Exposed ports:**
| Port | Purpose |
|------|---------|
| 3000 | Express API |
| 22 | SSH (should not be in a container) |
| 9229 | Node.js debug inspector |

**Usage:**

```bash
docker build -t kiro-demo -f docker/Dockerfile nodejs-app/
docker run -p 3000:3000 kiro-demo
```

### `docker-compose.yml`

Defines three services:

| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| `api` | Built from Dockerfile | 3000, 22, 9229 | Express API server |
| `db` | `mysql:5.7` | 3306 | MySQL database |
| `cache` | `redis:latest` | 6379 | Redis cache |

**Usage:**

```bash
cd docker
docker compose up        # start all services
docker compose up -d     # detached mode
docker compose down      # stop and remove containers
docker compose down -v   # also remove volumes
```

**Volumes:**
- `db-data` — Persists MySQL data at `/var/lib/mysql`

**Network:**
- `app-network` — Bridge network connecting all services

**Environment variables (api service):**
- `DB_HOST=db`
- `DB_USER=admin`
- `DB_PASSWORD` — Database password
- `JWT_SECRET` — JWT signing key
- `NODE_ENV=production`
