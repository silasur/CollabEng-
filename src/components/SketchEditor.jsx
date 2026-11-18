import { useEffect, useRef, useState } from 'react'
import { drawSketch, sketchWidth, sketchHeight } from './sketchDrawing'

const tools = ['pen', 'eraser', 'line', 'arrow', 'rectangle', 'circle', 'text']

export default function SketchEditor({ onAdd }) {
  const dialog = useRef(null)
  const canvas = useRef(null)
  const stroke = useRef(null)
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#172b46')
  const [width, setWidth] = useState(3)
  const [text, setText] = useState('')
  const [name, setName] = useState('Engineering sketch')
  const [shapes, setShapes] = useState([])
  const [future, setFuture] = useState([])
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    drawSketch(canvas.current, preview ? [...shapes, preview] : shapes)
  }, [shapes, preview])

  function commit(shape) {
    setShapes((previous) => [...previous, shape])
    setFuture([])
  }

  function point(event) {
    const bounds = canvas.current.getBoundingClientRect()
    return { x: Math.max(0, Math.min(sketchWidth, (event.clientX - bounds.left) * sketchWidth / bounds.width)),
      y: Math.max(0, Math.min(sketchHeight, (event.clientY - bounds.top) * sketchHeight / bounds.height)) }
  }

  function start(event) {
    if (saving || event.button !== 0 || !event.isPrimary) return
    const p = point(event)
    if (tool === 'text') {
      if (text.trim()) commit({ tool, color, width, text: text.trim(), points: [p] })
      else setError('Enter text, then click where you want to place it.')
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    stroke.current = { pointerId: event.pointerId, tool, color, width, points: [p] }
    setPreview({ ...stroke.current })
    setError('')
  }

  function move(event) {
    const current = stroke.current
    if (!current || current.pointerId !== event.pointerId) return
    const p = point(event)
    current.points = current.tool === 'pen' || current.tool === 'eraser'
      ? [...current.points, p] : [current.points[0], p]
    setPreview({ ...current })
  }

  function finish(event) {
    if (!stroke.current || stroke.current.pointerId !== event.pointerId) return
    move(event)
    commit({ ...stroke.current })
    stroke.current = null
    setPreview(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function reset() {
    stroke.current = null
    setShapes([])
    setFuture([])
    setPreview(null)
    setError('')
  }

  function addToNote() {
    if (!shapes.some((shape) => shape.tool !== 'eraser') || saving) return
    setSaving(true)
    setError('')
    const output = document.createElement('canvas')
    output.width = sketchWidth
    output.height = sketchHeight
    drawSketch(output, shapes, true)
    output.toBlob((blob) => {
      setSaving(false)
      if (!dialog.current?.open) return
      if (!blob) { setError('Unable to create the sketch image. Please try again.'); return }
      const base = (name.trim() || 'Engineering sketch').replace(/[/\\]/g, '-').replace(/\.png$/i, '')
      onAdd(new File([blob], `${base}.png`, { type: 'image/png', lastModified: Date.now() }))
      dialog.current.close()
      reset()
    }, 'image/png')
  }

  return (
    <>
      <button className="nb-secondary" type="button" onClick={() => dialog.current.showModal()}>+ Draw sketch</button>
      <dialog ref={dialog} className="nb-tool-dialog nb-sketch-dialog" aria-labelledby="nb-sketch-title"
        onCancel={(event) => { if (saving) event.preventDefault() }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && event.target.tagName === 'INPUT') event.preventDefault()
        }}>
        <header className="nb-tool-heading">
          <h2 id="nb-sketch-title">Draw a sketch</h2>
          <button type="button" disabled={saving} onClick={() => dialog.current.close()} aria-label="Close sketch editor">×</button>
        </header>
        <label className="nb-sketch-name">Sketch name<input value={name} maxLength={100} onChange={(event) => setName(event.target.value)} /></label>
        <fieldset className="nb-sketch-controls" disabled={saving}>
          <legend className="nb-visually-hidden">Drawing tools</legend>
          <div className="nb-sketch-tools" role="group" aria-label="Tool">
            {tools.map((item) => <button key={item} type="button" aria-pressed={tool === item}
              onClick={() => setTool(item)}>{item === 'circle' ? 'Ellipse' : item[0].toUpperCase() + item.slice(1)}</button>)}
          </div>
          <label>Colour<input type="color" value={color} onChange={(event) => setColor(event.target.value)} /></label>
          <label>Width<select value={width} onChange={(event) => setWidth(Number(event.target.value))}>
            {[2, 3, 5, 8].map((value) => <option key={value} value={value}>{value} px</option>)}
          </select></label>
          <button type="button" disabled={!shapes.length} onClick={() => {
            setFuture((previous) => [...previous, shapes.at(-1)])
            setShapes((previous) => previous.slice(0, -1))
          }}>Undo</button>
          <button type="button" disabled={!future.length} onClick={() => {
            setShapes((previous) => [...previous, future.at(-1)])
            setFuture((previous) => previous.slice(0, -1))
          }}>Redo</button>
        </fieldset>
        {tool === 'text' && <label className="nb-sketch-text">Text to place
          <input value={text} maxLength={200} placeholder="Enter a label, then click the canvas" onChange={(event) => setText(event.target.value)} />
        </label>}
        <p className="nb-tool-help">Draw with a mouse, touch or stylus. The sketch will be added as a PNG image.</p>
        <canvas ref={canvas} className="nb-sketch-canvas" width={sketchWidth} height={sketchHeight}
          aria-label="Sketch drawing area" onPointerDown={start} onPointerMove={move} onPointerUp={finish}
          onPointerCancel={() => { stroke.current = null; setPreview(null) }} />
        {error && <p role="alert">{error}</p>}
        <footer className="nb-tool-footer">
          <button type="button" disabled={saving} onClick={() => dialog.current.close()}>Cancel</button>
          <button type="button" className="nb-primary" disabled={saving || !shapes.some((shape) => shape.tool !== 'eraser')}
            onClick={addToNote}>{saving ? 'Adding…' : 'Add to note'}</button>
        </footer>
      </dialog>
    </>
  )
}
