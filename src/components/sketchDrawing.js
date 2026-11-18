export const sketchWidth = 1000
export const sketchHeight = 600

export function drawSketch(canvas, shapes, background = false) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, sketchWidth, sketchHeight)
  if (background) {
    // Render eraser strokes on a transparent layer, then put white behind it.
    const layer = document.createElement('canvas')
    layer.width = sketchWidth
    layer.height = sketchHeight
    drawSketch(layer, shapes)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, sketchWidth, sketchHeight)
    ctx.drawImage(layer, 0, 0)
    return
  }
  for (const shape of shapes) {
    const { tool, color, width, points, text } = shape
    const start = points[0]
    const end = points.at(-1)
    ctx.save()
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = tool === 'eraser' ? width * 5 : width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (tool === 'eraser') ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    if (tool === 'text') {
      ctx.font = `${Math.max(18, width * 5)}px sans-serif`
      ctx.fillText(text, start.x, start.y)
    } else if (tool === 'rectangle') {
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y)
    } else if (tool === 'circle') {
      ctx.ellipse((start.x + end.x) / 2, (start.y + end.y) / 2,
        Math.abs(end.x - start.x) / 2, Math.abs(end.y - start.y) / 2, 0, 0, Math.PI * 2)
      ctx.stroke()
    } else {
      ctx.moveTo(start.x, start.y)
      if (tool === 'pen' || tool === 'eraser') {
        for (const point of points.slice(1)) ctx.lineTo(point.x, point.y)
        if (points.length === 1) ctx.lineTo(start.x + .1, start.y)
      } else ctx.lineTo(end.x, end.y)
      ctx.stroke()
      if (tool === 'arrow') {
        const angle = Math.atan2(end.y - start.y, end.x - start.x)
        const length = Math.max(12, width * 4)
        ctx.beginPath()
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(end.x - length * Math.cos(angle - Math.PI / 6), end.y - length * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(end.x - length * Math.cos(angle + Math.PI / 6), end.y - length * Math.sin(angle + Math.PI / 6))
        ctx.stroke()
      }
    }
    ctx.restore()
  }
}
