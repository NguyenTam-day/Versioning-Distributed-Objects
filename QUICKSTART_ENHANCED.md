# Distributed CAD Versioning System - Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
- **Java 21+**: [adoptopenjdk.net](https://adoptopenjdk.net/)
- **Maven 3.6+**: [maven.apache.org](https://maven.apache.org/)
- **Node.js 16+**: [nodejs.org](https://nodejs.org/)
- **MongoDB 5.0+**: [mongodb.com](https://www.mongodb.com/try/download/community)
- **Git**: [git-scm.com](https://git-scm.com/)

### Option A: Quick Setup (Windows PowerShell)

```powershell
# 1. Clone repository
git clone https://github.com/yourusername/distributed_cad_versioning.git
cd distributed_cad_versioning

# 2. Run setup
.\setup.bat

# Done! All services configured
```

### Option B: Docker Setup (Recommended)

```bash
# 1. Build and start all services
docker-compose up -d

# 2. Wait for services to start
docker-compose logs -f

# 3. Verify health
curl http://localhost:5000/api/health
curl http://localhost:5001/api/health
curl http://localhost:3000
```

### Option C: Manual Setup

```bash
# Terminal 1: MongoDB (or use installed MongoDB)
mongosh mongodb://localhost:27017
# Run mongo-init.js to create schema

# Terminal 2: Node A Backend
cd node_a
mvn spring-boot:run

# Terminal 3: Node B Backend
cd node_b
mvn spring-boot:run

# Terminal 4: Frontend
cd frontend
npm install
npm start
```

---

## 🎯 First 5 Minutes

### 1. Open Web Interface
Navigate to: **http://localhost:3000**

### 2. Select Node A
Click on the "Node A" tab at the top

### 3. Upload Your First Model
1. **Object ID**: `my-first-cube`
2. **File**: Select `sample-files/cube-v1.obj`
3. **Click**: Upload

✓ You'll see: "Version 1 created successfully"

### 4. Upload a Second Version
1. **Object ID**: `my-first-cube` (same ID)
2. **File**: Select `sample-files/cube-v2.obj`
3. **Click**: Upload

✓ You'll see: "Version 2 created successfully"

### 5. Compare Versions
1. **Tab**: History
2. **From Version**: Click "From" on v1
3. **To Version**: Click "To" on v2
4. **Click**: Compare Versions

✓ You'll see a detailed diff report:
- Vertices added: 2
- Vertices modified: 0
- Faces: unchanged

---

## 🔀 Understanding the System

### Architecture
```
┌─────────────────────────────────────────────────────────┐
│                      Web Browser                        │
│                    (React Frontend)                     │
│                  http://localhost:3000                  │
└──────────────┬──────────────────────────┬───────────────┘
               │                          │
         ┌─────▼────────┐          ┌─────▼────────┐
         │   Node A     │          │   Node B     │
         │  Spring Boot │          │  Spring Boot │
         │ :5000/api    │          │ :5001/api    │
         └──────┬───────┘          └──────┬───────┘
                │                         │
         ┌──────▼──┐              ┌──────▼──┐
         │MongoDB A│              │MongoDB B│
         │:27017   │              │:27018   │
         └─────────┘              └─────────┘
```

### Data Flow Example: "Push to Node B"
```
User Action: Push from Node A
     ↓
Frontend sends: POST /api/sync/push
     ↓
Node A:
  1. Finds deltas for new versions
  2. Compresses deltas (80%+ compression)
  3. Sends to Node B
     ↓
Node B:
  1. Receives compressed deltas
  2. Applies deltas to local geometry
  3. Verifies checksum
  4. Updates MongoDB
     ↓
Success: Both nodes now synchronized
```

---

## 📋 Common Tasks

### Upload a New Model
```bash
curl -X POST http://localhost:5000/api/geometry/upload \
  -F "objectId=my-model" \
  -F "file=@myfile.obj"
```

### View Version History
```bash
curl http://localhost:5000/api/version/my-model/history
```

### Compare Two Versions
```bash
curl -X POST http://localhost:5000/api/geometry/diff \
  -H "Content-Type: application/json" \
  -d '{
    "modelId":"my-model",
    "fromVersionId":"v1",
    "toVersionId":"v2"
  }'
```

### Push to Node B
```bash
curl -X POST http://localhost:5000/api/sync/push \
  -H "Content-Type: application/json" \
  -d '{
    "modelId":"my-model",
    "targetNode":"node_b"
  }'
```

### Check Conflicts
```bash
curl http://localhost:5000/api/conflict/list?status=detected
```

### Resolve Conflict
```bash
curl -X POST http://localhost:5000/api/conflict/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "conflictId":"conflict_123",
    "strategy":"TIMESTAMP"
  }'
```

---

## 🧪 Try the Demo

### Demo Scenarios
Click the **"Demo"** tab to see 5 interactive simulations:

1. **Storage Comparison** - Watch delta compression in action
2. **Conflict Detection** - See two nodes editing same model
3. **Conflict Resolution** - Watch automatic merge
4. **Multi-Node Sync** - Track versions across nodes
5. **Node Recovery** - Simulate node failure and recovery

---

## 📊 Monitoring

### Node A Status
```bash
curl http://localhost:5000/api/health
```

### Node B Status
```bash
curl http://localhost:5001/api/health
```

### Storage Metrics
```bash
curl http://localhost:5000/api/metrics/storage
```

**Sample Response**:
```json
{
  "totalModels": 5,
  "totalVersions": 25,
  "fullSnapshotSize": 12800,
  "deltaStorageSize": 2048,
  "compressionRatio": 0.84
}
```

### Sync History
```bash
curl http://localhost:5000/api/sync-history?limit=10
```

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error**: `Port 5000 already in use`
```bash
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or macOS/Linux
lsof -i :5000
kill -9 <PID>
```

**Error**: `MongoDB connection refused`
```bash
# Start MongoDB
# Windows: MongoDB service should auto-start
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Or use Docker
docker run -d -p 27017:27017 mongo:6.0
```

### Frontend Won't Load

**Error**: `Cannot GET /`
```bash
# Rebuild frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Sync Failed

**Error**: `Connection refused to Node B`
```bash
# Check if Node B is running
curl http://localhost:5001/api/health

# If not, restart Node B
cd node_b
mvn spring-boot:run
```

---

## 📚 Learn More

| Topic | Link |
|-------|------|
| **Full API Docs** | [API_DOCUMENTATION.md](API_DOCUMENTATION.md) |
| **Testing Guide** | [TESTING_GUIDE.md](TESTING_GUIDE.md) |
| **Performance** | [PERFORMANCE_BENCHMARKS.md](PERFORMANCE_BENCHMARKS.md) |
| **Architecture** | [IMPLEMENTATION.md](IMPLEMENTATION.md) |
| **Demo Walkthroughs** | [DEMO_SCENARIOS.md](DEMO_SCENARIOS.md) |

---

## 🎓 Learning Path

### For Beginners (15 mins)
1. ✅ Read this Quick Start
2. ✅ Upload first model
3. ✅ View version history

### For Intermediate (1 hour)
1. ✅ Upload multiple versions
2. ✅ Test push/pull sync
3. ✅ View diff reports
4. ✅ Try demo scenarios

### For Advanced (2-3 hours)
1. ✅ Read API Documentation
2. ✅ Run integration tests
3. ✅ Analyze performance metrics
4. ✅ Review source code

---

## 🔧 Development

### Project Structure
```
distributed-cad-versioning/
├── frontend/                 # React web app
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Page layouts
│   │   └── services/        # API clients
│   └── package.json
├── node_a/                  # Spring Boot Node A
│   ├── src/
│   │   ├── controller/      # REST endpoints
│   │   ├── service/         # Business logic
│   │   └── model/           # Data models
│   └── pom.xml
├── node_b/                  # Spring Boot Node B (identical to Node A)
├── shared/                  # Shared libraries
│   └── src/
│       ├── geometry/        # 3D geometry classes
│       ├── versioning/      # Version control logic
│       └── util/            # Utilities
└── docker-compose.yml       # Container orchestration
```

### Building From Source
```bash
# Build entire project
mvn clean package

# Build specific module
mvn clean package -pl node_a

# Skip tests (faster)
mvn clean package -DskipTests

# Run tests
mvn test
```

### Code Quality
```bash
# Static analysis
mvn checkstyle:check

# Code coverage
mvn jacoco:report

# Security scanning
mvn security:check
```

---

## 🚀 Deployment

### Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Clean up (remove volumes)
docker-compose down -v
```

### Kubernetes
```bash
# Coming soon!
# Deploy manifests to be added
kubectl apply -f k8s/
```

---

## 📞 Support

### Common Issues
1. **Port already in use**: Kill existing process on port
2. **MongoDB connection error**: Ensure MongoDB is running
3. **CORS error**: Check backend URLs in .env
4. **Sync failing**: Verify both nodes are running

### Debugging
1. Check logs: `docker-compose logs <service>`
2. Verify health: `curl http://localhost:5000/api/health`
3. Review metrics: `curl http://localhost:5000/api/metrics/storage`

### Performance
- Expected upload time: < 2 seconds for most models
- Expected sync latency: 500ms - 1 second per version
- Delta compression: 80%+ reduction

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Frontend loads at http://localhost:3000
- [ ] Node A responds at http://localhost:5000/api/health
- [ ] Node B responds at http://localhost:5001/api/health
- [ ] Can upload model to Node A
- [ ] Can view version history
- [ ] Can compare versions
- [ ] Can push from Node A to Node B
- [ ] Can pull from Node B to Node A
- [ ] Demo scenarios run successfully

---

## 🎉 Next Steps

Once setup is complete:

1. **Explore UI**: Click through all tabs
2. **Try Workflows**: Follow the demo scenarios
3. **Read Documentation**: Deep dive into architecture
4. **Run Tests**: Verify all features work
5. **Customize**: Modify for your use case

---

## Version Information

```
System Version  : 1.0.0
Release Date    : 2024-01-15
Java Version    : 21+
Spring Boot     : 3.5.0
React Version   : 18.2.0
MongoDB Version : 5.0+
Node.js Version : 16+
```

---

## License

This project is open source. See LICENSE file for details.

---

**🎯 You're all set! Happy versioning!**

Start with the Quick Start tasks above, then explore the full documentation to master the system.

