# Production Deployment, Cloud Infrastructure & Multi-Project Shared Services

This document details the CI/CD pipeline, Docker Hub publishing, S3 web hosting, cloud-based persistence (PostgreSQL/TimescaleDB, Redis, MongoDB), EC2 provisioning, and the shared Kafka container architecture.

---

## 1. High-Level Production Architecture

```
                          Users / Browsers
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
                ▼ (Static Assets)                 ▼ (/api and /ws)
       ┌──────────────────┐              ┌──────────────────┐
       │   AWS S3 Bucket  │              │   AWS EC2 Host   │
       │ (React/Vite SPA) │              │  (Public IP/DNS) │
       │  perp-web dist   │              └────────┬─────────┘
       └──────────────────┘                       │
                                                  │ Ports 80 & 7070
                                                  ▼
                                       ┌───────────────────────┐
                                       │   perp-api-gateway    │
                                       └──────────┬────────────┘
                                                  │
                      ┌───────────────────────────┼───────────────────────────┐
                      ▼                           ▼                           ▼
              ┌───────────────┐           ┌───────────────┐           ┌───────────────┐
              │  perp-server  │           │    perp-ws    │           │perp-db-writer │
              │ (REST+Engine) │           │ (Redis pubsub)│           │ (persistence) │
              └───────┬───────┘           └───────┬───────┘           └───────┬───────┘
                      │                           │                           │
                      └───────────────────────────┼───────────────────────────┘
                                                  │
                      ============================│============================
                                Docker Network: "shared-services"
                      ============================│============================
                                     │            │
                                     ▼            ▼
                           ┌───────────────────┐ ┌─────────────────────────────┐
                           │   SHARED KAFKA    │ │   MANAGED CLOUD DATABASES   │
                           │(KRaft 9092/29092) │ │                             │
                           │   reusable across │ │ 🐘 Cloud PostgreSQL         │
                           │ multiple projects │ │ 🔴 Cloud Redis (TLS)        │
                           └───────────────────┘ │ 🍃 Cloud MongoDB Atlas      │
                                                 └─────────────────────────────┘
```

---

## 2. Automated CI/CD Workflow (`.github/workflows/deploy.yml`)

The repository includes a four-stage GitHub Actions pipeline:

1. **Verify (CI Gate):**
   - Environment: `ubuntu-latest` with Bun `1.4.2`.
   - Executes `bun x turbo run lint check-types build` with 0 warnings.
   - Executes all engine invariant, solvency, and recovery test suites.
2. **Deploy Web to S3 (`deploy-web-s3`):**
   - Builds Vite frontend with production endpoints (`VITE_API_URL`, `VITE_WS_URL`).
   - Syncs static assets from `apps/web/dist` to S3 via `aws s3 sync`.
   - (Optional) Invalidates CloudFront edge cache.
3. **Build & Push to Docker Hub (`build-and-push-docker`):**
   - Uses Buildx matrix across 5 runners in parallel.
   - Builds Dockerfiles in `infrastructure/docker/` for all backend services.
   - Pushes tags `:latest` and `:${{ github.sha }}` to Docker Hub with GitHub Actions caching (`type=gha`).
4. **Deploy Backend to EC2 (`deploy-ec2`):**
   - Connects to EC2 via SSH.
   - Writes production `.env` with cloud database connection strings.
   - Pulls fresh images from Docker Hub (`docker compose pull`).
   - Launches containers (`docker compose up -d --remove-orphans`).
   - Prunes stale image layers.

---

## 3. Required GitHub Secrets

Configure these in **GitHub Settings > Secrets and variables > Actions**:

| Secret Name | Description | Example |
|---|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username | `myuser` |
| `DOCKERHUB_TOKEN` | Docker Hub Personal Access Token (PAT) | `dckr_pat_...` |
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key for S3 sync | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key | `wJalrX...` |
| `AWS_REGION` | AWS region of your S3 bucket | `us-east-1` |
| `S3_BUCKET_NAME` | Destination S3 Bucket | `perp-trading-web` |
| `PROD_API_URL` | Public API endpoint | `http://<EC2-IP>` |
| `PROD_WS_URL` | Public WebSocket endpoint | `ws://<EC2-IP>:7070` |
| `EC2_HOST` | EC2 Elastic IP / Public DNS | `54.210.xx.xx` |
| `EC2_USER` | EC2 SSH username | `ubuntu` |
| `EC2_SSH_KEY` | Private SSH Key (`.pem`) | `-----BEGIN RSA PRIVATE KEY-----...` |
| `JWT_SECRET` | 32+ character signing secret | `openssl rand -hex 32` |
| `DATABASE_URL` | Cloud PostgreSQL URL | `postgresql://user:pass@host:5432/perp_db?sslmode=require` |
| `REDIS_URL` | Cloud Redis TLS URL | `rediss://default:pass@host:6379` |
| `MONGODB_URI` | Cloud MongoDB Atlas URL | `mongodb+srv://user:pass@cluster.mongodb.net/perp?retryWrites=true&w=majority` |
| `CORS_ORIGINS` | Web S3 origin URL | `http://perp-trading-web.s3-website-us-east-1.amazonaws.com` |

---

## 4. Multi-Project Shared Kafka Architecture

To avoid running multiple heavy Kafka containers across different projects on the same EC2 instance:

1. **Docker Network**:
   A single user-defined bridge network `shared-services` is created on the host.
2. **Dedicated Shared Kafka Stack**:
   Managed via [`infrastructure/compose/docker-compose.shared-kafka.yml`](../infrastructure/compose/docker-compose.shared-kafka.yml) running `apache/kafka-native:3.9.0` in KRaft mode.
3. **Dual Listeners**:
   - `shared-kafka:9092` for containers inside the `shared-services` network.
   - `localhost:29092` for host processes.
4. **Multi-Tenancy Topic Namespacing**:
   - Project 1 (Perp): `perp.order.commands`, `perp.engine.events`
   - Project 2: `wallet.transfers`, `wallet.audit`

---

## 5. One-Click EC2 Host Setup

Run on a clean Ubuntu EC2 instance:
```bash
curl -fsSL https://raw.githubusercontent.com/<repo>/main/infrastructure/deploy/setup-ec2.sh | bash
```
This automatically:
- Installs Docker CE & Docker Compose plugin.
- Tunes Kafka kernel settings (`vm.max_map_count=262144`, `fs.file-max=2097152`).
- Configures UFW firewall rules for ports 22, 80, 443, and 7070.
- Creates the `shared-services` Docker network.
- Boots the shared Kafka broker in `/opt/shared-infra`.
- Creates `/opt/perp` with user permissions.
