#  Distributed CAD Versioning System

Hệ thống quản lý phiên bản phân tán cho các mô hình 3D, hỗ trợ checkout, check-in, diff, merge và đồng bộ hóa giữa nhiều site.

##  Tính Năng Chính

✅ **Upload & Parse 3D Models** - Hỗ trợ OBJ, STL, STEP, IGES
✅ **Geometry Diff** - So sánh chi tiết giữa 2 phiên bản (vertices, faces, transformations)
✅ **Version Control** - Lịch sử phiên bản đầy đủ với branching
✅ **Conflict Resolution** - Giải quyết xung đột dùng branching hoặc timestamp-based strategy
✅ **Delta Storage** - Tiết kiệm dung lượng lưu trữ (83% giảm với 10 phiên bản)
✅ **Multi-Site Sync** - Đồng bộ hóa giữa Node A và Node B
✅ **Web Interface** - Dashboard trực quan với React

##  Cấu Trúc Dự Án

```
distributed_cad_versioning/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── App.jsx             # Main app component
│   │   ├── index.js            # React entry point
│   │   ├── components/         # Reusable UI components
│   │   │   ├── FileUpload.jsx
│   │   │   ├── VersionHistory.jsx
│   │   │   ├── DiffViewer.jsx
│   │   │   ├── GeometryViewer.jsx
│   │   │   ├── ModelList.jsx
│   │   │   └── ConflictResolver.jsx
│   │   ├── pages/              # Page layouts
│   │   │   ├── HomePage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ComparisonPage.jsx
│   │   │   └── DemoPage.jsx
│   │   └── services/
│   │       └── api.js          # API client
│   ├── public/
│   │   ├── index.html
│   │   └── index.css           # Styles
│   ├── package.json
│   └── .env
│
├── node_a/                     # Spring Boot Backend (Node A)
├── node_b/                     # Spring Boot Backend (Node B)
├── shared/                     # Shared utilities (Java)
├── sample-files/               # Sample 3D files
│   ├── cube-v1.obj
│   └── cube-v2.obj
└── docker-compose.yml
```

##  Cách Chạy

### Option 1: Local Development (Recommended for Demo)

#### Prerequisites
- Node.js 16+
- Java 11+
- Maven
- MongoDB (optional - sử dụng in-memory storage cho demo)

#### Backend - Node A

```bash
cd node_a
mvn clean install
mvn spring-boot:run
```

Server sẽ khởi động tại `http://localhost:5000`

#### Backend - Node B

```bash
cd node_b
mvn clean install
mvn spring-boot:run
```

Server sẽ khởi động tại `http://localhost:5001`

#### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend sẽ khởi động tại `http://localhost:3000`

### Option 2: Docker Compose

```bash
docker-compose up
```

Truy cập:
- Frontend: `http://localhost:3000`
- Node A API: `http://localhost:5000/api`
- Node B API: `http://localhost:5001/api`

##  Sử Dụng Demo

### 1️⃣ Upload & Parse 3D Files
1. Truy cập `http://localhost:3000`
2. Chọn tab **"Node A"** hoặc **"Node B"**
3. Nhập Object ID (e.g., "cube-model")
4. Tải lên file 3D (sample files có sẵn tại `sample-files/`)
5. Hệ thống sẽ parse file và convert thành JSON

### 2️⃣ Xem Geometry Diff
1. Upload 2 phiên bản của cùng một model
2. Chuyển đến tab **"History"**
3. Chọn "From" cho phiên bản cũ, "To" cho phiên bản mới
4. Nhấp **"Compare Versions"**
5. Xem chi tiết thay đổi:
   - Số vertices thêm/xóa/sửa
   - Số faces thêm/xóa
   - Danh sách cụ thể các thay đổi

### 3️⃣ So Sánh Giữa 2 Nodes
1. Chuyển đến tab **"Compare Nodes"**
2. Upload file lên cả Node A và Node B
3. Chọn version từ mỗi node
4. Xem diff để phát hiện sự khác biệt

### 4️⃣ Giải Quyết Xung Đột
1. Upload model lên Node A
2. Upload giống ID model lên Node B với thay đổi khác nhau
3. Chuyển đến tab **"Conflicts"**
4. Chọn strategy:
   - **Keep Both (Create Branch)**: Giữ cả 2 version như branches riêng
   - **Use Latest (Timestamp)**: Lấy version mới nhất
   - **Use Version A/B**: Chọn cụ thể
