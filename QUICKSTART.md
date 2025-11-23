# ⚡ QUICKSTART - Get Running in 2 Minutes

## Step 1: Configure (30 seconds)

```bash
# Copy environment template
cp .env.example .env

# Edit ONLY these 3 values in .env:
# 1. ZAI_API_KEY=your_actual_zai_key_here
# 2. POSTGRES_PASSWORD=make_this_secure_min_16_chars
# 3. JWT_SECRET=generate_random_32_chars
```

## Step 2: Deploy (1 minute)

```bash
./deploy.sh deploy
```

## Step 3: Verify (30 seconds)

Open your browser:
- **http://localhost** - API Gateway (should see "OK")
- **http://localhost:3005** - AutoView UI

Check all services:
```bash
./deploy.sh health
```

---

## ✅ You're Done!

The complete system is running:
- ✅ Backend API on port 3000
- ✅ AutoBE AI Agent on port 3001
- ✅ Agentica Framework on port 3002
- ✅ Vector Store on port 3003
- ✅ Connectors on port 3004
- ✅ AutoView UI on port 3005
- ✅ PostgreSQL on port 5432
- ✅ Redis on port 6379
- ✅ ChromaDB on port 8000
- ✅ Nginx Gateway on port 80

---

## 🎯 Quick Test

Test AI code generation:
```bash
curl -X POST http://localhost/autobe/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a TypeScript function that validates email addresses"}'
```

---

## 🛑 Stop the System

```bash
./deploy.sh stop
```

---

## 📖 Need More Info?

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete documentation.

---

## 🐛 Something Not Working?

### Quick Fixes:

**"Docker not running"**
```bash
# Start Docker Desktop (Mac/Windows)
# OR
sudo systemctl start docker  # Linux
```

**"Port 80 already in use"**
```bash
# Edit docker-compose.yml
# Change nginx ports: "8080:80" instead of "80:80"
# Then access via http://localhost:8080
```

**"AutoBE 500 error"**
```bash
# Check your ZAI_API_KEY is correct
grep ZAI_API_KEY .env

# View logs
./deploy.sh logs autobe
```

**"Database connection failed"**
```bash
# Check POSTGRES_PASSWORD matches in .env
# Restart database
docker-compose restart postgres
```

---

## 📞 Get Help

- **Discord:** https://discord.gg/aMhRmzkqCx
- **GitHub Issues:** https://github.com/wrtnlabs/autobe/issues
- **Docs:** https://autobe.dev/docs/

