/**
 * Test script to upload 10 OBJ files sequentially to Node A.
 * Demonstrates the Snapshot/Delta cycle:
 *   - v1 (Snapshot)
 *   - v2 - v5 (Deltas)
 *   - v6 (Snapshot)
 *   - v7 - v10 (Deltas)
 * 
 * Usage:
 *   node test_upload.js [modelId]
 * 
 * If no modelId is provided, a unique one (e.g., demo-cube-XXX) is generated.
 */

const http = require('http');

// Helper to generate cumulative cube OBJ versions
function generateCubeObj(version) {

  const size = 32; // 32x32 = 1024 vertices

  let obj = `# Terrain version ${version}\n`;

  const vertices = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {

      let z = Math.sin(x * 0.2) * Math.cos(y * 0.2);

      // mỗi version sửa 1 vertex
      const changedIndex = (version - 1) % (size * size);

      if (vertices.length === changedIndex) {
        z += version * 0.1;
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

// Perform a single multipart upload using native fetch (Node 18+)
async function uploadVersion(modelId, version, objContent, parentVersion) {
  const filename = `cube_v${version}.obj`;

  // Create a multipart Form Data
  const formData = new FormData();
  formData.append('objectId', modelId);
  formData.append('file', new Blob([objContent], { type: 'text/plain' }), filename);
  if (parentVersion) {
    formData.append('parentVersion', parentVersion);
  }
  formData.append('branchName', 'main');

  const url = 'http://localhost:5000/api/geometry/upload';
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed (HTTP ${response.status}): ${text}`);
  }

  return await response.json();
}

async function main() {
  const args = process.argv.slice(2);
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const modelId = args[0] || `demo-cube-${randomSuffix}`;

  console.log('========================================================');
  console.log(`🚀 Starting Demo Upload Sequence for Model ID: \x1b[36m${modelId}\x1b[0m`);
  console.log(`📡 Target Node: Node A (http://localhost:5000)`);
  console.log('========================================================\n');

  // Check if Node A is running
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000);
    await fetch('http://localhost:5000/api/geometry/upload', { method: 'GET', signal: controller.signal }).catch(() => { });
    clearTimeout(id);
  } catch (err) {
    console.error('\x1b[31mError: Node A (http://localhost:5000) is not responding.\x1b[0m');
    console.error('Please make sure the Node A backend service is running using:');
    console.log('  cd node_a && mvn spring-boot:run\n');
    process.exit(1);
  }

  let parentVersion = null;

  for (let version = 1; version <= 10; version++) {
    const isSnapshot = (version % 5 === 1);
    const typeLabel = isSnapshot ? '\x1b[34m[Snapshot]\x1b[0m' : '\x1b[32m[Delta]\x1b[0m';

    console.log(`📦 Generating v${version} ${typeLabel}...`);
    const objContent = generateCubeObj(version);

    try {
      const result = await uploadVersion(modelId, version, objContent, parentVersion);

      // Compute the versionName constructed by backend
      const currentVersionName = `v${version}_A`;
      console.log(`   ✅ Success! Created: \x1b[35m${currentVersionName}\x1b[0m`);
      console.log(`      Vertices: ${result.vertexCount} | Faces: ${result.faceCount}`);

      // Update parent for next version
      parentVersion = result.versionId;

      // Pause slightly for a realistic sequence
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`   ❌ Failed to upload v${version}:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n========================================================');
  console.log('🎉 DEMO UPLOAD SEQUENCE COMPLETED SUCCESSFULLY!');
  console.log('========================================================');
  console.log(`\nTo view this demo in the UI:`);
  console.log(`1. Open your web browser at: \x1b[4mhttp://localhost:3000\x1b[0m`);
  console.log(`2. Navigate to the \x1b[1mDemo Page\x1b[0m`);
  console.log(`3. Copy & paste the following Model ID into any of the panels:`);
  console.log(`\n   👉   \x1b[1;36m${modelId}\x1b[0m   👈\n`);
  console.log('Each panel (View Version Chain, Restore, Benchmark, Show Delta) is now ready to demonstrate the algorithms!');
  console.log('========================================================');
}

main();
