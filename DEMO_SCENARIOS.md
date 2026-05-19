#  Demo Scenarios Guide

Interactive demonstrations of the Distributed CAD Versioning System

##  Before You Start

Ensure all services are running:
- Node A: http://localhost:5000 ✓
- Node B: http://localhost:5001 ✓
- Frontend: http://localhost:3000 ✓

Access the app at: **http://localhost:3000**

---

## Scenario 1:  Upload & Parse 3D Model

Learn how the system converts 3D files to JSON for comparison

### Steps

1. **Navigate to Dashboard**
   - Click **"Node A"** in the navbar
   - Click **"Upload"** tab

2. **Upload First Model**
   - Enter Object ID: `demo-cube`
   - Click upload area
   - Select file: `sample-files/cube-v1.obj`
   - Click **"Upload"** button

3. **Observe Results**
   - ✓ You should see: "File uploaded successfully! Version: 1"
   - Notice the output:
     - Format: OBJ
     - Vertices: 8
     - Faces: 6

4. **View JSON Representation**
   - Click **"Viewer"** tab
   - Expand JSON to see geometry data structure
   - Note the vertices and faces array

### What Happened?
- System parsed OBJ file
- Extracted vertex coordinates and face indices
- Converted to JSON format for comparison
- Stored as Version 1

### Key Learning
✓ OBJ files are text-based 3D geometry formats
✓ Parsing converts coordinates into structured data
✓ JSON enables version comparison

---

## Scenario 2:  Geometry Diff Comparison

Compare two versions to see what changed

### Steps

1. **Create Second Version**
   - Still in **Node A** → **Upload** tab
   - Keep Object ID: `demo-cube`
   - Select: `sample-files/cube-v2.obj`
   - Click **"Upload"** button
   - ✓ You should see: "File uploaded successfully! Version: 2"

2. **View Version History**
   - Click **"History"** tab
   - You should see:
     ```
     Version 1 | cube-v1    | 8 vertices | 6 faces
     Version 2 | cube-v2    | 10 vertices | 6 faces
     ```

3. **Select Versions to Compare**
   - Click **"From"** button on Version 1
   - Click **"To"** button on Version 2
   - Button backgrounds should change to red/green

4. **Compute Diff**
   - Click **"Compare Versions →"** button
   - Click **"Diff"** tab to see results

5. **Analyze Diff Report**
   - **Statistics Cards** show:
     - Vertices Added: 2
     - Vertices Modified: 0
     - Vertices Deleted: 0
     - Faces Added: 0
     - Faces Deleted: 0

6. **View Detailed Changes**
   - Left panel: Vertex changes
   - Right panel: Face changes
   - Scroll to see up to 10 changes per section

### What Happened?
- System computed geometric diff between v1 and v2
- Detected vertices were added
- Face structure remained unchanged
- Generated detailed change report

### Key Learning
✓ Diff shows exact changes at geometry level
✓ Vertices and faces tracked separately
✓ Useful for understanding design modifications

---

## Scenario 3: ⚠️ Conflict Resolution

Handle concurrent edits from multiple sites

### Steps

1. **Setup on Node A**
   - Click **"Node A"** tab
   - Upload `cube-v1.obj` as `conflict-test` (version 1)

2. **Setup on Node B**
   - Click **"Node B"** tab
   - Upload `cube-v1.obj` as `conflict-test` (should also be version 1)

3. **Create Conflicting Changes**
   - Node A: Upload `cube-v2.obj` with same Object ID `conflict-test`
     - This creates version 2 on Node A
   - Node B: Upload `sample-files/cube-v2.obj` with same Object ID `conflict-test`
     - This creates version 2 on Node B
     - But both changed same base version (v1) differently

4. **Detect Conflict**
   - Click back to **"Node A"** → **"Conflicts"** tab
   - You should see conflict(s) listed

5. **View Conflict Details**
   - Conflict shows:
     - Between v1 and conflicting v2 versions
     - Type: CONCURRENT_EDIT
     - Status: Needs Resolution

6. **Choose Resolution Strategy**
   - Select dropdown: Pick strategy
   - **"Keep Both (Create Branch)"** - Recommended
     - Site A version → main branch
     - Site B version → feature/site-b branch
     - Users can merge manually later
   
   - **"Use Latest (Timestamp)"** - Automatic
     - Latest modified version wins
     - Other version discarded
   
   - **"Use Version A"** - Manual choice
   - **"Use Version B"** - Manual choice

7. **Resolve Conflict**
   - Click **"Resolve Conflict →"** button
   - ✓ System resolves with chosen strategy
   - Conflict removed from list
   - Data preserved (either as branch or favored version)

### What Happened?
- Two sites independently changed same base version
- System detected concurrent modifications
- Conflicting versions couldn't be auto-merged
- Application of resolution strategy prevented data loss

### Key Learning
✓ Conflicts occur with concurrent edits
✓ Multiple strategies handle different scenarios
✓ BRANCH strategy preserves both versions for later manual merge

---

## Scenario 4:  Storage Comparison

See how delta storage saves space vs full snapshots

### Steps

1. **Click "Demo" Tab**
   - From navbar: Click **"Demo"**
   - You see demo interface with scenario buttons

2. **Select "Storage Comparison"**
   - Click button labeled **" Storage"**
   - Watch the simulation output

