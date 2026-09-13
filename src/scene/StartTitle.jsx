import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useNavigationStore } from '../state/navigationStore'
import {
  loadTitle,
  texelToLocal,
  makeInkTest,
  GATE,
  CANVAS_W,
  CANVAS_H,
  TEXEL,
} from './bitmapType'

// -----------------------------------------------------------------------------
// "START here" — bitmap type, standing still in world space behind the star.
//
// STATIC, ON PURPOSE
// An earlier version turned to follow the camera's azimuth and drifted against
// the pointer. Both are gone. This is a physical object at a fixed position and
// a fixed orientation: the star eclipses it, the orbit rings cross in front of
// it, and orbiting the system genuinely moves the viewer around it. Because it
// no longer turns, rotating far enough around shows it from behind, mirrored —
// which is what the back of a sign looks like, and is kept deliberately.
//
// The camera's auto-rotation was switched off to go with this (see CameraRig):
// with a fixed sign, an auto-orbiting camera would have walked every visitor
// round to the back of it within about fifteen seconds, unasked. The system
// still moves — the planets are still in orbit — but the composition the
// visitor lands on now holds until they choose to change it.
//
// ONE QUAD
// A texture and a plane: one draw call, one material, no glyph atlas, nothing
// generated per frame. Per frame this writes a single opacity.
// -----------------------------------------------------------------------------

/** Fixed world position. z is behind the star; the camera starts on +z. */
const TITLE_POS = [0, 1.0, -9]

const REST_OPACITY = 0.82
const HOVER_OPACITY = 1

/** Pointer tolerance, in texels, around the ink. Serif hairlines are one texel
 *  wide and nobody can be asked to hit that, so the target is dilated. */
const HIT_PAD = 4

export default function StartTitle({ onStart, onHover, onHoles }) {
  const meshRef = useRef()
  const matRef = useRef()

  const stage = useNavigationStore((s) => s.stage)
  const view = useNavigationStore((s) => s.view)
  const cvOpen = useNavigationStore((s) => s.cvOpen)
  const dossierOpen = useNavigationStore((s) => s.dossierOpen)
  const hovered = useNavigationStore((s) => s.sunHovered)

  const [built, setBuilt] = useState(null)

  // Load the baked artwork. Nothing is rasterised at runtime any more — see
  // bitmapType.js for why the lettering arrives as an image rather than a font.
  useEffect(() => {
    let alive = true
    loadTitle()
      .then((result) => {
        if (!alive) return
        setBuilt(result)
        if (!onHoles) return
        const [gx, gy] = texelToLocal(GATE.x, GATE.y)
        onHoles({
          // The one opening in the phrase, in world space: the word gap.
          gate: {
            position: new THREE.Vector3(
              TITLE_POS[0] + gx,
              TITLE_POS[1] + gy,
              TITLE_POS[2]
            ),
            radius: GATE.r * TEXEL,
          },
          // So the ship can tell a letter from the empty space beside it.
          isInk: makeInkTest(result.alpha, TITLE_POS),
        })
      })
      .catch(() => {
        /* The title is decoration; if its image fails, the scene carries on. */
      })
    return () => {
      alive = false
    }
  }, [onHoles])

  // Free the GPU texture when the scene goes away.
  useEffect(() => {
    return () => built?.texture?.dispose()
  }, [built])

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(CANVAS_W * TEXEL, CANVAS_H * TEXEL),
    []
  )
  useEffect(() => () => geometry.dispose(), [geometry])

  // Only in the resting overview: it is the invitation into the CV, so it has
  // no business behind a project the visitor is reading, or behind the CV.
  const shown = stage === 'system' && view === 'overview' && !cvOpen && !dossierOpen
  const live = useRef(0)

  useFrame((_, delta) => {
    const m = matRef.current
    const mesh = meshRef.current
    if (!m || !mesh) return
    const target = shown ? (hovered ? HOVER_OPACITY : REST_OPACITY) : 0
    live.current = THREE.MathUtils.damp(live.current, target, shown ? 3.5 : 7, delta)
    m.opacity = live.current
    const visible = live.current > 0.004
    if (mesh.visible !== visible) mesh.visible = visible
  })

  // Is this pointer event actually on ink? The quad is 26x14 units of mostly
  // empty space; without this test the title would swallow every click aimed at
  // the sky behind it, including the click-empty-space-to-deselect gesture.
  const onInk = (e) => {
    if (!built || !e.uv || live.current < 0.25) return false
    const px = Math.round(e.uv.x * CANVAS_W)
    const py = Math.round((1 - e.uv.y) * CANVAS_H)
    for (let dy = -HIT_PAD; dy <= HIT_PAD; dy++) {
      for (let dx = -HIT_PAD; dx <= HIT_PAD; dx++) {
        const x = px + dx
        const y = py + dy
        if (x < 0 || y < 0 || x >= CANVAS_W || y >= CANVAS_H) continue
        if (built.alpha[y * CANVAS_W + x]) return true
      }
    }
    return false
  }

  if (!built) return null

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={TITLE_POS}
      visible={false}
      onClick={(e) => {
        if (!onInk(e)) return
        e.stopPropagation()
        onStart()
      }}
      onPointerMove={(e) => {
        const on = onInk(e)
        if (on) e.stopPropagation()
        document.body.classList.toggle('is-pointing', on)
        onHover(on)
      }}
      onPointerOut={() => {
        document.body.classList.remove('is-pointing')
        onHover(false)
      }}
    >
      <meshBasicMaterial
        ref={matRef}
        map={built.texture}
        transparent
        opacity={0}
        depthWrite={false}
        /* Additive: the words add light to the scene rather than covering it, so
           the nebula and the orbit rings read THROUGH them and the star's glow
           washes over them. It also keeps the 1-bit edges intact — an ink texel
           adds its colour, an empty one adds nothing. */
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        fog={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
