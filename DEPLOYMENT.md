# 🚀 WrtnLabs Complete Deployment Guide

**Complete production-ready deployment for AutoBE + All Services**

## ⚡ Quick Start (3 Steps)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your settings (especially ZAI_API_KEY)

# 2. Deploy everything
./deploy.sh deploy

# 3. Access the system
open http://localhost        # API Gateway
open http://localhost:3005   # AutoView UI
```

**That's it!** The complete stack is running.

---

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx (Port 80)                      │
│                     API Gateway                         │
└────────┬────────────────────────────────────────────────┘
         │
    ┌────┴────┬────────────┬─────────────┬──────────────┐
    │         │            │             │              │
┌───▼────┐ ┌──▼──────┐ ┌──▼────────┐ ┌──▼─────────┐ ┌──▼──────┐
│Backend │ │ AutoBE  │ │ Agentica  │ │Vector Store│ │Connectors│
│:3000   │ │ :3001   │ │  :3002    │ │   :3003    │ │  :3004   │
└────┬───┘ └──┬──────┘ └──┬────────┘ └──┬─────────┘ └──┬───────┘
     │        │            │             │              │
     └────────┴────────────┴─────────────┴──────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         ┌────▼─────┐            ┌─────▼──────┐
         │PostgreSQL│            │  ChromaDB  │
         │  :5432   │            │   :8000    │
         └──────────┘            └────────────┘
              │
         ┌────▼─────┐            ┌─────────────┐
         │  Redis   │            │  AutoView   │
         │  :6379   │            │    :3005    │
         └──────────┘            └─────────────┘
```

## 📦 Services Overview

| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| **Nginx** | 80 | API Gateway & Load Balancer | `http://localhost/health` |
| **Backend** | 3000 | Core API Server (NestJS) | `http://localhost:3000/health` |
| **AutoBE** | 3001 | AI Coding Agent (Z.ai GLM-4.6) | `http://localhost:3001/health` |
| **Agentica** | 3002 | AI Function Framework | `http://localhost:3002/health` |
| **Vector Store** | 3003 | Semantic Search Engine | `http://localhost:3003/health` |
| **Connectors** | 3004 | External Integrations | `http://localhost:3004/health` |
| **AutoView** | 3005 | UI Renderer (React) | `http://localhost:3005/health` |
| **PostgreSQL** | 5432 | Primary Database | `pg_isready` |
| **Redis** | 6379 | Cache & Session Store | `redis-cli ping` |
| **ChromaDB** | 8000 | Vector Database | `http://localhost:8000/api/v1/heartbeat` |

---

## 🛠️ Prerequisites

### Required
- **Docker** 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.0+ (included with Docker Desktop)
- **2GB RAM minimum** (4GB recommended)
- **10GB disk space**

### Recommended
- **Node.js** 18+ (for local development)
- **pnpm** 8+ (for dependency management)
- **Git** (for version control)

### Check Prerequisites
```bash
docker --version          # Should show 20.10+
docker-compose --version  # Should show 2.0+
docker ps                 # Should connect without errors
```

---

## 📝 Configuration

### 1. Create .env File
```bash
cp .env.example .env
```

### 2. Required Configuration

Edit `.env` and set these **CRITICAL** values:

```bash
# Z.ai API Key (REQUIRED for AI features)
ZAI_API_KEY=your_actual_zai_api_key_here

# Database Password (SECURITY CRITICAL)
POSTGRES_PASSWORD=your_secure_password_min_16_chars

# JWT Secret (SECURITY CRITICAL)
JWT_SECRET=generate_random_string_min_32_chars

# Session Secret (SECURITY CRITICAL)
SESSION_SECRET=another_random_string_min_32_chars
```

### 3. Optional Configuration

```bash
# External Integrations (if needed)
GITHUB_TOKEN=ghp_your_github_token
SLACK_BOT_TOKEN=xoxb_your_slack_token

# Customize ports (if defaults conflict)
BACKEND_PORT=3000
AUTOBE_PORT=3001
# ... etc
```

### Generate Secure Secrets
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate SESSION_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -base64 32
```

---

## 🚀 Deployment Commands

### Deploy Complete System
```bash
./deploy.sh deploy
```

**What happens:**
1. ✅ Checks Docker is running
2. ✅ Validates .env configuration
3. ✅ Pulls Docker images
4. ✅ Builds all services
5. ✅ Starts services in correct order
6. ✅ Waits for health checks
7. ✅ Reports service status

### View Logs
```bash
# All services
./deploy.sh logs

# Specific service
./deploy.sh logs backend
./deploy.sh logs autobe
./deploy.sh logs nginx
```

### Check Status
```bash
./deploy.sh status
```

### Health Check
```bash
./deploy.sh health
```

### Restart Services
```bash
# Restart all
./deploy.sh restart

# Restart specific service
./deploy.sh restart autobe
./deploy.sh restart backend
```

### Stop System
```bash
./deploy.sh stop
```

### Full Reset (Delete All Data)
```bash
docker-compose down -v
```

---

## 🔍 Verification

### 1. Check All Services Running
```bash
docker-compose ps
```

Expected output: All services show "Up (healthy)"

### 2. Test API Gateway
```bash
curl http://localhost/health
# Expected: OK

curl http://localhost/api/health
# Expected: {"status":"ok","service":"backend"}
```

### 3. Test AutoBE
```bash
curl -X POST http://localhost/autobe/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a hello world function"}'
```

### 4. Test AutoView UI
Open browser: `http://localhost:3005`

