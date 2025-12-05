# 🚀 WrtnLabs Unified Deployment System

**Production-Ready Deployment for Complete AI-Powered Development Stack**

AutoBE + Backend + AutoView + Agentica + Vector Store + Connectors - All in One

---

## ⚡ TL;DR - Deploy Now

```bash
cp .env.example .env    # Configure (edit ZAI_API_KEY)
./deploy.sh deploy      # Deploy everything
open http://localhost   # Done!
```

**See [QUICKSTART.md](./QUICKSTART.md) for 2-minute setup guide.**

---

## 📦 What You Get

This deployment package includes **6 production services**:

| Service | Description | Technology |
|---------|-------------|------------|
| **Backend** | Core API server with PostgreSQL | NestJS + TypeScript |
| **AutoBE** | AI coding agent (Z.ai GLM-4.6) | TypeScript + AI |
| **Agentica** | AI function calling framework | TypeScript |
| **Vector Store** | Semantic search engine | Node.js + ChromaDB |
| **Connectors** | GitHub, Slack integrations | Node.js |
| **AutoView** | Dynamic UI renderer | React + TypeScript |

**Plus infrastructure:**
- ✅ PostgreSQL 15 database
- ✅ Redis cache
- ✅ ChromaDB vector store
- ✅ Nginx API gateway
- ✅ Docker orchestration
- ✅ Health monitoring
- ✅ Automated deployment

---

## 🎯 Use Cases

This system enables:

1. **AI-Powered Code Generation** - AutoBE generates production-ready code from natural language
2. **Semantic Code Search** - Vector Store finds code by meaning, not just keywords
3. **Dynamic UI Generation** - AutoView renders components on-the-fly
4. **External Integrations** - Connectors sync with GitHub, Slack, etc.
5. **Complete Backend API** - Full CRUD, auth, and business logic

---

## 📋 Quick Links

- **[QUICKSTART.md](./QUICKSTART.md)** - Get running in 2 minutes
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[.env.example](./.env.example)** - Environment configuration template
- **[docker-compose.yml](./docker-compose.yml)** - Service orchestration
- **[deploy.sh](./deploy.sh)** - Deployment automation script

---

## 🛠️ Prerequisites

- **Docker** 20.10+ with Docker Compose 2.0+
- **2GB RAM minimum** (4GB recommended)
- **10GB disk space**
- **Z.ai API Key** (for AI features)

That's it! No Node.js, Python, or other dependencies needed on your host machine.

---

## 🚀 Deployment Steps

### 1. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set these **3 critical values**:

```bash
ZAI_API_KEY=your_zai_api_key_here
POSTGRES_PASSWORD=secure_password_min_16_chars
JWT_SECRET=random_string_min_32_chars
```

### 2. Deploy System

```bash
./deploy.sh deploy
```

This command:
1. ✅ Checks Docker is running
2. ✅ Validates configuration
3. ✅ Pulls images
4. ✅ Builds services
5. ✅ Starts everything in correct order
6. ✅ Runs health checks
7. ✅ Reports status

### 3. Verify Deployment

```bash
./deploy.sh health
```

Or visit: **http://localhost/health**

---

## 🌐 Access Points

After deployment, access services at:

| Service | URL | Purpose |
|---------|-----|---------|
| **API Gateway** | http://localhost | Main entry point |
| **Backend API** | http://localhost/api | Core API endpoints |
| **AutoBE** | http://localhost/autobe | AI code generation |
| **AutoView UI** | http://localhost:3005 | Web interface |
| **API Docs** | http://localhost/api/docs | Swagger documentation |

---

## 📊 System Architecture

```
                    ┌─────────────┐
                    │   Browser   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Nginx    │ Port 80
                    │ API Gateway │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼─────┐     ┌────▼──────┐    ┌────▼──────┐
    │ Backend  │     │  AutoBE   │    │ AutoView  │
    │  :3000   │     │   :3001   │    │   :3005   │
    └────┬─────┘     └────┬──────┘    └───────────┘
         │                │
    ┌────▼──────┐    ┌────▼───────┐   ┌─────────────┐
    │PostgreSQL │    │  ChromaDB  │   │    Redis    │
    │   :5432   │    │   :8000    │   │    :6379    │
    └───────────┘    └────────────┘   └─────────────┘
```

---

## 🎮 Common Commands