3. **Read the Analysis**
   - Shows 10 versions:
     - v1 through v10
     - Each version +0.5KB modifications
   
   - **Full Snapshot Method**:
     ```
     v1: 1.0 KB
     v2: 1.05 KB
     v3: 1.10 KB
     ...
     v10: 1.45 KB
     ─────────────
     TOTAL: 11.25 KB
     ```
   
   - **Delta Storage Method**:
     ```
     v1 (snapshot): 1.0 KB
     Δ(v1→v2): 0.10 KB    (only differences!)
     Δ(v2→v3): 0.08 KB
     ...
     Δ(v9→v10): 0.09 KB
     ───────────────
     TOTAL: 1.87 KB
     ```
   
   - **Result**:  9.38 KB saved (83.4% reduction!)

4. **Advanced: Checkpointing**
   - Every 5 versions, create full snapshot
   - Prevents long delta chains
   - TOTAL: 3.2 KB (71.6% reduction)

### What Happened?
- System stored only changes (deltas) between versions
- MUCH smaller than storing all full snapshots
- Trade-off: Reconstruction takes time (must apply delta chain)

### Key Learning
✓ Delta storage dramatically reduces storage needs
✓ `delta = removed + added` (minimal size)
✓ Checkpointing balances storage vs speed

---

## Scenario 5:  Multi-Site Synchronization

Keep two distributed sites in sync

### Steps

1. **Click "Compare" Tab**
   - From navbar: Click **" Compare"**

2. **Setup Node A**
   - Left panel (Node A):
   - Click **"Upload"** section
   - Upload `cube-v1.obj` as `sync-demo`

3. **Setup Node B**
   - Right panel (Node B):
   - Click **"Upload"** section
   - Upload `cube-v1.obj` as `sync-demo`
   - Wait for upload

4. **Create Different Versions**
   - Node A: Upload `cube-v2.obj` with same ID `sync-demo`
     - Creates version 2 on Node A
   - Node B: Keep at version 1 (or upload different modification)

5. **Compare**
   - In each panel, select the versions you want to compare
   - Click "Compute Diff" to analyze differences
   - See the diff report

6. **Observe**
   - Node A: Ahead of Node B
   - Diff shows what Node B would receive if pulling updates
   - Vertices changed: 2 added in Node A

### Simulation: "Run Sync Demo"
1. Click **"Demo"** tab
2. Click **" Sync"** button
3. Watch scenario:
   - Node A: cube-model v5 (latest)
   - Node B: cube-model v3 (outdated)
   - Pull: Δ3→4 and Δ4→5 applied
   - Verify: Both now v5 with same hash
   - Sync complete! ✓

### What Happened?
- System identified version difference
- Transferred only deltas (not full snapshots)
- Applied deltas in order on Node B
- Verified both sites now have same version

### Key Learning
✓ Deltas transferred, not full models
✓ Reduced network bandwidth
✓ Content hashing verifies integrity

---

##  Advanced Demo: Complete Workflow

Run through entire feature set in 5 minutes:

### Workflow: Product Design Iteration

**Scenario**: Two engineers designing a bracket concurrently

1. **Initial Model** (Engineering Lead)
   - Node A: Upload `cube-v1.obj` as `bracket-part`
   - Creates v1: baseline design

2. **Engineer A** (Node A)
   - Modifies bracket for strength → uploads as v2

3. **Engineer B** (Node B)
   - Simultaneously modifies same base for aerodynamics
   - Uploads as v2 on Node B

4. **Conflict Detected**
   - Both created v2 from same base
   - System alerts to conflict

5. **Resolution**
   - Choose BRANCH strategy
   - Create feature/aerodynamics branch for Engineer B version
   - Main branch has Engineer A version (strength focus)

6. **Later: Manual Merge**
   - Lead engineer reviews both approaches
   - May combine best from each
   - Creates merged v3

7. **Sync**
   - Both sites pull final merged version
   - Both now have v3 with combined improvements

### Result
- ✓ No work lost
- ✓ Both approaches documented (in branches)
- ✓ Best solution preserved (in merged version)
- ✓ Both sites synchronized

---

##  Troubleshooting

### "Upload button disabled"
- Make sure Object ID is entered
- Make sure file is selected (in dashed box)

### "No versions appear in History"
- File needs to be uploaded first
- Check your Object ID matches
- Check terminal logs for errors

### "Diff shows no differences"
- Make sure you uploaded 2 different file versions
- Check "Compare" tab for cross-site comparison

### "Conflict doesn't appear"
- Ensure you created conflicting edits (different changes on same base)
- Refresh page or check both nodes

---

##  Demo Walkthrough Timeline

| Time | Activity | Expected Result |
|------|----------|-----------------|
| 0min | Open http://localhost:3000 | See homepage with intro |
| 1min | Upload cube-v1 to Node A | ✓ Version 1 created |
| 2min | Upload cube-v2 to Node A | ✓ Version 2 created |
| 3min | View history and select v1→v2 | ✓ Diff tab shows changes |
| 4min | Review diff report | ✓ See 2 vertices added |
| 5min | Run storage demo | ✓ See 83% savings |
| 6min | Run conflict demo | ✓ See resolution options |
| 7min | Run sync demo | ✓ See multi-site sync |

---

##  What You Learned

✅ How to upload and parse 3D models
✅ How to compare geometry versions
✅ How to detect and resolve conflicts
✅ How delta storage saves space (83%!)
✅ How to synchronize multiple sites
✅ Conflict resolution strategies (BRANCH vs TIMESTAMP)

---

**Next Step**: Read [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md) for detailed feature documentation

**Questions?** Check [GETTING_STARTED.md](./GETTING_STARTED.md) for troubleshooting
