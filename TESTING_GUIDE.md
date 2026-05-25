# Distributed CAD Versioning System - Testing Guide

## Test Scenarios & Validation

### Scenario 1: Basic Upload & Versioning
**Objective**: Verify single-node upload and versioning works correctly

**Steps**:
1. Start Node A backend
2. Upload cube-v1.obj
3. Create version 1
4. Upload cube-v2.obj (same model)
5. Create version 2

**Expected Results**:
- ✓ Two versions created (v1, v2)
- ✓ Version history shows both
- ✓ Geometry diff shows changes between v1 and v2
- ✓ Delta storage: v2 delta < v1 full snapshot

**Validation Endpoint**:
```bash
curl http://localhost:5000/api/cad/cube-model
curl http://localhost:5000/api/version/cube-model/history
```

---

### Scenario 2: Multi-Node Sync (Pull Operation)
**Objective**: Verify successful pull synchronization between nodes

**Setup**:
- Node A has model "box-model" at v3
- Node B has same model at v1 (outdated)

**Steps**:
1. Start both Node A and Node B
2. Verify Node B is at v1
3. Trigger Pull on Node B from Node A
4. Verify Node B advances to v3

**Expected Results**:
- ✓ Node B fetches missing deltas (Δv1→v2, Δv2→v3)
- ✓ Each delta verified before applying
- ✓ Node B now at v3 with correct geometry
- ✓ Sync history records successful transfer

**Validation Endpoint**:
```bash
# Check Node B version before pull
curl http://localhost:5001/api/version/box-model/current

# Trigger pull
curl -X POST http://localhost:5001/api/sync/pull \
  -H "Content-Type: application/json" \
  -d '{"modelId":"box-model","sourceNode":"node_a"}'

# Check Node B version after pull
curl http://localhost:5001/api/version/box-model/current
```

---

### Scenario 3: Conflict Detection (Concurrent Edits)
**Objective**: Verify conflict detection when both nodes edit same model

**Timeline**:
```
t=0:   A: checkout v1 ────────────────────────── commit v2a (t=10s)
       B: checkout v1 ────────────────────────── commit v2b (t=15s)
       
       Result: Both v2a and v2b are children of v1 → CONFLICT!
```

**Steps**:
1. Both nodes start with v1
2. Node A edits → commits v2a
3. Node B edits independently → commits v2b
4. Trigger sync attempt

**Expected Results**:
- ✓ Conflict detected (v2a vs v2b)
- ✓ Conflict recorded in database
- ✓ Both versions preserved
- ✓ Conflict status: "detected"
- ✓ No auto-merge without resolution strategy

**Validation Endpoint**:
```bash
curl http://localhost:5000/api/conflict/list?modelId=test-model&status=detected
```

---

### Scenario 4: Conflict Resolution - BRANCH Strategy
**Objective**: Verify automatic branching on conflict

**Setup**: Same as Scenario 3 (conflict exists)

**Steps**:
1. Conflict detected (v2a vs v2b)
2. Trigger resolution with BRANCH strategy
3. Verify branch structure

**Expected Results**:
- ✓ main branch: v2a
- ✓ feature/node-b: v2b
- ✓ Both versions preserved
- ✓ Conflict marked as "resolved"

**Validation Endpoint**:
```bash
curl -X POST http://localhost:5000/api/conflict/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "conflictId":"conflict_123",
    "strategy":"BRANCH",
    "resolutionVersionId":"v2a"
  }'

curl http://localhost:5000/api/branch/list?modelId=test-model
```

---

### Scenario 5: Conflict Resolution - TIMESTAMP Strategy
**Objective**: Verify timestamp-based auto-resolution

**Setup**: Conflict with different timestamps

**Steps**:
1. Conflict detected (v2a: 10:30, v2b: 10:45)
2. Trigger resolution with TIMESTAMP strategy
3. Verify newer version wins

**Expected Results**:
- ✓ v2b (newer) becomes head
- ✓ v2a archived
- ✓ Conflict resolved automatically
- ✓ No manual merge needed

**Validation**:
```bash
curl -X POST http://localhost:5000/api/conflict/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "conflictId":"conflict_123",
    "strategy":"TIMESTAMP"
  }'
```

---

### Scenario 6: Conflict Resolution - THREE_WAY_MERGE
**Objective**: Verify intelligent three-way merge

**Setup**: 
```
Base (v1):   vertices=[1,2,3], faces=[f1,f2]
Change A:    vertices=[1,2,3,4], faces=[f1,f2,f3]  (added vertex 4, face f3)
Change B:    vertices=[1,2,3], faces=[f1,f2,f4]    (modified face f2 → f4)

Result: Non-conflicting changes → Auto-merge possible!
        Merged: vertices=[1,2,3,4], faces=[f1,f4,f3]
```

**Steps**:
1. Conflict with non-conflicting changes
2. Trigger THREE_WAY_MERGE
3. Verify merged result

**Expected Results**:
- ✓ Changes analyzed at vertex/face level
- ✓ Non-conflicting changes merged
- ✓ Conflicting changes marked for manual review
- ✓ Merged version created

**Validation Endpoint**:
```bash
curl -X POST http://localhost:5000/api/conflict/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "conflictId":"conflict_123",
    "strategy":"THREE_WAY_MERGE"
  }'

curl http://localhost:5000/api/version/test-model/merged_v2
```

---

### Scenario 7: Delta Storage Efficiency
**Objective**: Verify delta storage reduces size significantly

**Test**:
1. Upload model version 10 times with small changes
2. Compare storage:
   - Full snapshot mode: 10 × 1.0 KB = 10 KB
   - Delta mode: 1.0 KB + 0.08 KB × 9 = 1.72 KB
   - Savings: (10 - 1.72) / 10 = 82.8%

