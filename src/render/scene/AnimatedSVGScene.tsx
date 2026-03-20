import { useState, useEffect, useRef, useCallback } from 'react'
import { useStudioStore } from '../../store'
import type { Quaternion } from '../../math/quaternion/types'

// ─── Quaternion math (array format [w, x, y, z]) ───────────────────────────

function qMul(a: number[], b: number[]): number[] {
  return [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
  ]
}

function qConj(q: number[]): number[] {
  return [q[0], -q[1], -q[2], -q[3]]
}

function qNorm(q: number[]): number[] {
  const len = Math.sqrt(q[0] ** 2 + q[1] ** 2 + q[2] ** 2 + q[3] ** 2)
  return len < 1e-10 ? [1, 0, 0, 0] : q.map((v) => v / len)
}

function qSlerp(q1: number[], q2: number[], t: number): number[] {
  let dot = q1[0] * q2[0] + q1[1] * q2[1] + q1[2] * q2[2] + q1[3] * q2[3]
  let q2a = [...q2]
  if (dot < 0) {
    dot = -dot
    q2a = q2a.map((v) => -v)
  }
  if (dot > 0.9995) {
    return qNorm([
      q1[0] + t * (q2a[0] - q1[0]),
      q1[1] + t * (q2a[1] - q1[1]),
      q1[2] + t * (q2a[2] - q1[2]),
      q1[3] + t * (q2a[3] - q1[3]),
    ])
  }
  const theta0 = Math.acos(dot)
  const sinTheta = Math.sin(theta0)
  const w1 = Math.sin((1 - t) * theta0) / sinTheta
  const w2 = Math.sin(t * theta0) / sinTheta
  return [
    w1 * q1[0] + w2 * q2a[0],
    w1 * q1[1] + w2 * q2a[1],
    w1 * q1[2] + w2 * q2a[2],
    w1 * q1[3] + w2 * q2a[3],
  ]
}

function rotateVec(v: [number, number, number], q: number[]): [number, number, number] {
  const vq = [0, v[0], v[1], v[2]]
  const res = qMul(qMul(q, vq), qConj(q))
  return [res[1], res[2], res[3]]
}

// ─── 3D → 2D perspective projection ───────────────────────────────────────

function project(
  p: [number, number, number],
  viewQ: number[],
  W: number,
  H: number,
  scale: number,
  fov: number,
): { x: number; y: number; depth: number } {
  const r = rotateVec(p, viewQ)
  const depth = r[2] + fov
  const persp = fov / Math.max(depth, 1)
  return {
    x: r[0] * scale * persp + W / 2,
    y: -r[1] * scale * persp + H / 2,
    depth: r[2],
  }
}

// ─── Bloch vector from store Quaternion ───────────────────────────────────

function blochFromQuat(q: Quaternion): [number, number, number] {
  // Rodrigues rotation of (0,0,1) by the quaternion
  const w = q.w, x = q.x, y = q.y, z = q.z
  const bx = 2 * (x * z + w * y)
  const by = 2 * (y * z - w * x)
  const bz = w * w - x * x - y * y + z * z
  return [bx, by, bz]
}

function quatToArr(q: Quaternion): number[] {
  return [q.w, q.x, q.y, q.z]
}

function easeInOutCubic(t: number): number {
  // Sine-based easing: very smooth acceleration and deceleration between states
  return -(Math.cos(Math.PI * t) - 1) / 2
}

// ─── Hopf-lattice sample generation ──────────────────────────────────────
// Generates m×n unit quaternions uniformly covering S³ via the Hopf
// parameterisation: q = [cos(η)cos(ξ₁), cos(η)sin(ξ₁), sin(η)cos(ξ₂), sin(η)sin(ξ₂)]
// where η ∈ (0, π/2) and ξ ∈ [0, 2π).

function generateHopfLattice(m: number, n: number): number[][] {
  const pts: number[][] = []
  for (let i = 0; i < m; i++) {
    const eta = ((i + 0.5) / m) * (Math.PI / 2)
    const cosEta = Math.cos(eta)
    const sinEta = Math.sin(eta)
    for (let j = 0; j < n; j++) {
      const xi1 = (j / n) * 2 * Math.PI
      const xi2 = xi1 + (i / m) * Math.PI // offset xi2 per latitude ring
      pts.push([
        cosEta * Math.cos(xi1),
        cosEta * Math.sin(xi1),
        sinEta * Math.cos(xi2),
        sinEta * Math.sin(xi2),
      ])
    }
  }
  return pts
}

