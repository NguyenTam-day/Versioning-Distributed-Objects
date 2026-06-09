/**
 * Test script to demonstrate and verify conflict detection and resolution
 * between Node A (port 5000) and Node B (port 5001).
 * 
 * Scenario:
 *   1. Enable sync on both nodes.
 *   2. Upload a base version (v1) to Node A.
 *   3. Wait for v1 to sync to Node B automatically.
 *   4. Disable sync on both nodes to simulate offline/disconnected work.
 *   5. Concurrent changes:
 *      - Upload v2_A to Node A (parent: v1_A)
 *      - Upload v2_B to Node B (parent: v1_A)
 *   6. Re-enable sync on both nodes.
 *   7. Trigger manual push/sync to resolve conflict.
 *   8. Query and verify the resolved version history on both nodes.
 * 
 * Usage:
 *   node test_conflict.js
 */

const NODE_A = 'http://localhost:5000';
const NODE_B = 'http://localhost:5001';

// Helper to generate a cube OBJ version with different vertices
function generateCubeObj(version, modifier = 0) {
  const size = 16; // 16x16 = 256 vertices (smaller and faster)
  let obj = `# Terrain version ${version} modifier ${modifier}\n`;
  const vertices = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let z = Math.sin(x * 0.3) * Math.cos(y * 0.3);

      // Introduce changes based on version and modifier
      if (x === 5 && y === 5) {
        z += version * 0.2 + modifier * 0.5;
      }
      if (x === 10 && y === 10) {
        z -= version * 0.15 - modifier * 0.3;
      }

      vertices.push([x, y, z]);
      obj += `v ${x.toFixed(4)} ${y.toFixed(4)} ${z.toFixed(4)}\n`;
    }
  }

  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const v1 = y * size + x + 1;
      const v2 = v1 + 1;
      const v3 = v1 + size + 1;
      const v4 = v1 + size;
      obj += `f ${v1} ${v2} ${v3} ${v4}\n`;
    }
  }

  return obj;
}

// Perform a single multipart upload using native fetch
async function uploadVersion(nodeUrl, modelId, version, objContent, parentVersion) {
  const filename = `cube_v${version}.obj`;
  const formData = new FormData();
  formData.append('objectId', modelId);
  formData.append('file', new Blob([objContent], { type: 'text/plain' }), filename);
  if (parentVersion) {
    formData.append('parentVersion', parentVersion);
  }
  formData.append('branchName', 'main');

  const response = await fetch(`${nodeUrl}/api/geometry/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload to ${nodeUrl} failed (HTTP ${response.status}): ${text}`);
  }

  return await response.json();
}

// Control sync status
async function setSyncStatus(nodeUrl, enable) {
  const endpoint = enable ? '/api/sync/enable' : '/api/sync/disable';
  const response = await fetch(`${nodeUrl}${endpoint}`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Failed to set sync status to ${enable} on ${nodeUrl}`);
  }
  return await response.json();
}

// Get history
async function getHistory(nodeUrl, modelId) {
  const response = await fetch(`${nodeUrl}/api/version/${modelId}/history`);
  if (!response.ok) {
    throw new Error(`Failed to get history from ${nodeUrl}`);
  }
  const result = await response.json();
  return result.data;
}

// Trigger manual push
async function triggerPush(sourceNodeUrl, modelId, targetNodeUrl) {
  const response = await fetch(`${sourceNodeUrl}/api/sync/trigger-push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelId: modelId,
      targetNode: targetNodeUrl
    })
  });
  if (!response.ok) {
    throw new Error(`Failed to trigger push from ${sourceNodeUrl} to ${targetNodeUrl}`);
  }
  return response;
}

