# 🗄️ Distributed CAD Versioning System

> Hệ thống quản lý phiên bản file 3D CAD theo mô hình **phân tán (distributed)** với hai node độc lập, đồng bộ hóa tự động và thuật toán **Snapshot + Delta** tối ưu lưu trữ.

---

## 📐 Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
│                   http://localhost:3000                     │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
    ┌──────────▼──────────┐   ┌───────────▼─────────┐
    │     Node A          │   │      Node B          │
    │  Spring Boot        │◄──►  Spring Boot         │
    │  Port: 5000         │   │  Port: 5001          │
    │  MongoDB: cad_node_a│   │  MongoDB: cad_node_b │
    └─────────────────────┘   └─────────────────────┘
```

Mỗi node hoàn toàn **độc lập** — có MongoDB riêng, chạy độc lập và tự đồng bộ với nhau qua REST API.

---

## 🗂️ Cấu trúc thư mục

```
distributed_cad_versioning/
├── node_a/                          # Backend Node A (port 5000)
│   └── src/main/java/org/example/
│       ├── cad/
│       │   ├── controller/
│       │   │   ├── GeometryController.java    # Upload/query OBJ files
│       │   │   ├── VersionController.java     # Version chain, restore, benchmark
│       │   │   └── SyncController.java        # P2P sync API
│       │   ├── service/
│       │   │   ├── VersionService.java        # Core versioning + snapshot/delta
│       │   │   ├── Geometry3DService.java     # OBJ parsing, geometry CRUD
│       │   │   ├── SyncService.java           # Peer-to-peer synchronization
│       │   │   ├── ConflictService.java       # Conflict detection + resolution
│       │   │   ├── VersionGraphService.java   # DAG branch traversal
│       │   │   └── SyncControlService.java    # Enable/disable sync toggle
│       │   ├── domain/model/
│       │   │   ├── VersionDoc.java            # MongoDB version document
│       │   │   ├── Geometry3DModel.java       # MongoDB geometry metadata
│       │   │   └── Version.java               # Version entity
│       │   └── repository/
│       │       ├── VersionRepository.java
│       │       └── Geometry3DRepository.java
│       └── dv/                               # Geometry engine (self-contained)
│           ├── Geometry3D.java               # 3D mesh data model
│           ├── Geometry3DDiff.java           # Diff + Apply algorithm
│           ├── ObjParser.java                # .obj file parser
│           └── Version.java
├── node_b/                          # Backend Node B (port 5001) — cấu trúc tương tự
├── frontend/                        # React dashboard
│   └── src/
│       ├── pages/
│       │   ├── DashboardPage.jsx    # Tổng quan hệ thống
│       │   ├── DemoPage.jsx         # Trang demo thuật toán
│       │   ├── ComparisonPage.jsx   # So sánh 2 node
│       │   └── HomePage.jsx         # Trang chủ
│       ├── components/
│       │   ├── FileUpload.jsx       # Upload OBJ (chọn branch + parent version)
│       │   ├── VersionHistory.jsx   # Lịch sử version + View Chain + Restore
│       │   ├── VersionDAG.jsx       # Sơ đồ DAG nhánh version
│       │   ├── ModelViewer3D.jsx    # Render 3D mesh
│       │   ├── BranchSelector.jsx   # Chọn branch
│       │   ├── GeometryViewer.jsx   # Hiển thị geometry data
│       │   └── ModelList.jsx        # Danh sách model
│       └── services/
│           └── api.js               # REST client cho cả 2 node
└── test_upload.js                   # Script upload hàng loạt để demo
```

---

## 🔑 Thuật toán cốt lõi

### 1. Snapshot + Delta Versioning

```
V1  [Snapshot] ← Lưu toàn bộ geometry JSON
V2  [Delta]    ← Lưu diff so với V1
V3  [Delta]    ← Lưu diff so với V2
V4  [Delta]    ← Lưu diff so với V3
V5  [Delta]    ← Lưu diff so với V4
V6  [Snapshot] ← Lưu toàn bộ geometry JSON (chu kỳ mới)
V7  [Delta]    ...
```

**Quy tắc:** `versionNumber % 5 == 1` → fullSnapshot = `true`

**Lợi ích:**
- Snapshot thu nhỏ chi phí restore tối đa về `O(k)` thay vì `O(n)`
- Delta tiết kiệm bộ nhớ đáng kể (chỉ lưu thay đổi vertex/face)

### 2. Restore Algorithm

```
Để restore V9:
  1. Tìm Snapshot gần nhất: V6
  2. Load Snapshot V6 → geometry_base
  3. Apply Delta V7 → geometry_base
  4. Apply Delta V8 → geometry_base
  5. Apply Delta V9 → geometry_result ✓
```

### 3. Diff Format (DiffReport)

```json
{
  "geometryName": "engine.obj",
  "newVertexCount": 1523,
  "newFaceCount": 412,
  "vertexChanges": [
    { "index": 5, "type": "modified", "newValue": { "x": 1.2, "y": 3.4, "z": 0.0 } },
    { "index": 1522, "type": "added",    "newValue": { "x": 9.1, "y": 2.0, "z": 5.5 } }
  ],
  "faceChanges": [...]
}
```

### 4. Conflict Resolution

```
Kịch bản:
  1. Node A và Node B cùng checkout V1
  2. Node A push → tạo V2_A (branch: main)
  3. Node B push cùng parent V1 → tạo V2_B
  4. Conflict detected: V2_A.parent == V2_B.parent == V1

Xử lý:
  V1
  ├── V2_A  (main — winner theo timestamp)
  └── V2_B  (conflict/V2_B — loser)
