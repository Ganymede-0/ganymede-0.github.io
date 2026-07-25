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

// A boiling photosphere: dense overlapping warm cells (granulation), a few dark
// sunspot patches, and a bright bias so the map reads as self-luminous under
// bloom. Used as the Sun's emissiveMap. This is the "textured, not shader"
// approach — and the exact spot to swap in a real NASA/SDO photo (see the note
// in Sun.jsx / the config guide).
export function sunTexture(size = 1024) {
  const { canvas, ctx } = makeCanvas(size)
  ctx.fillStyle = '#c2410c'
  ctx.fillRect(0, 0, size, size)

  // Granulation: thousands of soft convection cells, warm-biased.
  const cells = Math.floor(size * 2.4)
  for (let i = 0; i < cells; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 4 + Math.random() * 20
    const heat = Math.random()
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    // hotter cells trend toward white-gold, cooler toward deep ember
    const inner = heat > 0.82 ? '#fff3d6' : heat > 0.5 ? '#ffcf7a' : '#f97316'
    g.addColorStop(0, inner)
    g.addColorStop(1, 'rgba(120,30,4,0)')
    ctx.globalAlpha = 0.35 + heat * 0.4
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // A handful of sunspots — cool, dark umbrae with soft penumbrae.
  for (let i = 0; i < 6; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 14 + Math.random() * 40
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(60,12,2,0.9)')
    g.addColorStop(0.6, 'rgba(120,40,8,0.5)')
    g.addColorStop(1, 'rgba(120,40,8,0)')
    ctx.globalAlpha = 0.8
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  return tex
}

// A soft radial falloff for additive corona billboards. No shader required.
export function radialGlowTexture(size = 512) {
  const { canvas, ctx } = makeCanvas(size)
  const c = size / 2
  const g = ctx.createRadialGradient(c, c, 0, c, c, c)
  g.addColorStop(0.0, 'rgba(255,255,255,1)')
  g.addColorStop(0.18, 'rgba(255,224,170,0.85)')
  g.addColorStop(0.45, 'rgba(255,150,70,0.35)')
  g.addColorStop(1.0, 'rgba(255,120,40,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
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
