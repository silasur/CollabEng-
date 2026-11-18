import { useEffect, useRef, useState } from 'react'

export default function CadPreview({ file, name }) {
  const host = useRef(null)
  const reset = useRef(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const container = host.current
    let renderer, controls, observer, model, disposeModel
    let contextLost
    async function start() {
      const [THREE, { OrbitControls }, helpers] = await Promise.all([
        import('three'), import('three/addons/controls/OrbitControls.js'), import('./cadModel'),
      ])
      if (controller.signal.aborted) return
      disposeModel = helpers.disposeModel
      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.domElement.tabIndex = 0
      renderer.domElement.setAttribute('aria-label', '3D CAD model. Drag to rotate, scroll to zoom. Arrow keys pan the model.')
      container.appendChild(renderer.domElement)
      contextLost = (event) => {
        event.preventDefault()
        if (!controller.signal.aborted) { setError('3D graphics became unavailable. Try reopening the preview.'); setStatus('error') }
      }
      renderer.domElement.addEventListener('webglcontextlost', contextLost)
      const scene = new THREE.Scene()
      scene.background = new THREE.Color('#f8fafc')
      const camera = new THREE.PerspectiveCamera(45, 1, .01, 10000)
      scene.add(new THREE.HemisphereLight(0xffffff, 0x8190a5, 2.6))
      const light = new THREE.DirectionalLight(0xffffff, 3)
      light.position.set(4, 6, 5)
      scene.add(light)
      controls = new OrbitControls(camera, renderer.domElement)
      controls.listenToKeyEvents(renderer.domElement)
      const render = () => { if (!controller.signal.aborted) renderer.render(scene, camera) }
      controls.addEventListener('change', render)
      const resize = () => {
        const width = Math.max(1, container.clientWidth)
        const height = Math.max(1, container.clientHeight)
        renderer.setSize(width, height)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        render()
      }
      observer = new ResizeObserver(resize)
      observer.observe(container)
      resize()
      model = await helpers.loadCadModel(file, controller.signal)
      if (controller.signal.aborted) { disposeModel(model); model = null; return }
      scene.add(model)
      const bounds = new THREE.Box3().setFromObject(model)
      const radius = bounds.getBoundingSphere(new THREE.Sphere()).radius
      reset.current = () => {
        const halfFov = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.min(camera.aspect, 1))
        const distance = radius / Math.sin(halfFov) * 1.15
        camera.position.copy(new THREE.Vector3(1, .8, 1).normalize().multiplyScalar(distance))
        camera.near = radius / 1000
        camera.far = Math.max(radius * 1000, distance * 10)
        camera.updateProjectionMatrix()
        controls.target.set(0, 0, 0)
        controls.minDistance = radius * .1
        controls.maxDistance = radius * 100
        controls.update()
        render()
      }
      reset.current()
      setStatus('ready')
    }
    start().catch((failure) => {
      if (!controller.signal.aborted) {
        setError(failure.message || 'Unable to display this model.')
        setStatus('error')
      }
    })
    return () => {
      controller.abort()
      reset.current = null
      observer?.disconnect()
      controls?.dispose()
      disposeModel?.(model)
      if (renderer) {
        renderer.domElement.removeEventListener('webglcontextlost', contextLost)
        renderer.dispose()
        renderer.forceContextLoss()
        renderer.domElement.remove()
      }
    }
  }, [file, attempt])

  return (
    <div className="nb-cad-preview">
      <div className="nb-cad-controls">
        <p>{name}</p>
        <button type="button" disabled={status !== 'ready'} onClick={() => reset.current?.()}>Reset view</button>
      </div>
      <div className="nb-cad-stage">
        <div className="nb-cad-canvas" ref={host} />
        {status === 'loading' && <p className="nb-cad-status" role="status">Preparing 3D preview…</p>}
        {status === 'error' && <div className="nb-cad-status" role="alert"><p>{error}</p>
          <button type="button" onClick={() => { setStatus('loading'); setError(''); setAttempt((previous) => previous + 1) }}>Retry</button>
        </div>}
      </div>
      <p className="nb-tool-help">Drag to rotate · Scroll or pinch to zoom · Right-drag to pan. Geometry preview only; original CAD file remains available to download.</p>
    </div>
  )
}
