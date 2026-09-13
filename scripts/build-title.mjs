// -----------------------------------------------------------------------------
// Bakes the 3D title ("Start Here") to a flat image, once, on a machine that has
// the font installed. The site ships the IMAGE. The font is never served.
//
// WHY THIS EXISTS — AND WHY IT IS NOT OPTIONAL
// The title is set in Rukyltronic Star (Typodermic). Its licence is a DESKTOP
// licence, and Typodermic's own guide is explicit:
//
//     Needs another license: Webfonts, apps, games, ... and similar embedding
//     uses.
//     Websites and webfonts: Any use that serves or embeds the font in a
//     website.
//
// So the font file cannot be put in public/ and cannot be committed to a public
// repository — that would be both serving it and redistributing it. What the
// desktop licence DOES cover is making fixed artwork:
//
//     Flat images and graphics exported as formats such as JPG, PNG...
//     The simple test: viewers can see the lettering, but they cannot access
//     the font, extract it, edit text with it, or use it to compose new text.
//
// A pre-rendered PNG passes that test exactly. This script is the boundary: the
// font goes in, an image comes out, and only the image is committed.
//
// It is also simply faster. The browser no longer downloads a font, rasterises
// glyphs, or flood-fills an alpha map on the main thread at startup.
//
// USAGE
//     npm install --no-save puppeteer-core sharp     (already present here)
//     node scripts/build-title.mjs "path/to/rukyltronic star.otf"
//
// Re-run it to change the wording — the phrase is one constant below, and the
// geometry the ship's flight path depends on is recomputed from the result.
// -----------------------------------------------------------------------------

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const puppeteer = require('puppeteer-core')
const sharp = require('sharp')

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

/** The phrase, and the grid it is drawn on. CANVAS_W/H and TEXEL must match
 *  the values the runtime reads back out of titleGeometry.json. */
const PHRASE = 'Start Here'
// Double the texel density of the first cut. This face draws its letters out of
// a dot matrix, and at 330 across a 37-unit sign each of those dots landed on
// roughly four screen pixels — the texture stopped reading as a fill and started
// reading as rubble. Twice the resolution over the same world size halves the
// dot, which is what lets the pattern read as the grain of the letterform
// instead of as noise.
const CANVAS_W = 660
const CANVAS_H = 280
const TEXEL = 0.052
const FONT_SIZE = 116
const BASELINE = 176
/** Where the star falls on this plane, in canvas coordinates. */
const LIGHT = { x: 330, y: 196, r: 300 }

const fontPath = process.argv[2]
if (!fontPath) {
  console.error('usage: node scripts/build-title.mjs "<path to rukyltronic star.otf>"')
  process.exit(1)
}
const fontB64 = readFileSync(fontPath).toString('base64')

const page = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'TitleFace';src:url(data:font/otf;base64,${fontB64}) format('opentype');}
body{margin:0;background:transparent}
</style></head><body><canvas id="c" width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
<script>
window.__out = new Promise(async (resolve) => {
  await document.fonts.load('${FONT_SIZE}px TitleFace')
  await document.fonts.ready
  const W=${CANVAS_W}, H=${CANVAS_H}
  const c=document.getElementById('c'), x=c.getContext('2d',{willReadFrequently:true})

  // The star's light, as a gradient across the lettering: warm where the star
  // sits on this plane, cooling to violet at the edges. Same stops the 2D name
  // in the HUD uses, so the two read as one voice.
  const g=x.createRadialGradient(${LIGHT.x},${LIGHT.y},4,${LIGHT.x},${LIGHT.y},${LIGHT.r})
  g.addColorStop(0,'#fff3dc'); g.addColorStop(0.28,'#ffd9a3')
  g.addColorStop(0.62,'#cdd2ff'); g.addColorStop(1,'#9aa6f2')
  x.fillStyle=g; x.textBaseline='alphabetic'
  x.font='${FONT_SIZE}px TitleFace'
  const phrase=${JSON.stringify(PHRASE)}
  const w=x.measureText(phrase).width
  const originX=Math.round(${LIGHT.x}-w/2)
  x.fillText(phrase, originX, ${BASELINE})

  // 1-bit quantisation. Canvas text is anti-aliased and cannot be told not to
  // be; magnified thirty times in the scene, soft edges read as an upscaled
  // photograph rather than as pixel type.
  const img=x.getImageData(0,0,W,H), d=img.data
  const alpha=new Uint8Array(W*H)
  for(let i=0,p=0;i<d.length;i+=4,p++){
    const on = d[i+3]>=128 ? 255 : 0
    d[i+3]=on; alpha[p]=on
  }
  x.putImageData(img,0,0)

  // --- Where can the ship pass through? ------------------------------------
  // This face is a pixel grid with a textured fill, so its letters have no
  // enclosed counters to thread — every apparent hole is a gap in the dot
  // pattern, a few texels across and open to the outside. The real opening in
  // the phrase is the word space, so that is the gate: find the widest run of
  // completely empty columns inside the inked bounding box.
  let minX=W, maxX=-1, minY=H, maxY=-1
  for(let py=0;py<H;py++) for(let px=0;px<W;px++) if(alpha[py*W+px]){
    if(px<minX)minX=px; if(px>maxX)maxX=px; if(py<minY)minY=py; if(py>maxY)maxY=py
  }
  const emptyCol=[]
  for(let px=minX;px<=maxX;px++){
    let ink=false
    for(let py=minY;py<=maxY;py++) if(alpha[py*W+px]){ink=true;break}
    emptyCol.push(!ink)
  }
  let best={start:0,len:0}, run=0
  for(let i=0;i<emptyCol.length;i++){
    if(emptyCol[i]){ run++; if(run>best.len) best={start:minX+i-run+1,len:run} }
    else run=0
  }
  const gate={
    x: best.start + best.len/2,
    y: (minY+maxY)/2,
    r: Math.max(2, best.len/2),
  }

  resolve({
    png: c.toDataURL('image/png'),
    originX, phraseWidth: Math.round(w),
    bounds: {minX,maxX,minY,maxY},
    gate,
    inkPixels: alpha.reduce((s,v)=>s+(v?1:0),0),
  })
})
</script></body></html>`

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const p = await browser.newPage()
await p.setContent(page, { waitUntil: 'networkidle0' })
const out = await p.evaluate(() => window.__out)
await browser.close()

mkdirSync('public/media/title', { recursive: true })
const png = Buffer.from(out.png.split(',')[1], 'base64')
// PNG, not WebP: the runtime reads this back pixel by pixel to rebuild the ink
// map, and lossy compression would blur the 1-bit edges the whole look depends
// on. At this size it is a few kilobytes either way.
writeFileSync('public/media/title/start-here.png', png)

const geometry = {
  note: 'Generated by scripts/build-title.mjs. Do not edit by hand.',
  phrase: PHRASE,
  canvasW: CANVAS_W,
  canvasH: CANVAS_H,
  texel: TEXEL,
  bounds: out.bounds,
  gate: out.gate,
}
mkdirSync('src/data', { recursive: true })
writeFileSync('src/data/titleGeometry.json', JSON.stringify(geometry, null, 2) + '\n')

console.log('title baked:', png.length, 'bytes,', out.inkPixels, 'ink texels')
console.log('phrase width', out.phraseWidth, 'origin x', out.originX)
console.log('gate (word space):', JSON.stringify(out.gate))