// Helper to delay execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate client checkout/download to get the latest parent version name
async function checkoutLatestVersion(nodeUrl, modelId, branchName = 'main') {
  const response = await fetch(`${nodeUrl}/api/version/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelId, branchName })
  });
  if (!response.ok) {
    throw new Error(`Checkout from ${nodeUrl} failed (HTTP ${response.status})`);
  }
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(`Checkout from ${nodeUrl} returned unsuccessful: ${result.message}`);
  }
  return result.data.versionName;
}

async function main() {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const modelId = `conflict-demo-${randomSuffix}`;

  console.log('========================================================');
  console.log(`🚀 STARTING DISTRIBUTED CONFLICT & RESOLUTION TEST`);
  console.log(`📦 Model ID: \x1b[36m${modelId}\x1b[0m`);
  console.log('========================================================\n');

  // 1. Check connections
  console.log('📡 Checking backend nodes status...');
  try {
    await fetch(`${NODE_A}/api/sync/status`);
    console.log(`   🟢 Node A (port 5000) is online.`);
  } catch (err) {
    console.error(`   🔴 Node A (http://localhost:5000) is not responding.`);
    console.error(`      Please run Node A: cd node_a && mvn spring-boot:run`);
    process.exit(1);
  }

  try {
    await fetch(`${NODE_B}/api/sync/status`);
    console.log(`   🟢 Node B (port 5001) is online.`);
  } catch (err) {
    console.error(`   🔴 Node B (http://localhost:5001) is not responding.`);
    console.error(`      Please run Node B: cd node_b && mvn spring-boot:run`);
    process.exit(1);
  }

  try {
    // 2. Enable sync on both nodes first
    console.log('\n⚙️ Step 1: Enabling synchronization on both nodes to setup base state...');
    await setSyncStatus(NODE_A, true);
    await setSyncStatus(NODE_B, true);
    console.log('   ✅ Sync enabled.');

    // 3. Upload base version V1 to Node A
    console.log('\n📦 Step 2: Uploading Base Version (v1) to Node A...');
    const objV1 = generateCubeObj(1, 0);
    const resultV1 = await uploadVersion(NODE_A, modelId, 1, objV1, null);
    console.log(`   ✅ Success! Created: \x1b[35mv1_A\x1b[0m on Node A.`);

    // 4. Wait for v1 to sync to Node B
    console.log('\n⏳ Step 3: Waiting for Base Version (v1) to sync to Node B...');
    let synced = false;
    let attempts = 0;
    while (!synced && attempts < 10) {
      attempts++;
      try {
        const historyB = await getHistory(NODE_B, modelId);
        if (historyB && historyB.some(v => v.versionName === 'v1_A')) {
          synced = true;
          console.log(`   ✅ Success! \x1b[35mv1_A\x1b[0m is now synced to Node B.`);
          break;
        }
      } catch (e) {
        // Ignored
      }
      await sleep(1000);
    }

    if (!synced) {
      console.error('   ❌ Timeout waiting for base version to sync to Node B.');
      process.exit(1);
    }

    // 5. Disable sync to simulate offline work
    console.log('\n⚙️ Step 4: Disabling synchronization on both nodes (Simulating network split)...');
    await setSyncStatus(NODE_A, false);
    await setSyncStatus(NODE_B, false);
    console.log('   ✅ Sync disabled. Nodes A and B are now isolated.');

    // 6. Concurrent updates
    // Node A uploads v2_A
    console.log('\n✏️ Step 5a: Node A edits model and uploads new version (v2) locally...');
    const parentVersionA = await checkoutLatestVersion(NODE_A, modelId, 'main');
    console.log(`   [Node A Checkout] Determined parent (base) version: \x1b[35m${parentVersionA}\x1b[0m`);
    const objV2_A = generateCubeObj(2, 10); // modifier 10
    await uploadVersion(NODE_A, modelId, 2, objV2_A, parentVersionA);
    console.log(`   ✅ Node A saved version: \x1b[33mv2_A\x1b[0m (branch: \x1b[36mmain\x1b[0m, parent: \x1b[35m${parentVersionA}\x1b[0m)`);

    // Node B uploads v2_B
    console.log('✏️ Step 5b: Node B concurrently edits same model and uploads version (v2) locally...');
    // We add a short delay to simulate slightly later timestamp for Node B's version
    await sleep(2000);
    const parentVersionB = await checkoutLatestVersion(NODE_B, modelId, 'main');
    console.log(`   [Node B Checkout] Determined parent (base) version: \x1b[35m${parentVersionB}\x1b[0m`);
    const objV2_B = generateCubeObj(2, 20); // modifier 20
    await uploadVersion(NODE_B, modelId, 2, objV2_B, parentVersionB);
    console.log(`   ✅ Node B saved version: \x1b[33mv2_B\x1b[0m (branch: \x1b[36mmain\x1b[0m, parent: \x1b[35m${parentVersionB}\x1b[0m)`);
    console.log(`      Both nodes have concurrently created version 2 from parent \x1b[35m${parentVersionA}\x1b[0m!`);

    // Verify local histories before sync
    console.log('\n🔍 Local status before sync reconnect:');
    const historyPreA = await getHistory(NODE_A, modelId);
    console.log(`   Node A versions: [${historyPreA.map(v => `${v.versionName}(${v.branchName}, status:${v.syncStatus})`).join(', ')}]`);
    const historyPreB = await getHistory(NODE_B, modelId);
    console.log(`   Node B versions: [${historyPreB.map(v => `${v.versionName}(${v.branchName}, status:${v.syncStatus})`).join(', ')}]`);

    // 7. Enable sync to simulate reconnection
    console.log('\n⚙️ Step 6: Re-enabling synchronization (Reconnecting network)...');
    await setSyncStatus(NODE_A, true);
    await setSyncStatus(NODE_B, true);
    console.log('   ✅ Sync re-enabled.');

    // 8. Trigger sync manually from Node A to Node B to resolve conflict immediately
    console.log('\n🔄 Step 7: Triggering manual sync from Node A to Node B to resolve conflict...');
    await triggerPush(NODE_A, modelId, NODE_B);
    console.log('   ✅ Sync triggered. Performing conflict resolution via First-Writer-Wins consensus.');

    // Wait for resolution to settle
    await sleep(2000);

    // 9. Fetch and display final histories
    console.log('\n🔍 Step 8: Fetching final histories to verify resolution...');

    const finalHistoryA = await getHistory(NODE_A, modelId);
    const finalHistoryB = await getHistory(NODE_B, modelId);

    console.log('\n========================================================');
    console.log('📊 FINAL RESOLUTION RESULTS');
    console.log('========================================================');

    console.log(`\n📐 Node A (http://localhost:5000) History:`);
    finalHistoryA.forEach(v => {
      const isWinner = v.branchName === 'main';
      const branchColor = isWinner ? '\x1b[32m' : '\x1b[31m';
      console.log(`   - \x1b[1m${v.versionName}\x1b[0m (Parent: ${v.parentVersion || 'none'})`);
      console.log(`     Branch: ${branchColor}${v.branchName}\x1b[0m | Sync Status: \x1b[36m${v.syncStatus}\x1b[0m`);
      console.log(`     Timestamp: ${v.timestamp} | Site: ${v.siteId}`);
    });

    console.log(`\n📐 Node B (http://localhost:5001) History:`);
    finalHistoryB.forEach(v => {
      const isWinner = v.branchName === 'main';
      const branchColor = isWinner ? '\x1b[32m' : '\x1b[31m';
      console.log(`   - \x1b[1m${v.versionName}\x1b[0m (Parent: ${v.parentVersion || 'none'})`);
      console.log(`     Branch: ${branchColor}${v.branchName}\x1b[0m | Sync Status: \x1b[36m${v.syncStatus}\x1b[0m`);
      console.log(`     Timestamp: ${v.timestamp} | Site: ${v.siteId}`);
    });

    // 10. Audit verification
    console.log('\n========================================================');
    console.log('🕵️‍♂️ CONSISTENCY AUDIT VERIFICATION');
    console.log('========================================================');

    const countA = finalHistoryA.length;
    const countB = finalHistoryB.length;

    if (countA !== countB) {
      console.log('   ❌ FAILED: Node A and Node B have different number of versions.');
      process.exit(1);
    }

    const versionNamesA = finalHistoryA.map(v => v.versionName).sort();
    const versionNamesB = finalHistoryB.map(v => v.versionName).sort();
    const matches = versionNamesA.every((val, index) => val === versionNamesB[index]);

    if (!matches) {
      console.log('   ❌ FAILED: Node A and Node B do not contain the same versions.');
      console.log(`      Node A: ${versionNamesA.join(', ')}`);
      console.log(`      Node B: ${versionNamesB.join(', ')}`);
      process.exit(1);
    }

    console.log('   ✅ Match check: Node A and Node B have identical version sets.');

    // Identify winner & loser
    const winnerA = finalHistoryA.find(v => v.versionNumber === 2 && v.branchName === 'main');
    const loserA = finalHistoryA.find(v => v.versionNumber === 2 && v.branchName.startsWith('conflict/'));

    const winnerB = finalHistoryB.find(v => v.versionNumber === 2 && v.branchName === 'main');
    const loserB = finalHistoryB.find(v => v.versionNumber === 2 && v.branchName.startsWith('conflict/'));

    if (winnerA && winnerB && winnerA.versionName === winnerB.versionName) {
      console.log(`   ✅ Consensus check: Both nodes agree on the WINNER: \x1b[32m${winnerA.versionName}\x1b[0m on branch main`);
    } else {
      console.log('   ❌ FAILED: Nodes disagree on the winner, or winner was not resolved.');
      process.exit(1);
    }

    if (loserA && loserB && loserA.versionName === loserB.versionName) {
      console.log(`   ✅ Consensus check: Both nodes agree on the LOSER: \x1b[31m${loserA.versionName}\x1b[0m moved to branch \x1b[36m${loserA.branchName}\x1b[0m`);
    } else {
      console.log('   ❌ FAILED: Nodes disagree on the loser, or loser was not moved to conflict branch.');
      process.exit(1);
    }

    console.log('\n🎉 CONFLICT DETECTION AND RESOLUTION DEMO PASSED SUCCESSFULLY!');
    console.log('========================================================');
    console.log(`🚀 STARTING DISTRIBUTED CONFLICT & RESOLUTION TEST`);
    console.log(`📦 Model ID: \x1b[36m${modelId}\x1b[0m`);
    console.log('========================================================\n');


  } catch (error) {
    console.error('\n💥 Test error:', error);
    process.exit(1);
  }
}

main();