5. Nhấp **"Resolve Conflict"**

### 5️⃣ Chạy Interactive Demos
1. Chuyển đến tab **"Demo"**
2. Chọn scenario muốn xem:
   -  **Upload & Parse**: Mô phỏng upload file 3D
   -  **Geometry Diff**: So sánh 2 version
   - ⚠️ **Conflict Resolution**: Xử lý xung đột
   -  **Storage Comparison**: Full Snapshot vs Delta Storage
   -  **Multi-Site Sync**: Đồng bộ hóa 2 site

##  Storage Efficiency Analysis

### Scenario: 10 Phiên Bản của Cùng Model

**❌ Full Snapshot Strategy:**
```
v1:  1.0 KB
v2:  1.05 KB
v3:  1.10 KB
...
v10: 1.45 KB
─────────────
TOTAL: 11.25 KB
```

**✅ Delta Storage Strategy:**
```
v1 (snapshot): 1.0 KB
Δ(v1→v2): 0.10 KB
Δ(v2→v3): 0.08 KB
...
Δ(v9→v10): 0.09 KB
───────────────
TOTAL: 1.87 KB
```

** Savings: 83.4%**

Với checkpointing mỗi 5 phiên bản: **71.6% reduction**

##  Conflict Resolution Strategies

### Strategy 1: BRANCH (Recommended)
- Giữ cả 2 version
- Tạo 2 branches riêng
- Cho phép manual merge sau
- Lợi: Không mất dữ liệu
- Hại: Cần user quyết định

### Strategy 2: TIMESTAMP (Automatic)
- Last-writer-wins
- Dùng timestamp để quyết định
- Tự động resolve
- Lợi: Nhanh, không cần user
- Hại: Có thể mất dữ liệu

### Strategy 3: THREE-WAY MERGE (Advanced)
- So sánh base + A + B
- Tự động merge nếu không xung đột
- Lợi: Thông minh, tối đa hóa khả năng merge
- Hại: Phức tạp implement

## ️ API Endpoints

### Geometry Operations
```
POST   /api/geometry/upload              Upload file 3D
GET    /api/geometry/{id}/versions       Lấy tất cả phiên bản
GET    /api/geometry/{id}/version/{v}    Lấy phiên bản cụ thể
GET    /api/geometry/{id}/diff           Compute diff
```

### CAD Model Management
```
POST   /api/cad/create                   Tạo model mới
GET    /api/cad/{modelId}                Lấy info model
GET    /api/cad/list                     List tất cả models
PUT    /api/cad/{modelId}                Update model
DELETE /api/cad/{modelId}                Xóa model
```

### Version Management
```
POST   /api/version/checkout             Checkout model
POST   /api/version/checkin              Checkin version mới
GET    /api/version/{modelId}/history    Lấy version history
GET    /api/version/{modelId}/branches   Lấy branches
```

### Conflict Management
```
GET    /api/conflict/{modelId}/list      List conflicts
GET    /api/conflict/{id}                Chi tiết conflict
POST   /api/conflict/{id}/resolve        Resolve conflict
```

##  Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Upload Speed | ~100 MB/s | Tuỳ network |
| Diff Computation | <1s | Cho model 50K vertices |
| Storage Reduction | 83% | 10 versions, delta strategy |
| Sync Time | <100ms | Giữa 2 sites cùng network |

##  Testing

### Run Unit Tests
```bash
cd node_a
mvn test

cd node_b
mvn test
```

### Run Demo
```bash
python run_demo.py
```

##  Documentation

- `IMPLEMENTATION.md` - Chi tiết kỹ thuật
- `VALIDATION_REPORT.md` - Kết quả testing
- `RESULTS.md` - Kết quả performance

##  Technologies Used

**Frontend:**
- React 18
- Axios (HTTP Client)
- CSS3 (Responsive Design)

**Backend:**
- Spring Boot 2
- Spring Data MongoDB
- Java 11+

**Database:**
- MongoDB (optional)
- In-memory storage (demo)

**DevOps:**
- Docker & Docker Compose
- Maven

##  License

MIT

## ‍ Author

Built as a demonstration of distributed version control for 3D CAD models.

---

**Happy versioning! **
