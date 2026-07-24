import * as THREE from 'three'

// Small canvas-generated textures so the system needs zero image assets —
// nothing to load, nothing to optimize, nothing that breaks on GitHub Pages
// path resolution. Each function returns a THREE.CanvasTexture.

function makeCanvas(size = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  return { canvas, ctx: canvas.getContext('2d') }
}

export function bandsTexture(base, accent) {
  const { canvas, ctx } = makeCanvas(256)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 256, 256)
  const bandCount = 9
  for (let i = 0; i < bandCount; i++) {
    const y = (i / bandCount) * 256
    const h = 256 / bandCount
    ctx.fillStyle = i % 2 === 0 ? accent : base
    ctx.globalAlpha = 0.22
    ctx.fillRect(0, y, 256, h)
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

export function stormTexture(base, accent) {
  const { canvas, ctx } = makeCanvas(256)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 256, 256)
  ctx.strokeStyle = accent
  ctx.globalAlpha = 0.35
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    const cy = 40 + i * 45
    ctx.ellipse(128, cy, 100 - i * 6, 14, 0, 0, Math.PI * 2)
    ctx.lineWidth = 6
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

export function gridTexture(base, accent) {
  const { canvas, ctx } = makeCanvas(256)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 256, 256)
  ctx.strokeStyle = accent
  ctx.globalAlpha = 0.3
  ctx.lineWidth = 1
  const step = 32
  for (let x = 0; x <= 256; x += step) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 256)
    ctx.stroke()
  }
  for (let y = 0; y <= 256; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(256, y)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 2)
  return tex
}

export function textureForPattern(pattern, base, accent) {
  switch (pattern) {
    case 'bands':
      return bandsTexture(base, accent)
    case 'storm':
      return stormTexture(base, accent)
    case 'grid':
      return gridTexture(base, accent)
    default:
      return null
  }
}
