import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';

/**
 * ModelViewer3D - Babylon.js based 3D CAD Model Viewer
 * 
 * Props:
 *   geometry: {objects: [...]} - Structured geometry JSON
 *   cameraMode: 'orbit' | 'free' - Camera mode
 *   showGrid: boolean - Show ground grid
 *   showAxis: boolean - Show coordinate axes
 */
const ModelViewer3D = ({ 
  geometry, 
  cameraMode = 'orbit',
  showGrid = true,
  showAxis = true,
  width = '100%',
  height = '600px',
  backgroundColor = new BABYLON.Color3(0.1, 0.1, 0.15)
}) => {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const meshesRef = useRef([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current || !geometry) return;

    initializeBabylon();
    
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current && geometry) {
      clearMeshes();
      loadGeometry(geometry);
    }
  }, [geometry]);

  const initializeBabylon = () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create Babylon.js engine
      const engine = new BABYLON.Engine(
        containerRef.current, 
        true, 
        { 
          antialias: true,
          alpha: true
        }
      );
      engineRef.current = engine;

      // Create scene
      const scene = new BABYLON.Scene(engine);
      scene.clearColor = backgroundColor;
      sceneRef.current = scene;

      // Setup lighting
      setupLighting(scene);

      // Setup camera
      setupCamera(scene);

      // Add environment
      if (showGrid) setupGrid(scene);
      if (showAxis) setupAxis(scene);

      // Render loop
      engine.runRenderLoop(() => {
        scene.render();
      });

      // Handle window resize
      window.addEventListener('resize', () => {
        engine.resize();
      });

      setIsLoading(false);
    } catch (err) {
      setError(`Failed to initialize 3D viewer: ${err.message}`);
      setIsLoading(false);
    }
  };

  const setupLighting = (scene) => {
    // Ambient light
    const ambientLight = new BABYLON.HemisphericLight(
      'ambientLight',
      new BABYLON.Vector3(1, 1, 1),
      scene
    );
    ambientLight.intensity = 0.6;

    // Point light 1
    const light1 = new BABYLON.PointLight(
      'pointLight1',
      new BABYLON.Vector3(10, 10, 10),
      scene
    );
    light1.intensity = 0.8;
    light1.range = 100;

    // Point light 2
    const light2 = new BABYLON.PointLight(
      'pointLight2',
      new BABYLON.Vector3(-10, 5, -10),
      scene
    );
    light2.intensity = 0.5;
    light2.range = 100;
  };

  const setupCamera = (scene) => {
    if (cameraMode === 'orbit') {
      // Orbit camera
      const camera = new BABYLON.ArcRotateCamera(
        'camera',
        Math.PI / 2,
        Math.PI / 3,
        15,
        new BABYLON.Vector3(0, 0, 0),
        scene
      );
      camera.attachControl(containerRef.current, true);
      camera.wheelPrecision = 50;
      camera.inertia = 0.9;
      cameraRef.current = camera;
    } else {
      // Free camera
      const camera = new BABYLON.UniversalCamera(
        'camera',
        new BABYLON.Vector3(0, 5, 15),
        scene
      );
      camera.attachControl(containerRef.current, true);
      camera.keysUp = ['w', 'W', 'ArrowUp'];
      camera.keysDown = ['s', 'S', 'ArrowDown'];
      camera.keysLeft = ['a', 'A', 'ArrowLeft'];
      camera.keysRight = ['d', 'D', 'ArrowRight'];
      cameraRef.current = camera;
    }
  };

  const setupGrid = (scene) => {
    const grid = BABYLON.MeshBuilder.CreateGround(
      'grid',
      { width: 50, height: 50, subdivisions: 25 },
      scene
    );
    
    const gridMaterial = new BABYLON.StandardMaterial('gridMat', scene);
    gridMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.35);
    grid.material = gridMaterial;
    grid.position.y = -10;
  };

  const setupAxis = (scene) => {
    const axisLength = 15;
    
    // X-axis (red)
    const xAxis = BABYLON.MeshBuilder.CreateTube(
      'xAxis',
      { path: [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(axisLength, 0, 0)], radius: 0.1 },
      scene
    );
    const xMat = new BABYLON.StandardMaterial('xMat', scene);
    xMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
    xAxis.material = xMat;

    // Y-axis (green)
    const yAxis = BABYLON.MeshBuilder.CreateTube(
      'yAxis',
      { path: [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, axisLength, 0)], radius: 0.1 },
      scene
    );
    const yMat = new BABYLON.StandardMaterial('yMat', scene);
    yMat.emissiveColor = new BABYLON.Color3(0, 1, 0);
    yAxis.material = yMat;

    // Z-axis (blue)
    const zAxis = BABYLON.MeshBuilder.CreateTube(
      'zAxis',
      { path: [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, axisLength)], radius: 0.1 },
      scene
    );
    const zMat = new BABYLON.StandardMaterial('zMat', scene);
    zMat.emissiveColor = new BABYLON.Color3(0, 0, 1);
    zAxis.material = zMat;
  };

  const clearMeshes = () => {
    meshesRef.current.forEach(mesh => mesh.dispose());
    meshesRef.current = [];
  };

  const loadGeometry = (geom) => {
    if (!sceneRef.current || !geom.objects) return;

    try {
      geom.objects.forEach((obj, index) => {
        const mesh = createMeshFromObject(obj, sceneRef.current);
        if (mesh) {
          meshesRef.current.push(mesh);
        }
      });

      // Auto-fit camera to all objects
      if (cameraRef.current && meshesRef.current.length > 0) {
        fitCameraToObjects();
      }
    } catch (err) {
      setError(`Failed to load geometry: ${err.message}`);
    }
  };

  const createMeshFromObject = (obj, scene) => {
    try {
      let mesh;

      switch (obj.type) {
        case 'sphere':
          mesh = BABYLON.MeshBuilder.CreateSphere(
            `sphere_${obj.id}`,
            { diameter: obj.diameter || 2, segments: 32 },
            scene
          );
          break;

        case 'box':
          mesh = BABYLON.MeshBuilder.CreateBox(
            `box_${obj.id}`,
            { size: obj.size || 1 },
            scene
          );
          break;

        case 'cylinder':
          mesh = BABYLON.MeshBuilder.CreateCylinder(
            `cylinder_${obj.id}`,
            { 
              height: obj.height || 2, 
              diameterTop: obj.diameterTop || 1,
              diameterBottom: obj.diameterBottom || 1,
              tessellation: 32
            },
            scene
          );
          break;

        case 'torus':
          mesh = BABYLON.MeshBuilder.CreateTorus(
            `torus_${obj.id}`,
            { diameter: obj.diameter || 2, thickness: obj.thickness || 0.5 },
            scene
          );
          break;

        case 'cone':
          mesh = BABYLON.MeshBuilder.CreateCone(
            `cone_${obj.id}`,
            { 
              diameter: obj.diameter || 2, 
              height: obj.height || 2,
              tessellation: 32
            },
            scene
          );
          break;

        case 'mesh':
          // Custom mesh from vertices and indices
          if (obj.vertices && obj.faces) {
            mesh = createMeshFromVertices(obj, scene);
          }
          break;

        default:
          return null;
      }

      if (mesh) {
        // Apply position
        if (obj.position) {
          mesh.position = new BABYLON.Vector3(
            obj.position.x || 0,
            obj.position.y || 0,
            obj.position.z || 0
          );
        }

        // Apply rotation
        if (obj.rotation) {
          mesh.rotation = new BABYLON.Vector3(
            obj.rotation.x || 0,
            obj.rotation.y || 0,
            obj.rotation.z || 0
          );
        }

        // Apply scale
        if (obj.scale) {
          mesh.scaling = new BABYLON.Vector3(
            obj.scale.x || 1,
            obj.scale.y || 1,
            obj.scale.z || 1
          );
        }

        // Create material
        const material = new BABYLON.StandardMaterial(
          `mat_${obj.id}`,
          scene
        );
        material.diffuse = new BABYLON.Color3(0.8, 0.8, 0.8);
        material.specularColor = new BABYLON.Color3(1, 1, 1);
        material.specularPower = 32;
        material.wireframe = false;

        // Apply color if specified
        if (obj.color) {
          material.diffuse = new BABYLON.Color3(
            (obj.color.r || 128) / 255,
            (obj.color.g || 128) / 255,
            (obj.color.b || 128) / 255
          );
        }

        mesh.material = material;

        // Add metadata for picking
        mesh.metadata = {
          id: obj.id,
          type: obj.type,
          original: obj
        };

        return mesh;
      }

      return null;
    } catch (err) {
      console.error(`Failed to create mesh for ${obj.id}:`, err);
      return null;
    }
  };

  const createMeshFromVertices = (obj, scene) => {
    const vertexData = new BABYLON.VertexData();

    // Convert vertices to positions array
    const positions = [];
    obj.vertices.forEach(v => {
      positions.push(v.x || 0, v.y || 0, v.z || 0);
    });

    // Convert faces to indices
    const indices = [];
    obj.faces.forEach(face => {
      if (face.length >= 3) {
        // Triangulate face
        for (let i = 1; i < face.length - 1; i++) {
          indices.push(face[0], face[i], face[i + 1]);
        }
      }
    });

    vertexData.positions = positions;
    vertexData.indices = indices;

    // Compute normals
    BABYLON.VertexData.ComputeNormals(positions, indices, vertexData.normals);

    const mesh = new BABYLON.Mesh(`mesh_${obj.id}`, scene);
    vertexData.applyToMesh(mesh);

    return mesh;
  };

  const fitCameraToObjects = () => {
    if (!cameraRef.current || !meshesRef.current.length) return;

    const camera = cameraRef.current;
    const meshes = meshesRef.current;

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    meshes.forEach(mesh => {
      const bb = mesh.getBoundingInfo().boundingBox;
      minX = Math.min(minX, bb.minimumWorld.x);
      minY = Math.min(minY, bb.minimumWorld.y);
      minZ = Math.min(minZ, bb.minimumWorld.z);
      maxX = Math.max(maxX, bb.maximumWorld.x);
      maxY = Math.max(maxY, bb.maximumWorld.y);
      maxZ = Math.max(maxZ, bb.maximumWorld.z);
    });

    const center = new BABYLON.Vector3(
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2
    );

    const size = Math.max(
      maxX - minX,
      maxY - minY,
      maxZ - minZ
    );

    if (camera instanceof BABYLON.ArcRotateCamera) {
      camera.target = center;
      camera.radius = size * 2;
    } else if (camera instanceof BABYLON.UniversalCamera) {
      camera.position = new BABYLON.Vector3(
        center.x + size,
        center.y + size * 0.5,
        center.z + size
      );
      camera.setTarget(center);
    }
  };

  const exportAsOBJ = () => {
    if (!meshesRef.current.length) return;

    let objContent = '# Exported CAD Model\n\n';
    let vertexOffset = 0;

    meshesRef.current.forEach(mesh => {
      const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
      const indices = mesh.getIndices();

      if (!positions || !indices) return;

      // Write vertices
      for (let i = 0; i < positions.length; i += 3) {
        objContent += `v ${positions[i]} ${positions[i + 1]} ${positions[i + 2]}\n`;
      }

      // Write faces
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i] + vertexOffset + 1;
        const b = indices[i + 1] + vertexOffset + 1;
        const c = indices[i + 2] + vertexOffset + 1;
        objContent += `f ${a} ${b} ${c}\n`;
      }

      vertexOffset += positions.length / 3;
    });

    downloadFile(objContent, 'model.obj', 'text/plain');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width, height, position: 'relative' }}>
      {error && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: '#ff6b6b',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 100,
          fontSize: '12px'
        }}>
          {error}
        </div>
      )}

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100
        }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading 3D Scene...</div>
        </div>
      )}

      <canvas
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />

      <div style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        zIndex: 50
      }}>
        <button
          onClick={exportAsOBJ}
          style={{
            padding: '8px 12px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Export OBJ
        </button>
      </div>
    </div>
  );
};

export default ModelViewer3D;