### 5. Check Database
```bash
docker exec -it wrtnlabs-postgres psql -U wrtnlabs_user -d wrtnlabs -c "\dt"
```

### 6. Check Vector Store
```bash
curl http://localhost:8000/api/v1/heartbeat
```

---

## 🐛 Troubleshooting

### Service Won't Start

**Check logs:**
```bash
./deploy.sh logs <service-name>
```

**Common issues:**
- Port already in use → Change ports in `.env`
- Missing environment variables → Check `.env` has all required values
- Database connection failed → Verify `POSTGRES_PASSWORD` matches in `.env`

### "Docker is not running"
```bash
# Start Docker Desktop (macOS/Windows)
# OR
sudo systemctl start docker  # Linux
```

### ".env file not found"
```bash
cp .env.example .env
# Then edit .env with your values
```

### "Cannot connect to PostgreSQL"
```bash
# Check PostgreSQL is healthy
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### "AutoBE returns 500 error"
```bash
# Check ZAI_API_KEY is set correctly in .env
grep ZAI_API_KEY .env

# Check AutoBE logs
docker-compose logs autobe

# Restart AutoBE
docker-compose restart autobe
```

### Port Conflicts
```bash
# Find what's using port 80
sudo lsof -i :80

# Change Nginx port in docker-compose.yml
# Change "80:80" to "8080:80" under nginx ports
```

---

## 📊 Monitoring

### Real-time Logs
```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f backend
```

### Resource Usage
```bash
docker stats
```

### Database Queries
```bash
# Connect to PostgreSQL
docker exec -it wrtnlabs-postgres psql -U wrtnlabs_user -d wrtnlabs

# View tables
\dt

# View table schema
\d+ users

# Exit
\q
```

### Redis Cache
```bash
# Connect to Redis
docker exec -it wrtnlabs-redis redis-cli

# View keys
KEYS *

# Get value
GET some_key

# Exit
exit
```

---

## 🔒 Security Considerations

### Production Deployment

1. **Change All Default Passwords**
```bash
# Generate new passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
```

2. **Enable HTTPS**
```bash
# Add SSL certificates to nginx configuration
# Update docker-compose.yml to mount certificates
# Change nginx ports from 80 to 443
```

3. **Restrict Database Access**
```bash
# In docker-compose.yml, remove postgres port exposure
# Or bind to localhost only: "127.0.0.1:5432:5432"
```

4. **Enable Firewall**
```bash
# Linux (ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Only expose Nginx, block direct service access
```

5. **Regular Updates**
```bash
# Pull latest images
docker-compose pull

# Rebuild services
docker-compose build --no-cache

# Restart
docker-compose up -d
```

---

## 🎯 API Routes

### Via API Gateway (Nginx)

| Route | Service | Description |
|-------|---------|-------------|
| `http://localhost/api/*` | Backend | Core API endpoints |
| `http://localhost/autobe/*` | AutoBE | AI coding agent |
| `http://localhost/agentica/*` | Agentica | Function calling |
| `http://localhost/vector/*` | Vector Store | Semantic search |
| `http://localhost/connectors/*` | Connectors | External integrations |
| `http://localhost/ws/*` | Backend | WebSocket connections |
| `http://localhost/*` | AutoView | Frontend UI |

### Direct Access (Development)

| Service | URL |
|---------|-----|
| Backend | `http://localhost:3000` |
| AutoBE | `http://localhost:3001` |
| Agentica | `http://localhost:3002` |
| Vector Store | `http://localhost:3003` |
| Connectors | `http://localhost:3004` |
| AutoView | `http://localhost:3005` |

---

## 🔄 Backup & Restore

### Backup Database
```bash
# Create backup
docker exec wrtnlabs-postgres pg_dump -U wrtnlabs_user wrtnlabs > backup_$(date +%Y%m%d).sql

# Or with Docker volume backup
docker run --rm -v wrtnlabs_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup_$(date +%Y%m%d).tar.gz /data
```

### Restore Database
```bash
# From SQL dump
cat backup_20250122.sql | docker exec -i wrtnlabs-postgres psql -U wrtnlabs_user -d wrtnlabs

# From volume backup
docker run --rm -v wrtnlabs_postgres_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_backup_20250122.tar.gz -C /
```

### Backup Vector Store
```bash
docker run --rm -v wrtnlabs_chromadb_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/chromadb_backup_$(date +%Y%m%d).tar.gz /data
```

---

## 📈 Scaling

### Horizontal Scaling (Multiple Instances)

**1. Backend Service:**
```yaml
# In docker-compose.yml
backend:
  deploy:
    replicas: 3
```

**2. Load Balancing:**
Nginx automatically balances across replicas

**3. Session Affinity:**
Use Redis for shared sessions (already configured)

### Vertical Scaling (More Resources)

```yaml
# In docker-compose.yml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G
```

---

## 🎓 Development Workflow

### Local Development
```bash
# Install dependencies
pnpm install

# Start development mode (with hot reload)
docker-compose -f docker-compose.dev.yml up
```

### Running Tests
```bash
# Run tests in specific service
docker-compose exec backend pnpm test
docker-compose exec autobe pnpm test
```

### Building for Production
```bash
# Build all services
docker-compose build --no-cache

# Build specific service
docker-compose build backend
```

---

## 📞 Support

- **Documentation:** https://autobe.dev/docs/
- **GitHub Issues:** https://github.com/wrtnlabs/autobe/issues
- **Discord:** https://discord.gg/aMhRmzkqCx

---

## 📄 License

AGPL 3.0 - See LICENSE file for details

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-23

