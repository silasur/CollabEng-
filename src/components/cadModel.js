import * as THREE from 'three'
import occtScriptUrl from 'occt-import-js/dist/occt-import-js.js?url'
import occtWasmUrl from 'occt-import-js/dist/occt-import-js.wasm?url'

const maxVertices = 2_000_000

// Run the STEP/IGES parser in a worker so it can be stopped when the preview closes.
function readOcct(file, signal) {
  return new Promise((resolve, reject) => {
    let worker
    let timer
    let blobUrl
    const abort = () => finish(new DOMException('Preview closed', 'AbortError'))
    function finish(error, result) {
      clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      worker?.terminate()
      if (blobUrl) URL.revokeObjectURL(blobUrl)
      if (error) reject(error)
      else resolve(result)
    }
    if (signal.aborted) { reject(new DOMException('Preview closed', 'AbortError')); return }
    const code = `self.onmessage = async ({data}) => {
      try {
        importScripts(data.scriptUrl);
        const reader = await self.occtimportjs({locateFile: () => data.wasmUrl});
        const method = data.iges ? 'ReadIgesFile' : 'ReadStepFile';
        const result = reader[method](new Uint8Array(data.buffer), {
          linearUnit: 'millimeter', linearDeflectionType: 'bounding_box_ratio',
          linearDeflection: 0.005, angularDeflection: 0.5
        });
        if (!result.success || !result.meshes?.length) throw new Error('No displayable geometry found in this CAD file.');
        self.postMessage({result});
      } catch(error) { self.postMessage({error: error.message || 'Unable to read CAD geometry.'}); }
    };`
    try {
      blobUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))
      worker = new Worker(blobUrl)
      signal.addEventListener('abort', abort, { once: true })
      worker.onmessage = ({ data }) => data.error ? finish(new Error(data.error)) : finish(null, data.result)
      worker.onerror = () => finish(new Error('CAD reader could not start. Check that the reader assets are available and try again.'))
      timer = setTimeout(() => finish(new Error('CAD preview took too long. Try a smaller model.')), 45000)
      file.arrayBuffer().then((buffer) => {
        if (signal.aborted) return
        worker.postMessage({ buffer,
          scriptUrl: new URL(occtScriptUrl, window.location.href).href,
          wasmUrl: new URL(occtWasmUrl, window.location.href).href,
          iges: /\.(iges|igs)$/i.test(file.name),
        }, [buffer])
      }).catch((error) => finish(error))
    } catch (error) { finish(error) }
  })
}

export function disposeModel(model) {
  model?.traverse((object) => {
    object.geometry?.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => material?.dispose())
  })
}

function prepareModel(model) {
  let vertices = 0
  let meshes = 0
  model.traverse((object) => {
    if (!object.isMesh) return
    meshes++
    const geometry = object.geometry
    vertices += geometry.getAttribute('position')?.count ?? 0
    if (!geometry.getAttribute('normal')) geometry.computeVertexNormals()
    const oldMaterials = Array.isArray(object.material) ? object.material : [object.material]
    oldMaterials.forEach((material) => material?.dispose())
    object.material = new THREE.MeshStandardMaterial({ color: '#83a8df', roughness: .65, metalness: .1, side: THREE.DoubleSide })
  })
  const bounds = new THREE.Box3().setFromObject(model)
  const size = bounds.getSize(new THREE.Vector3())
  if (!meshes || !vertices || vertices > maxVertices || bounds.isEmpty()
    || ![...bounds.min, ...bounds.max].every(Number.isFinite) || size.length() <= 0) {
    throw new Error(vertices > maxVertices ? 'Model is too detailed for this preview. Export a simplified model.' : 'This file has no valid 3D geometry.')
  }
  model.position.sub(bounds.getCenter(new THREE.Vector3()))
  return model
}

export async function loadCadModel(file, signal) {
  if (file.size > 25 * 1024 * 1024) throw new Error('Preview supports files up to 25 MB. Download larger files to open them in your CAD application.')
  const extension = file.name.split('.').pop().toLowerCase()
  let model = new THREE.Group()
  try {
    if (extension === 'stl') {
      const { STLLoader } = await import('three/addons/loaders/STLLoader.js')
      const geometry = new STLLoader().parse(await file.arrayBuffer())
      model.add(new THREE.Mesh(geometry))
    } else if (extension === 'obj') {
      const { OBJLoader } = await import('three/addons/loaders/OBJLoader.js')
      model = new OBJLoader().parse(await file.text())
      // This viewer intentionally displays geometry without external textures/material files.
    } else if (['step', 'stp', 'iges', 'igs'].includes(extension)) {
      const result = await readOcct(file, signal)
      const total = result.meshes.reduce((sum, mesh) => sum + (mesh.attributes?.position?.array?.length ?? 0) / 3, 0)
      if (total > maxVertices || result.meshes.length > 2000) throw new Error('Model is too detailed for this preview. Export a simplified model.')
      for (const mesh of result.meshes) {
        const positions = mesh.attributes.position.array
        const indices = mesh.index.array
        if (!positions.length || positions.length % 3 || indices.some((index) => !Number.isInteger(index) || index < 0 || index >= positions.length / 3)) {
          throw new Error('The CAD file contains invalid mesh data.')
        }
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        geometry.setIndex(indices)
        if (mesh.attributes.normal?.array) geometry.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.attributes.normal.array, 3))
        model.add(new THREE.Mesh(geometry))
      }
    } else throw new Error('3D preview supports STEP, STP, IGES, IGS, STL and OBJ files.')
    if (signal.aborted) throw new DOMException('Preview closed', 'AbortError')
    return prepareModel(model)
  } catch (error) { disposeModel(model); throw error }
}
