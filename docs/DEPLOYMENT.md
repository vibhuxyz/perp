# Production Deployment & EC2 Infrastructure

This document details the CI/CD pipeline, Docker container architecture, EC2 provisioning, and resolution of critical production Docker deployment bugs.

---

## 1. Automated CI/CD Workflow (`.github/workflows/deploy.yml`)

The repository includes a GitHub Actions pipeline with two stages:

1. **Verify (CI Gate):**
   - Environment: `ubuntu-latest` with Bun `1.4.2`.
   - Executes `bun x turbo run lint check-types build` with 0 warnings.
   - Executes all 17 engine test suites (invariants, solvency, crash recovery, fencing).
2. **Deploy (EC2 Continuous Deployment):**
   - Triggers automatically on push to `main` branch or manual `workflow_dispatch`.
   - Secure SSH connection using `secrets.EC2_SSH_KEY`, `secrets.EC2_HOST`, and `secrets.EC2_USER`.
   - Pulls latest commit to `/opt/perp`, writes production `.env`, runs `docker compose build`, performs rolling container recreation, and verifies service health.

### Required GitHub Secrets
- `EC2_SSH_KEY`: Private SSH key authorized in `~/.ssh/authorized_keys` on the EC2 host.
- `EC2_HOST`: Elastic IP or public DNS of the EC2 instance.
- `EC2_USER`: Default SSH username (`ubuntu` for Ubuntu, `ec2-user` for AL2023).
- `JWT_SECRET`: 32+ character production secret for session signing.

---

## 2. Production Docker Stack (7 Services)

Configured in `infrastructure/compose/docker-compose.prod.yml`:
- `web`: Nginx serving production Vite build, reverse-proxying `/api` and `/ws` on port 80.
- `api-gateway`: Express edge proxy enforcing rate limiting, correlation IDs, and WebSocket tunneling on port 8080.
- `server`: REST API for orders, accounts, and market status on port 3000.
- `engine`: Core single-writer matching engine with WAL persistence on `/data/engine.wal`.
- `db-writer`: TimescaleDB batch consumer consuming `engine.events` from Kafka.
- `ws`: Real-time WebSocket broadcasting orderbook depth, trades, and liquidation feeds on port 7070.
- `mark-price-poller`: Continuous external oracle poller calculating index prices and funding rates.
- `kafka`: Apache Kafka native broker in KRaft mode (zero ZooKeeper dependency).
- `redis`: Redis 7 alpine in-memory caching.
- `timescaledb`: TimescaleDB 2.30 PostgreSQL 16 hypertable database.

---

## 3. Docker & EC2 Deployment Bugs Resolved

### Bug 1: Nginx SPA Reverse Proxy Blindness (Port 80)
- **Problem:** `nginx.conf` previously used a blind `try_files $uri $uri/ /index.html` fallback. Any browser HTTP request to `/api/*` or `/ws` returned the HTML single-page app (`<!DOCTYPE html>...`) instead of routing to the API gateway.
- **Fix:** Added reverse proxy blocks in `infrastructure/docker/nginx.conf` forwarding `/api/` to `http://api-gateway:8080/` and `/ws` to `http://api-gateway:8080/ws` with `Upgrade` and `Connection "Upgrade"` headers.

### Bug 2: Hardcoded Localhost Client Endpoints on Remote EC2
- **Problem:** Frontend client configuration hardcoded `http://localhost:8080`. When users loaded the app from an external IP or domain on EC2, their browser tried to connect to port 8080 on their own local machine.
- **Fix:** Updated `apps/web/src/app/config.ts` to dynamically resolve endpoints relative to `window.location.origin/api` and `ws://${window.location.host}/ws` when loaded on remote hosts.

### Bug 3: Database Cold-Start Schema Race on Clean Instances
- **Problem:** On initial deployment on a clean EC2 host, the TimescaleDB container initialized only with the extension, leaving relational tables (`users`, `orders`, `positions`, `collateral`) absent and causing immediate server crash.
- **Fix:** Created `infrastructure/compose/init-schema.sql` and mounted it into `/docker-entrypoint-initdb.d/002-schema.sql:ro` so tables are automatically created on first boot.

### Bug 4: Docker Daemon Permissions on EC2 Host
- **Problem:** SSH commands executed by the deployment user fail with `permission denied while trying to connect to the Docker daemon socket`.
- **Fix:** Added `sudo usermod -aG docker $USER` to both `infrastructure/deploy/setup-ec2.sh` and the GitHub Actions workflow.

### Bug 5: Kafka KRaft Memory Map & File Descriptor Exhaustion
- **Problem:** Linux default `vm.max_map_count` (65530) causes Kafka JVM crashes under sustained loads.
- **Fix:** Automated `vm.max_map_count=262144` and `fs.file-max=2097152` in `infrastructure/deploy/setup-ec2.sh`.

---

## 4. One-Click EC2 Provisioning

Run on a fresh EC2 instance:
```bash
curl -fsSL https://raw.githubusercontent.com/<repo>/main/infrastructure/deploy/setup-ec2.sh | bash
```
This installs Docker, Docker Compose, sets kernel parameters, configures UFW firewall rules, and creates `/opt/perp`.