// Pre-computed lattice (6 eta levels × 12 xi steps = 72 sample quaternions)
const HOPF_M = 6
const HOPF_N = 12
const HOPF_SAMPLES: number[][] = generateHopfLattice(HOPF_M, HOPF_N)

// ─── Star shape ───────────────────────────────────────────────────────────

interface Star {
  x: number
  y: number
  r: number
  opacity: number
  vx: number
}

// ─── Component ────────────────────────────────────────────────────────────

const ANIM_DURATION = 1600       // ms for gate transition animation
const MAX_PATH = 120             // max path history points
const FOV = 550                  // perspective field-of-view depth
const SPHERE_SCALE = 200         // visual radius in pixels
const MIN_PATH_DISTANCE = 0.008  // minimum Bloch vector displacement to add a path point
const ROTATION_SENSITIVITY = 0.008  // radians per pixel for camera drag
const MANIFOLD_FADE_DURATION = 400  // ms to fade manifold field out after gate animation ends

export function AnimatedSVGScene() {
  const currentQuaternion = useStudioStore((s) => s.currentQuaternion)

  // Displayed (animated) quaternion as array
  const displayQuatRef = useRef<number[]>([1, 0, 0, 0])
  const [, forceRender] = useState(0)

  // Animation state
  const animRef = useRef<{
    from: number[]
    to: number[]
    startTime: number
    running: boolean
    deltaGate: number[]  // gate quaternion being applied: to * conj(from)
  }>({ from: [1, 0, 0, 0], to: [1, 0, 0, 0], startTime: 0, running: false, deltaGate: [1, 0, 0, 0] })

  // Camera
  // Initial view: slight 3/4 elevated view (matches RQMSpinorVisualizer default)
  const viewQuatRef = useRef<number[]>([0.94, 0.08, 0.33, 0.04])
  const isDraggingRef = useRef(false)
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null)

  // Stars
  const starsRef = useRef<Star[]>([])
  const starsInitRef = useRef(false)

  // Path history (Bloch vector points)
  const pathHistoryRef = useRef<Array<[number, number, number]>>([])

  // Manifold field: Bloch vectors of all Hopf lattice samples transformed by the running gate
  const manifoldBlochRef = useRef<Array<[number, number, number]>>([])
  const manifoldOpacityRef = useRef(0)       // 0 = hidden, 1 = fully visible
  const manifoldFadeStartRef = useRef(0)     // timestamp when fade-out began
  const manifoldFadingRef = useRef(false)    // true while fading out

  // Container size
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })

  // RAF handle
  const rafRef = useRef<number>(0)
  const tickRef = useRef(0)

  // Observe container size
  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setSize({ w: width, h: height })
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // Generate stars once when size is known
  useEffect(() => {
    if (starsInitRef.current) return
    starsInitRef.current = true
    const stars: Star[] = []
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random() * size.w,
        y: Math.random() * size.h,
        r: Math.random() * 1.4 + 0.3,
        opacity: Math.random() * 0.55 + 0.2,
        vx: -0.3,
      })
    }
    starsRef.current = stars
  }, [size])

  // Watch for quaternion changes → start new animation
  useEffect(() => {
    const toArr = quatToArr(currentQuaternion)
    // Compute the gate being applied: G = to * conj(from)
    // At this point displayQuatRef.current is the last rendered frame position, which
    // becomes `from` in the new animation. qNorm guards against accumulated float drift.
    const deltaGate = qNorm(qMul(toArr, qConj(displayQuatRef.current)))
    animRef.current = {
      from: [...displayQuatRef.current],
      to: toArr,
      startTime: performance.now(),
      running: true,
      deltaGate,
    }
    // Show the manifold field at full opacity for the duration of this animation
    manifoldOpacityRef.current = 1
    manifoldFadingRef.current = false
  }, [currentQuaternion])

  // Main RAF loop
  useEffect(() => {
    let lastStarUpdate = 0

    const loop = (now: number) => {
      let changed = false

      // Animate gate transition
      if (animRef.current.running) {
        const elapsed = now - animRef.current.startTime
        const t = Math.min(elapsed / ANIM_DURATION, 1)
        const easedT = easeInOutCubic(t)
        const q = qSlerp(animRef.current.from, animRef.current.to, easedT)
        displayQuatRef.current = q

        // Manifold field: left-multiply every Hopf sample by the partial gate
        // qFrame = slerp(I, G, t) — same easing as the spinor animation
        const qFrame = qSlerp([1, 0, 0, 0], animRef.current.deltaGate, easedT)
        manifoldBlochRef.current = HOPF_SAMPLES.map((p) => {
          const tp = qMul(qFrame, p)
          return blochFromQuat({ w: tp[0], x: tp[1], y: tp[2], z: tp[3] }) as [number, number, number]
        })

        if (t >= 1) {
          animRef.current.running = false
          // Begin fade-out of the manifold field
          manifoldFadingRef.current = true
          manifoldFadeStartRef.current = now
        }
        changed = true
      }

      // Fade out manifold field after the gate animation ends
      if (manifoldFadingRef.current) {
        const fadeElapsed = now - manifoldFadeStartRef.current
        manifoldOpacityRef.current = Math.max(0, 1 - fadeElapsed / MANIFOLD_FADE_DURATION)
        if (manifoldOpacityRef.current <= 0) {
          manifoldFadingRef.current = false
          manifoldBlochRef.current = []
        }
        changed = true
      }

      // Add to path history (throttled — every 3 frames)
      tickRef.current++
      if (tickRef.current % 3 === 0) {
        const [bx, by, bz] = blochFromQuat({
          w: displayQuatRef.current[0],
          x: displayQuatRef.current[1],
          y: displayQuatRef.current[2],
          z: displayQuatRef.current[3],
        })
        const last = pathHistoryRef.current[pathHistoryRef.current.length - 1]
        if (!last || Math.hypot(bx - last[0], by - last[1], bz - last[2]) > MIN_PATH_DISTANCE) {
          pathHistoryRef.current = [
            ...pathHistoryRef.current.slice(-MAX_PATH + 1),
            [bx, by, bz],
          ]
          changed = true
        }
      }

      // Drift stars (40 fps)
      if (now - lastStarUpdate > 25) {
        lastStarUpdate = now
        starsRef.current.forEach((s) => {
          s.x += s.vx
          if (s.x < 0) s.x += size.w
          if (s.x > size.w) s.x -= size.w
        })
        changed = true
      }

      // Re-render during camera drag
      if (isDraggingRef.current) changed = true

      if (changed) forceRender((n) => n + 1)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [size])

  // ─── Mouse drag to rotate camera ────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true
    lastMouseRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || !lastMouseRef.current) return
    const dx = e.clientX - lastMouseRef.current.x
    const dy = e.clientY - lastMouseRef.current.y
    lastMouseRef.current = { x: e.clientX, y: e.clientY }

    const sensitivity = ROTATION_SENSITIVITY
    const axis: [number, number, number] = [dy, dx, 0]
    const len = Math.sqrt(axis[0] ** 2 + axis[1] ** 2)
    if (len > 0) {
      const na: [number, number, number] = [axis[0] / len, axis[1] / len, 0]
      const angle = len * sensitivity
      const s = Math.sin(angle / 2)
      const dq = [Math.cos(angle / 2), na[0] * s, na[1] * s, 0]
      viewQuatRef.current = qNorm(qMul(dq, viewQuatRef.current))
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
    lastMouseRef.current = null
  }, [])

  // Touch events for mobile
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    lastTouchRef.current = { x: t.clientX, y: t.clientY }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!lastTouchRef.current) return
    const t = e.touches[0]
    const dx = t.clientX - lastTouchRef.current.x
    const dy = t.clientY - lastTouchRef.current.y
    lastTouchRef.current = { x: t.clientX, y: t.clientY }

    const sensitivity = ROTATION_SENSITIVITY
    const axis: [number, number, number] = [dy, dx, 0]
    const len = Math.sqrt(axis[0] ** 2 + axis[1] ** 2)
    if (len > 0) {
      const na: [number, number, number] = [axis[0] / len, axis[1] / len, 0]
      const angle = len * sensitivity
      const s = Math.sin(angle / 2)
      const dq = [Math.cos(angle / 2), na[0] * s, na[1] * s, 0]
      viewQuatRef.current = qNorm(qMul(dq, viewQuatRef.current))
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    lastTouchRef.current = null
  }, [])

  // ─── Render helpers ────────────────────────────────────────────────────

  const W = size.w
  const H = size.h

  // Direct projection function — reads viewQuatRef.current at render time
  const proj = (p: [number, number, number]) =>
    project(p, viewQuatRef.current, W, H, SPHERE_SCALE, FOV)

  // Apply display quaternion to rotate every wire point on the sphere:
  // p' = q p q*  (quaternion sandwich, i.e. q = cos φ + u sin φ acting on S²)
  const dqRot = displayQuatRef.current

  // Bloch sphere wireframe paths
  const sphereLines: string[] = []
  const LAT = 18
  const LON = 24
  for (let i = 0; i <= LAT; i++) {
    const theta = (i / LAT) * Math.PI
    const r = Math.sin(theta)
    const z = Math.cos(theta)
    const pts = []
    for (let j = 0; j <= LON; j++) {
      const phi = (j / LON) * Math.PI * 2
      const p = proj(rotateVec([r * Math.cos(phi), r * Math.sin(phi), z], dqRot))
      pts.push(`${j === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    }
    sphereLines.push(pts.join(' '))
  }
  for (let j = 0; j < LON; j++) {
    const phi = (j / LON) * Math.PI * 2
    const pts = []
    for (let i = 0; i <= LAT; i++) {
      const theta = (i / LAT) * Math.PI
      const r = Math.sin(theta)
      const z = Math.cos(theta)
      const p = proj(rotateVec([r * Math.cos(phi), r * Math.sin(phi), z], dqRot))
      pts.push(`${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    }
    sphereLines.push(pts.join(' '))
  }

  // Equatorial ring (rotates with the sphere)
  const eqPts = []
  for (let j = 0; j <= 64; j++) {
    const phi = (j / 64) * Math.PI * 2
    const p = proj(rotateVec([Math.cos(phi), Math.sin(phi), 0], dqRot))
    eqPts.push(`${j === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
  }
  const eqPath = eqPts.join(' ')

  // Axes
  const AXIS_LEN = 1.35
  const ax = { x: proj([-AXIS_LEN, 0, 0]), px: proj([AXIS_LEN, 0, 0]) }
  const ay = { x: proj([0, -AXIS_LEN, 0]), px: proj([0, AXIS_LEN, 0]) }
  const az = { x: proj([0, 0, -AXIS_LEN]), px: proj([0, 0, AXIS_LEN]) }

  // State vector (Bloch vector)
  const dq = dqRot
  const [bx, by, bz] = blochFromQuat({ w: dq[0], x: dq[1], y: dq[2], z: dq[3] })
  const tipProj = proj([bx, by, bz])
  const originProj = proj([0, 0, 0])

  // Pole projections — rotate with the sphere
  const northPole = proj(rotateVec([0, 0, 1], dqRot))
  const southPole = proj(rotateVec([0, 0, -1], dqRot))

  // Path segments
  const pathSegs: { x1: number; y1: number; x2: number; y2: number; t: number }[] = []
  const ph = pathHistoryRef.current
  for (let i = 1; i < ph.length; i++) {
    const p1 = proj(ph[i - 1])
    const p2 = proj(ph[i])
    pathSegs.push({
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      t: i / ph.length,
    })
  }

  // Label positions (slightly beyond axis tips and rotated poles)
  const LABEL_OFFSET = 1.5
  const lx = proj([LABEL_OFFSET, 0, 0])
  const ly = proj([0, LABEL_OFFSET, 0])
  const lz = proj([0, 0, LABEL_OFFSET])
  const lNorth = proj(rotateVec([0, 0, 1.6], dqRot))
  const lSouth = proj(rotateVec([0, 0, -1.6], dqRot))

  // Manifold field: project each Hopf sample's current Bloch vector to screen
  const manifoldDots = manifoldBlochRef.current.map(([mbx, mby, mbz]: [number, number, number]) => {
    const p = proj([mbx, mby, mbz])
    return { x: p.x, y: p.y, depth: p.depth }
  })

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative select-none"
      style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background */}
        <rect width={W} height={H} fill="#0a0e1a" />

        {/* Glow filter for the sphere */}
        <defs>
          <filter id="sphere-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Stars */}
        <g>
          {starsRef.current.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="white"
              opacity={s.opacity}
            />
          ))}
        </g>

        {/* Sphere wireframe — entire grid rotates with the quantum state (glowing cyan) */}
        <g filter="url(#sphere-glow)" opacity={0.5} stroke="#22d3ee" strokeWidth={0.9} fill="none">
          {sphereLines.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {/* Equatorial ring (rotates with sphere, brighter accent) */}
        <path d={eqPath} stroke="#67e8f9" strokeWidth={1.8} fill="none" opacity={0.75} filter="url(#sphere-glow)" />

        {/* XYZ axes */}
        <line
          x1={ax.x.x} y1={ax.x.y} x2={ax.px.x} y2={ax.px.y}
          stroke="#f87171" strokeWidth={1.5} opacity={0.7}
        />
        <line
          x1={ay.x.x} y1={ay.x.y} x2={ay.px.x} y2={ay.px.y}
          stroke="#86efac" strokeWidth={1.5} opacity={0.7}
        />
        <line
          x1={az.x.x} y1={az.x.y} x2={az.px.x} y2={az.px.y}
          stroke="#93c5fd" strokeWidth={1.5} opacity={0.7}
        />

        {/* Axis labels */}
        <text x={lx.x + 8} y={lx.y} fill="#f87171" fontSize={13} fontFamily="monospace" opacity={0.9}>x</text>
        <text x={ly.x + 8} y={ly.y} fill="#86efac" fontSize={13} fontFamily="monospace" opacity={0.9}>y</text>
        <text x={lz.x + 8} y={lz.y} fill="#93c5fd" fontSize={13} fontFamily="monospace" opacity={0.9}>z</text>

        {/* Pole markers */}
        <circle cx={northPole.x} cy={northPole.y} r={5} fill="#86efac" opacity={0.9} />
        <circle cx={southPole.x} cy={southPole.y} r={5} fill="#f87171" opacity={0.9} />
        <text x={lNorth.x + 8} y={lNorth.y + 4} fill="#86efac" fontSize={12} fontFamily="monospace" opacity={0.85}>|0⟩</text>
        <text x={lSouth.x + 8} y={lSouth.y + 4} fill="#f87171" fontSize={12} fontFamily="monospace" opacity={0.85}>|1⟩</text>

        {/* Path trail */}
        <g>
          {pathSegs.map((seg, i) => (
            <line
              key={i}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke="#ffffff"
              strokeWidth={1 + seg.t * 3.5}
              opacity={0.2 + seg.t * 0.8}
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* Manifold field — S³ coordinate transformation visualization.
            Each amber dot is one of 72 Hopf-lattice sample quaternions,
            left-multiplied by the same partial gate slerp that drives the
            state vector. All dots rotate rigidly in unison, making the
            global SU(2) isometry of S³ visible. */}
        {manifoldOpacityRef.current > 0 && manifoldDots.length > 0 && (
          <g>
            {manifoldDots.map((dot, i) => {
              // dot.depth is the z-component of the view-rotated Bloch vector.
              // Bloch vectors lie on the unit sphere, so depth ∈ [-1, 1]; no clamping needed.
              const depthAlpha = (dot.depth + 1) * 0.5
              return (
                <circle
                  key={i}
                  cx={dot.x}
                  cy={dot.y}
                  r={2.5}
                  fill="#f59e0b"
                  opacity={manifoldOpacityRef.current * (0.25 + 0.55 * depthAlpha)}
                />
              )
            })}
          </g>
        )}

        {/* State vector glow (outer) */}
        <line
          x1={originProj.x}
          y1={originProj.y}
          x2={tipProj.x}
          y2={tipProj.y}
          stroke="#22d3ee"
          strokeWidth={8}
          opacity={0.15}
          strokeLinecap="round"
        />
        {/* State vector shaft */}
        <line
          x1={originProj.x}
          y1={originProj.y}
          x2={tipProj.x}
          y2={tipProj.y}
          stroke="#22d3ee"
          strokeWidth={2.5}
          opacity={0.95}
          strokeLinecap="round"
        />
        {/* Tip glow */}
        <circle cx={tipProj.x} cy={tipProj.y} r={12} fill="#22d3ee" opacity={0.12} />
        {/* Tip dot */}
        <circle cx={tipProj.x} cy={tipProj.y} r={5} fill="#22d3ee" opacity={1} />
        <circle cx={tipProj.x} cy={tipProj.y} r={2.5} fill="white" opacity={0.9} />

        {/* Drag hint */}
        <text
          x={W - 10}
          y={H - 10}
          fill="#475569"
          fontSize={11}
          fontFamily="sans-serif"
          textAnchor="end"
        >
          drag to rotate
        </text>
      </svg>
    </div>
  )
}
