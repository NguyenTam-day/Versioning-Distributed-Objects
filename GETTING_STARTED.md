#  Getting Started with CAD Versioning System

## System Requirements

| Requirement | Version | Link |
|-------------|---------|------|
| Java | 11+ | [adoptopenjdk.net](https://adoptopenjdk.net/) |
| Maven | 3.6+ | [maven.apache.org](https://maven.apache.org/download.cgi) |
| Node.js | 16+ | [nodejs.org](https://nodejs.org/) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

##  Fast Setup (Windows PowerShell)

```powershell
# Clone repository
git clone https://github.com/yourusername/distributed_cad_versioning.git
cd distributed_cad_versioning

# Run setup script
.\setup.bat
```

##  Run All Services

### Terminal 1: Node A (Java Backend - Port 5000)
```powershell
cd node_a
mvn spring-boot:run
```

### Terminal 2: Node B (Java Backend - Port 5001)
```powershell
cd node_b
mvn spring-boot:run
```

### Terminal 3: Frontend (React - Port 3000)
```powershell
cd frontend
npm start
```

##  Access Application

- **Web UI**: http://localhost:3000
- **Node A API**: http://localhost:5000/api
- **Node B API**: http://localhost:5001/api

##  Sample Workflow

### 1. Upload Your First Model
```
1. Website: http://localhost:3000
2. Tab: "Node A" 
3. Object ID: my-first-model
4. Select file: sample-files/cube-v1.obj
5. Click Upload
```

### 2. Upload Another Version
```
1. Same Object ID: my-first-model
2. Select file: sample-files/cube-v2.obj
3. Click Upload
```

### 3. Compare Versions
```
1. Tab: "History"
2. Click "From" on v1
3. Click "To" on v2
4. Click "Compare Versions"
5. View the detailed diff report
```

### 4. Run Interactive Demo
```
1. Tab: "Demo"
2. Click a scenario (e.g., "Storage Comparison")
3. Watch the simulation
```

##  Sample 3D Files

Pre-included test files:
- `sample-files/cube-v1.obj` - Basic cube (8 vertices)
- `sample-files/cube-v2.obj` - Modified cube (10 vertices)

##  Configuration

### Frontend (.env)
```
REACT_APP_API_NODE_A=http://localhost:5000/api
REACT_APP_API_NODE_B=http://localhost:5001/api
```

### Node A (application.yml)
```yaml
server.port: 5000
spring.data.mongodb.uri: mongodb://localhost:27017/cad_node_a
```

### Node B (application.yml)
```yaml
server.port: 5001
spring.data.mongodb.uri: mongodb://localhost:27017/cad_node_b
```

##  API Quick Test

### Health Check
```bash
curl http://localhost:5000/api/geometry/list
```

### List Models
```bash
curl http://localhost:5000/api/cad/list
```

### Sample Request
```bash
curl -X GET "http://localhost:5000/api/geometry/my-model/versions"
```

##  Key Features Demo

### Feature 1: Geometry Diff
- Upload 2 versions of same model
- System computes detailed differences
- Shows vertex and face changes

### Feature 2: Conflict Resolution
- Upload same model to 2 nodes with different changes
- System detects conflicts
- Apply branching or timestamp-based resolution

### Feature 3: Delta Storage
- Upload multiple versions
- System stores deltas instead of full snapshots
- Saves ~83% storage space

### Feature 4: Multi-Node Sync
- Compare versions between Node A and Node B
- See differences across distributed sites
- Pull/Push for synchronization

## ✅ Verification Checklist

```
[ ] Java installed: java -version
[ ] Maven installed: mvn -version
[ ] Node.js installed: node -v
[ ] Git installed: git --version
[ ] Project cloned
[ ] npm dependencies installed: cd frontend && npm ls
[ ] Node A running on :5000
[ ] Node B running on :5001
[ ] Frontend accessible on :3000
[ ] Sample files present: ls sample-files/
```

##  Common Issues

### Issue: "Port already in use"
**Solution**: Change port in application.yml or kill existing process
```bash
# Windows - Find process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

### Issue: "Cannot find Java command"
**Solution**: Add Java to PATH environment variable
```bash
java -version  # Test if Java is accessible
```

### Issue: "npm ERR! module not found"
**Solution**: Reinstall dependencies
```bash
cd frontend
rm -rf node_modules
npm install
```

### Issue: "CORS error in console"
**Solution**: Backends have @CrossOrigin enabled, check if servers are running

##  Documentation

- **[FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md)** - UI features & usage
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Technical architecture
- **[VALIDATION_REPORT.md](./VALIDATION_REPORT.md)** - Test results & metrics

##  Architecture Overview

```
User Browser (Port 3000)
        ↓
    React Frontend
        ↓
    ├─→ Node A API (Port 5000)
    │        ↓
    │    Spring Boot Service
    │        ↓
    │    MongoDB (optional)
    │
    └─→ Node B API (Port 5001)
             ↓
         Spring Boot Service
             ↓
         MongoDB (optional)
```

##  Production Deployment

### Docker Setup
```bash
docker-compose up -d
```

### Configuration
```bash
export NODE_A_PORT=5000
export NODE_B_PORT=5001
export FRONTEND_PORT=3000
docker-compose up
```

##  Support

For issues or questions:
1. Check troubleshooting section above
2. Read implementation documentation
3. Check terminal logs for error messages
4. Verify all services are running on correct ports

---

**Next:** Read [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md) for detailed feature documentation

**Status:** ✅ Ready to use!