**Steps**:
1. Enable delta storage in config
2. Upload 10 versions
3. Check database size

**Expected Results**:
- ✓ Delta storage: ~1.72 KB
- ✓ Full storage would be: ~10 KB
- ✓ Compression ratio: 80%+

**Validation**:
```bash
# Check storage stats
curl http://localhost:5000/api/metrics/storage?modelId=test-model
```

**Expected Response**:
```json
{
  "totalVersions": 10,
  "fullSnapshotSize": 10240,
  "deltaStorageSize": 1762,
  "compressionRatio": 0.828,
  "savingsPercent": 82.8
}
```

---

### Scenario 8: Node Failure & Recovery
**Objective**: Verify system resilience to node failures

**Steps**:
1. Both nodes running, synchronized
2. Kill Node B
3. Node A continues working
4. Restart Node B
5. Trigger auto-recovery

**Expected Results**:
- ✓ Node A unaffected, continues operating
- ✓ Node B reconnects to MongoDB
- ✓ Auto-sync detects outdated state
- ✓ Node B recovers to current state
- ✓ No data loss

**Test Commands**:
```bash
# Kill Node B (in Docker)
docker kill cad-node-b

# Wait 10 seconds, restart
docker start cad-node-b

# Check recovery status
curl http://localhost:5001/api/health
```

---

### Scenario 9: Delayed Synchronization
**Objective**: Verify eventual consistency with network delays

**Setup**:
- Add 500ms delay to network requests
- Node A and B editing same model independently

**Steps**:
1. Node A commits v2a
2. Node B tries to push to Node A
3. Wait for timeout/retry
4. Verify eventual sync

**Expected Results**:
- ✓ Requests succeed despite delay
- ✓ Conflict detection still works
- ✓ Data eventually consistent
- ✓ No data corruption

---

### Scenario 10: Distributed DAG Consistency
**Objective**: Verify version DAG is consistent across nodes

**Steps**:
1. Create version graph on Node A
2. Push to Node B
3. Create conflicting version on Node B
4. Verify DAG structure matches

**Expected Results**:
- ✓ Same commit history
- ✓ Correct parent-child relationships
- ✓ Branch structure consistent
- ✓ DAG visualization identical

**Validation Endpoint**:
```bash
# Get DAG from Node A
curl http://localhost:5000/api/version/test-model/dag

# Get DAG from Node B
curl http://localhost:5001/api/version/test-model/dag

# Should be identical
```

---

## Integration Test Suite

### Test Automation Script

```bash
#!/bin/bash
# run_integration_tests.sh

echo "🧪 Distributed CAD Versioning System - Integration Tests"
echo "========================================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

test_count=0
passed=0

# Test function
run_test() {
  test_count=$((test_count + 1))
  test_name=$1
  curl_cmd=$2
  expected_code=$3

  echo -e "\n📋 Test $test_count: $test_name"
  
  response=$(eval "$curl_cmd" -w "\n%{http_code}")
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" == "$expected_code" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    passed=$((passed + 1))
  else
    echo -e "${RED}✗ FAILED${NC} (Expected $expected_code, got $http_code)"
  fi
}

# Run tests
echo -e "\n🔄 Testing Node A Backend..."
run_test "Health Check Node A" \
  "curl -s http://localhost:5000/api/health" \
  "200"

echo -e "\n🔄 Testing Node B Backend..."
run_test "Health Check Node B" \
  "curl -s http://localhost:5001/api/health" \
  "200"

echo -e "\n🔄 Testing Upload..."
run_test "Upload Model" \
  "curl -s -F 'objectId=test-model' -F 'file=@sample-files/cube-v1.obj' http://localhost:5000/api/geometry/upload" \
  "200"

echo -e "\n🔄 Testing Sync..."
run_test "Pull from Node A" \
  "curl -s -X POST -H 'Content-Type: application/json' -d '{\"modelId\":\"test-model\",\"sourceNode\":\"node_a\"}' http://localhost:5001/api/sync/pull" \
  "200"

# Summary
echo -e "\n========================================================"
echo -e "Results: ${GREEN}$passed/$test_count${NC} tests passed"

if [ $passed -eq $test_count ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
```

---

## Performance Benchmarks

### Metrics to Monitor

1. **Upload Time**
   - Small file (< 100KB): < 500ms
   - Medium file (100KB - 1MB): < 2s
   - Large file (> 1MB): < 5s

2. **Sync Latency**
   - Pull operation: < 1s per version
   - Push operation: < 1s per version
   - Delta transfer: < 100ms per version

3. **Conflict Resolution**
   - Detection: < 200ms
   - TIMESTAMP resolution: < 100ms
   - THREE_WAY merge: < 500ms

4. **Storage Efficiency**
   - Delta compression: 80%+ reduction
   - Index overhead: < 10% of data size

---

## Debugging Tips

### Enable Verbose Logging
```yaml
# application.yml for Node A
logging:
  level:
    org.example: DEBUG
    org.springframework: INFO
```

### Monitor Sync Operations
```bash
curl http://localhost:5000/api/sync-history?limit=50 | jq '.[] | {syncType, status, bytesTransferred}'
```

### Check Conflict Status
```bash
curl http://localhost:5000/api/conflict/list | jq '.[] | {modelId, status, resolutionStrategy}'
```

### Inspect Delta Storage
```bash
curl http://localhost:5000/api/metrics/deltas?modelId=test-model | jq '.'
```

---

## Success Criteria

- [ ] All 10 scenarios pass
- [ ] Conflict detection works accurately
- [ ] Delta storage achieves 80%+ compression
- [ ] Sync latency < 1s per version
- [ ] No data loss on node failure
- [ ] DAG consistency verified
- [ ] Integration tests all pass
- [ ] Performance benchmarks met

