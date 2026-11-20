// Export the rig as a .glb file — the binary glTF format other 3D tools open.
//
// The vendored three.js build here has no exporter add-on, and adding one means
// matching its exact revision, so this writes the format directly. It covers
// what the rig actually uses: meshes with positions, normals, indices and
// standard materials, plus per-node transforms. Lights, sprites and the studio
// environment are left out, because they are scene furniture, not the model.
//
// Format reference: glTF 2.0 binary container (GLB), 12-byte header, then a
// JSON chunk and a BIN chunk, each padded to a four-byte boundary.

const GLB_MAGIC = 0x46546c67; // 'glTF'
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;
const FLOAT = 5126;
const UNSIGNED_SHORT = 5123;
const UNSIGNED_INT = 5125;
const ARRAY_BUFFER = 34962;
const ELEMENT_ARRAY_BUFFER = 34963;

/**
 * Write a scene graph out as glTF binary.
 *
 * @param {object} root The group to export.
 * @param {object} THREE The three.js module the scene was built with.
 * @param {object} [settings]
 * @param {string} [settings.name] Name written into the file's asset record.
 * @param {number} [settings.maxInstances] Cap per instanced mesh (default 500).
 * @returns {ArrayBuffer} The .glb bytes.
 */
export function buildGLB(root, THREE, settings = {}) {
  const maxInstances = settings.maxInstances ?? 500;
  const bin = [];
  let offset = 0;

  const json = {
    asset: {
      version: '2.0',
      generator: settings.name ? `PC Build Studio — ${settings.name}` : 'PC Build Studio',
    },
    scenes: [{ nodes: [] }],
    scene: 0,
    nodes: [],
    meshes: [],
    materials: [],
    accessors: [],
    bufferViews: [],
    buffers: [],
  };

  const materialIndex = new Map();

  /** Copy one typed array into the binary buffer and return an accessor. */
  function addAccessor(array, componentType, type, extra = {}) {
    // Every buffer view has to start and end on a four-byte boundary.
    const padded = array.byteLength + ((4 - (array.byteLength % 4)) % 4);
    bin.push(new Uint8Array(array.buffer, array.byteOffset, array.byteLength));
    if (padded !== array.byteLength) bin.push(new Uint8Array(padded - array.byteLength));
    const view = {
      buffer: 0,
      byteOffset: offset,
      byteLength: array.byteLength,
    };
    if (type !== 'SCALAR') view.target = extra.target ?? ARRAY_BUFFER;
    json.bufferViews.push(view);
    const accessor = {
      bufferView: json.bufferViews.length - 1,
      componentType,
      count: array.length / (type === 'SCALAR' ? 1 : type === 'VEC3' ? 3 : 16),
      type,
    };
    if (extra.min) accessor.min = extra.min;
    if (extra.max) accessor.max = extra.max;
    json.accessors.push(accessor);
    offset += padded;
    return json.accessors.length - 1;
  }

  function addMaterial(material) {
    if (!material || material.type === 'SpriteMaterial') return undefined;
    if (materialIndex.has(material.uuid)) return materialIndex.get(material.uuid);
    const record = {
      name: material.name || 'material',
      pbrMetallicRoughness: {
        baseColorFactor: [material.color?.r ?? 0.8, material.color?.g ?? 0.8, material.color?.b ?? 0.8, material.opacity ?? 1],
        metallicFactor: material.metalness ?? 0,
        roughnessFactor: material.roughness ?? 1,
      },
    };
    if (material.emissive && material.emissiveIntensity > 0.001) {
      const k = Math.min(material.emissiveIntensity, 1);
      record.emissiveFactor = [
        material.emissive.r * k,
        material.emissive.g * k,
        material.emissive.b * k,
      ];
    }
    if ((material.opacity ?? 1) < 0.999 || material.transparent) {
      record.alphaMode = 'BLEND';
      record.doubleSided = true;
    }
    json.materials.push(record);
    materialIndex.set(material.uuid, json.materials.length - 1);
    return json.materials.length - 1;
  }

  /** One geometry becomes one glTF mesh, shared by every node that uses it. */
  const meshIndex = new Map();

  function addMesh(geometry, material) {
    if (!geometry?.attributes?.position) return null;
    const key = `${geometry.uuid}:${material?.uuid || '-'}`;
    if (meshIndex.has(key)) return meshIndex.get(key);
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    const index = geometry.getIndex();
    // Skinned and instanced extras do not exist in this rig, so a plain
    // triangle list is all the exporter has to describe.
    const vertices = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i += 1) {
      vertices[i * 3] = position.getX(i);
      vertices[i * 3 + 1] = position.getY(i);
      vertices[i * 3 + 2] = position.getZ(i);
    }
    // glTF wants the bounding box written out; readers use it for culling.
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < vertices.length; i += 3) {
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], vertices[i + axis]);
        max[axis] = Math.max(max[axis], vertices[i + axis]);
      }
    }
    const attributes = { POSITION: addAccessor(vertices, FLOAT, 'VEC3', { min, max }) };
    if (normal) {
      const normals = new Float32Array(normal.count * 3);
      for (let i = 0; i < normal.count; i += 1) {
        normals[i * 3] = normal.getX(i);
        normals[i * 3 + 1] = normal.getY(i);
        normals[i * 3 + 2] = normal.getZ(i);
      }
      attributes.NORMAL = addAccessor(normals, FLOAT, 'VEC3');
    }
    const primitive = { attributes, mode: 4 };
    if (index) {
      // Small meshes stay in 16-bit indices; big ones need the 32-bit form.
      const wide = position.count > 65535;
      const indices = wide ? new Uint32Array(index.count) : new Uint16Array(index.count);
      for (let i = 0; i < index.count; i += 1) indices[i] = index.getX(i);
      primitive.indices = addAccessor(indices, wide ? UNSIGNED_INT : UNSIGNED_SHORT, 'SCALAR', {
        target: ELEMENT_ARRAY_BUFFER,
      });
    }
    const materialRef = addMaterial(material);
    if (materialRef !== undefined) primitive.material = materialRef;
    json.meshes.push({ name: geometry.name || 'mesh', primitives: [primitive] });
    meshIndex.set(key, json.meshes.length - 1);
    return json.meshes.length - 1;
  }

  const matrix = new THREE.Matrix4();
  let instancedTotal = 0;

  function addNode(object, parentIndex) {
    if (!object.visible) return;
    let nodeIndex = null;
    if (object.isMesh && !object.isSprite) {
      const mesh = addMesh(object.geometry, object.material);
      if (mesh !== null) {
        object.updateWorldMatrix(true, false);
        matrix.copy(object.matrixWorld);
        nodeIndex = json.nodes.length;
        json.nodes.push({
          name: object.name || object.userData?.partId || 'mesh',
          mesh,
          matrix: matrix.elements.slice(),
        });
      }
    } else if (object.isInstancedMesh && instancedTotal < maxInstances) {
      // Instanced meshes (screws, vents) become one shared mesh with several
      // nodes, which is how glTF represents the same thing.
      const mesh = addMesh(object.geometry, object.material);
      if (mesh !== null) {
        object.updateWorldMatrix(true, true);
        const instance = new THREE.Matrix4();
        for (let i = 0; i < object.count && instancedTotal < maxInstances; i += 1) {
          object.getMatrixAt(i, instance);
          const combined = new THREE.Matrix4().multiplyMatrices(object.matrixWorld, instance);
          json.nodes.push({
            name: `${object.name || 'instances'}_${i}`,
            mesh,
            matrix: combined.elements.slice(),
          });
          instancedTotal += 1;
        }
      }
    }
    if (nodeIndex === null) {
      // A group or a plain object: its point is to carry children, so it does
      // not need a node of its own — the children are added to this parent.
      for (const child of object.children) addNode(child, parentIndex);
      return;
    }
    if (parentIndex === null) json.scenes[0].nodes.push(nodeIndex);
    else json.nodes[parentIndex].children = (json.nodes[parentIndex].children || []).concat(nodeIndex);
    for (const child of object.children) addNode(child, nodeIndex);
  }

  root.updateWorldMatrix(true, true);
  for (const child of root.children) addNode(child, null);

  // The binary chunk is written first so its length is known.
  const binBytes = new Uint8Array(offset);
  let cursor = 0;
  for (const part of bin) {
    binBytes.set(part, cursor);
    cursor += part.length;
  }
  json.buffers.push({ byteLength: offset });

  const jsonText = JSON.stringify(json);
  const jsonBytes = new TextEncoder().encode(jsonText);
  const jsonPadded = (jsonBytes.length + 3) & ~3;
  const binPadded = (binBytes.length + 3) & ~3;
  const total = 12 + 8 + jsonPadded + (binBytes.length ? 8 + binPadded : 0);

  const out = new ArrayBuffer(total);
  const view = new DataView(out);
  const bytes = new Uint8Array(out);
  let at = 0;
  view.setUint32(at, GLB_MAGIC, true); at += 4;
  view.setUint32(at, 2, true); at += 4;
  view.setUint32(at, total, true); at += 4;
  view.setUint32(at, jsonPadded, true); at += 4;
  view.setUint32(at, CHUNK_JSON, true); at += 4;
  bytes.set(jsonBytes, at);
  at += jsonPadded;
  if (binBytes.length) {
    view.setUint32(at, binPadded, true); at += 4;
    view.setUint32(at, CHUNK_BIN, true); at += 4;
    bytes.set(binBytes, at);
  }
  return out;
}

/** Read back the JSON chunk of a GLB, for tests and for a quick sanity check. */
export function readGLBJSON(buffer) {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== GLB_MAGIC) throw new Error('not a GLB file');
  const length = view.getUint32(8, true);
  const jsonLength = view.getUint32(12, true);
  const text = new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength));
  return { length, json: JSON.parse(text) };
}