```bash
# Deploy system
./deploy.sh deploy

# Check status
./deploy.sh status

# View logs
./deploy.sh logs backend

# Health check
./deploy.sh health

# Restart service
./deploy.sh restart autobe

# Stop system
./deploy.sh stop
```

---

## 🧪 Testing the Deployment

### Test API

```bash
curl http://localhost/health
# Expected: OK

curl http://localhost/api/health
# Expected: {"status":"ok"}
```

### Test AutoBE AI Generation

```bash
curl -X POST http://localhost/autobe/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a TypeScript function to validate email",
    "model": "glm-4.6"
  }'
```

### Test Vector Search

```bash
curl -X POST http://localhost/vector/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "authentication functions",
    "limit": 5
  }'
```

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs
./deploy.sh logs <service-name>

# Check Docker status
docker ps

# Restart service
./deploy.sh restart <service-name>
```

### Port Conflicts

Edit `docker-compose.yml` and change port mappings:

```yaml
nginx:
  ports:
    - "8080:80"  # Changed from 80:80
```

### Database Issues

```bash
# Check PostgreSQL logs
docker logs wrtnlabs-postgres

# Connect to database
docker exec -it wrtnlabs-postgres psql -U wrtnlabs_user -d wrtnlabs

# Reset database
docker-compose down -v
./deploy.sh deploy
```

### AI Features Not Working

```bash
# Verify ZAI_API_KEY is set
grep ZAI_API_KEY .env

# Check AutoBE logs
docker logs wrtnlabs-autobe

# Test Z.ai API directly
curl https://api.z.ai/v1/models \
  -H "Authorization: Bearer $ZAI_API_KEY"
```

---

## 🔒 Production Deployment

### Security Checklist

- [ ] Change all default passwords
- [ ] Generate new JWT_SECRET and SESSION_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Restrict database access (localhost only)
- [ ] Enable firewall
- [ ] Set up monitoring
- [ ] Configure automated backups
- [ ] Review CORS settings
- [ ] Enable rate limiting
- [ ] Remove default admin user

### Performance Optimization

- [ ] Scale backend replicas
- [ ] Enable Redis caching
- [ ] Configure CDN for static assets
- [ ] Set up load balancer
- [ ] Optimize database indexes
- [ ] Enable query caching
- [ ] Configure connection pooling

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed production guide.

---

## 📈 Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Resource Usage

```bash
docker stats
```

### Health Dashboard

```bash
./deploy.sh health
```

---

## 🔄 Updates & Maintenance

### Update Services

```bash
# Pull latest images
docker-compose pull

# Rebuild
docker-compose build --no-cache

# Restart
docker-compose up -d
```

### Backup Data

```bash
# Backup database
docker exec wrtnlabs-postgres pg_dump -U wrtnlabs_user wrtnlabs > backup.sql

# Backup volumes
docker run --rm -v wrtnlabs_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data
```

### Restore Data

```bash
# Restore database
cat backup.sql | docker exec -i wrtnlabs-postgres psql -U wrtnlabs_user -d wrtnlabs
```

---

## 📚 Documentation

- **Architecture:** [ARCHITECTURE.md](.ai/ARCHITECTURE.md)
- **API Reference:** http://localhost/api/docs (after deployment)
- **Agent System:** [AGENTICA_INTEGRATION.md](.ai/AGENTICA_INTEGRATION.md)
- **Development:** [DEVELOPMENT_GUIDE.md](.ai/DEVELOPMENT_GUIDE.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

---

## 📄 License

AGPL 3.0 - See [LICENSE](./LICENSE) for details

---

## 📞 Support

- **Discord:** https://discord.gg/aMhRmzkqCx
- **GitHub Issues:** https://github.com/wrtnlabs/autobe/issues
- **Documentation:** https://autobe.dev/docs/
- **Email:** support@wrtnlabs.com

---

## 🎉 What's Next?

After successful deployment:

1. **Explore AutoView UI** - http://localhost:3005
2. **Test AI Code Generation** - Try AutoBE endpoints
3. **Read API Documentation** - http://localhost/api/docs
4. **Configure Integrations** - Set up GitHub, Slack connectors
5. **Scale Services** - Add replicas for production load
6. **Set Up Monitoring** - Configure Prometheus/Grafana
7. **Enable SSL** - Add HTTPS certificates
8. **Backup Strategy** - Automate database backups

---

**🚀 Ready to build something amazing? Let's go!**

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-23  
**Maintained by:** WrtnLabs Team