```

---

## 🚀 Cách chạy dự án

### Yêu cầu
- Java 21+
- Maven 3.8+
- Node.js 18+
- Kết nối MongoDB Atlas (đã cấu hình sẵn trong `application.yml`)

### Khởi động Node A
```bash
cd node_a
mvn spring-boot:run
# → http://localhost:5000
```

### Khởi động Node B
```bash
cd node_b
mvn spring-boot:run
# → http://localhost:5001
```

### Khởi động Frontend
```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

---

## 🌐 API Reference

### Upload OBJ File
```http
POST /api/geometry/upload
Content-Type: multipart/form-data

objectId=engine
file=@engine.obj
branchName=main
parentVersion=v1_A   (optional)
```

### View Version Chain
```http
GET /api/version/chain?modelId=engine
```
Trả về chuỗi: `V1 [Snapshot] → V2 [Delta] → V3 [Delta] → ...`

### Restore Version
```http
POST /api/version/restore?modelId=engine&versionNumber=9
```
Backend log:
```
Found nearest snapshot: V6
Applying Delta: V7 → V8 → V9
Restore completed.
```

### Show Restore Steps
```http
GET /api/version/restore-steps?modelId=engine&versionNumber=9
```

### Benchmark
```http
GET /api/version/benchmark?modelId=engine&versionNumber=9
```
```json
{
  "snapshotSize": "1.2 MB",
  "deltaSize":    "8 KB",
  "snapshotRestoreTime": "15 ms",
  "deltaChainRestoreTime": "40 ms"
}
```

### Show Delta
```http
GET /api/version/delta?modelId=engine&versionNumber=3
```

### Checkout (lấy version hiện tại)
```http
POST /api/version/checkout
{ "modelId": "engine", "branchName": "main" }
```

### Sync Control
```http
POST /api/sync/enable     # Bật đồng bộ
POST /api/sync/disable    # Tắt đồng bộ
GET  /api/sync/status     # Trạng thái đồng bộ
```

---

## 🖥️ Giao diện Frontend

| Trang | Mô tả |
|-------|-------|
| **Dashboard** | Tổng quan: upload file, xem lịch sử version, sơ đồ DAG |
| **Demo** | Minh họa thuật toán: View Chain, Restore, Show Steps, Benchmark, Show Delta |
| **Comparison** | So sánh trực quan 2 node song song |
| **Home** | Giới thiệu hệ thống |

### Các tính năng nổi bật
- **Upload đa file**: Chọn branch và parent version từ dropdown
- **View Version Chain**: Hiển thị toàn bộ chuỗi Snapshot/Delta
- **Restore Version**: Khôi phục về bất kỳ version nào với log từng bước
- **Benchmark**: So sánh kích thước Snapshot vs Delta, thời gian restore
- **Show Delta**: Xem chi tiết vertex/face thay đổi giữa 2 version
- **3D Viewer**: Render mesh trực tiếp trên trình duyệt
- **Sync Toggle**: Bật/tắt đồng bộ giữa 2 node để demo kịch bản conflict

---

## 📊 Dữ liệu MongoDB

### Collection `versions` (VersionDoc)
| Field | Kiểu | Mô tả |
|-------|------|-------|
| `modelId` | String | ID model CAD |
| `versionNumber` | int | Số thứ tự version |
| `versionName` | String | Tên (vd: `v1_A`, `v2_B`) |
| `fullSnapshot` | boolean | `true` = Snapshot, `false` = Delta |
| `geometryData` | String (JSON) | Dữ liệu geometry hoặc DiffReport |
| `parentVersion` | String | Tên version cha |
| `branchName` | String | Nhánh (`main`, `conflict/...`) |
| `syncStatus` | String | `PENDING_SYNC`, `SYNCED`, `ACTIVE`, `CONFLICT` |
| `siteId` | String | Node nguồn (`node-a`, `node-b`) |

### Collection `geometries` (Geometry3DModel)
| Field | Kiểu | Mô tả |
|-------|------|-------|
| `objectId` | String | ID model |
| `version` | int | Số version |
| `name` | String | Tên file |
| `format` | String | Định dạng (`obj`) |
| `siteId` | String | Node nguồn |
| `timestamp` | long | Unix timestamp |

---

## 🧪 Test Upload hàng loạt

```bash
# Upload 10 file OBJ liên tiếp để sinh chuỗi version demo
node test_upload.js
```

Script tự động tạo 10 version với nội dung OBJ ngẫu nhiên thay đổi, sinh ra chuỗi Snapshot/Delta điển hình.

---

## 🏗️ Công nghệ sử dụng

| Layer | Công nghệ |
|-------|-----------|
| Backend | Spring Boot 3.5, Java 21, Maven |
| Database | MongoDB Atlas (riêng cho mỗi node) |
| Serialization | Gson 2.10.1 |
| Frontend | React 18, CSS thuần |
| 3D Render | Three.js (qua ModelViewer3D) |
| HTTP Client | RestTemplate (Spring) |

---

## 👥 Phân công module

| Module | Mô tả |
|--------|-------|
| `VersionService` | Snapshot/Delta cycle, conflict detection |
| `Geometry3DService` | OBJ parsing, geometry CRUD |
| `SyncService` | P2P sync, scheduled pull, async push |
| `ConflictService` | Conflict resolution, branch naming |
| `Geometry3DDiff` | Diff engine (vertex-level diff + apply) |
| `ObjParser` | Parse file `.obj` → `Geometry3D` |

---

## 📝 Ghi chú

- Mỗi node có MongoDB **riêng biệt** — không dùng chung database
- Sync hoạt động theo cơ chế **push + scheduled pull** (mỗi 30 giây)
- Conflict được giải quyết theo **timestamp** — version mới hơn thắng
- Frontend kết nối trực tiếp với cả hai node qua `/api/...`
