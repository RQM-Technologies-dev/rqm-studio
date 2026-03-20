import { useRef, useEffect, useState } from 'react'
import { useStudioStore } from '../../store'
import type { Quaternion } from '../../math/quaternion/types'
import { blochStateColor } from '../../math/blochColor'

// ─── Math helpers (inline, no external deps) ──────────────────────────────

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
  if (dot < 0) { dot = -dot; q2a = q2a.map((v) => -v) }
  if (dot > 0.9995) {
    return qNorm([
      q1[0] + t * (q2a[0] - q1[0]), q1[1] + t * (q2a[1] - q1[1]),
      q1[2] + t * (q2a[2] - q1[2]), q1[3] + t * (q2a[3] - q1[3]),
    ])
  }
  const theta0 = Math.acos(dot)
  const sinTheta = Math.sin(theta0)
  const w1 = Math.sin((1 - t) * theta0) / sinTheta
  const w2 = Math.sin(t * theta0) / sinTheta
  return [w1 * q1[0] + w2 * q2a[0], w1 * q1[1] + w2 * q2a[1], w1 * q1[2] + w2 * q2a[2], w1 * q1[3] + w2 * q2a[3]]
}

function rotateVec(v: [number, number, number], q: number[]): [number, number, number] {
  const vq = [0, v[0], v[1], v[2]]
  const res = qMul(qMul(q, vq), qConj(q))
  return [res[1], res[2], res[3]]
}

function blochFromQuat(q: Quaternion): [number, number, number] {
  const { w, x, y, z } = q
  return [2 * (x * z + w * y), 2 * (y * z - w * x), w * w - x * x - y * y + z * z]
}

function quatToArr(q: Quaternion): number[] {
  return [q.w, q.x, q.y, q.z]
}

function easeInOut(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

// ─── Fixed "textbook" view quaternion for the Bloch sphere overlay ─────────
// Slightly elevated and rotated so x, y, z axes are all visible
const VIEW_Q: number[] = qNorm([0.94, 0.10, 0.32, 0.03])

// Orthographic projection for the overlay (no perspective distortion)
function orthoProject(
  p: [number, number, number],
  viewQ: number[],
  cx: number,
  cy: number,
  R: number,
): { x: number; y: number; depth: number } {
  const r = rotateVec(p, viewQ)
  return { x: cx + r[0] * R, y: cy - r[1] * R, depth: r[2] }
}

const ANIM_DURATION = 2400

// ─── Component ────────────────────────────────────────────────────────────

export function BlochSphereWidget() {
  const currentQuaternion = useStudioStore((s) => s.currentQuaternion)

  const displayQuatRef = useRef<number[]>([1, 0, 0, 0])
  const animRef = useRef<{ from: number[]; to: number[]; startTime: number; running: boolean }>({
    from: [1, 0, 0, 0], to: [1, 0, 0, 0], startTime: 0, running: false,
  })
  const rafRef = useRef<number>(0)
  const [, forceRender] = useState(0)

  // Trigger animation on quaternion change
  useEffect(() => {
    animRef.current = {
      from: [...displayQuatRef.current],
      to: quatToArr(currentQuaternion),
      startTime: performance.now(),
      running: true,
    }
  }, [currentQuaternion])

  // RAF loop
  useEffect(() => {
    const loop = (now: number) => {
      if (animRef.current.running) {
        const t = Math.min((now - animRef.current.startTime) / ANIM_DURATION, 1)
        displayQuatRef.current = qSlerp(animRef.current.from, animRef.current.to, easeInOut(t))
        if (t >= 1) animRef.current.running = false
        forceRender((n) => n + 1)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // ─── Render ─────────────────────────────────────────────────────────────

  const SIZE = 220
  const cx = SIZE / 2
  const cy = SIZE / 2
  const R = 82

  const dq = displayQuatRef.current
  const proj = (p: [number, number, number]) => orthoProject(p, VIEW_Q, cx, cy, R)

  // Bloch vector
  const [bx, by, bz] = blochFromQuat({ w: dq[0], x: dq[1], y: dq[2], z: dq[3] })
  const stateCol = blochStateColor(bz)

  // Wireframe: latitude circles
  const LAT = 9
  const LON = 12
  const latLines: { d: string; depth: number }[] = []
  for (let i = 1; i < LAT; i++) {
    const theta = (i / LAT) * Math.PI
    const rr = Math.sin(theta)
    const z = Math.cos(theta)
    const pts: string[] = []
    for (let j = 0; j <= LON * 2; j++) {
      const phi = (j / (LON * 2)) * Math.PI * 2
      const p = proj([rr * Math.cos(phi), rr * Math.sin(phi), z])
      pts.push(`${j === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    }
    const centerProj = proj([0, 0, z])
    latLines.push({ d: pts.join(' '), depth: centerProj.depth })
  }

  // Longitude lines
  const lonLines: { d: string; depth: number }[] = []
  for (let j = 0; j < LON; j++) {
    const phi = (j / LON) * Math.PI * 2
    const pts: string[] = []
    for (let i = 0; i <= LAT; i++) {
      const theta = (i / LAT) * Math.PI
      const rr = Math.sin(theta)
      const z = Math.cos(theta)
      const p = proj([rr * Math.cos(phi), rr * Math.sin(phi), z])
      pts.push(`${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    }
    const midProj = proj([Math.cos(phi), Math.sin(phi), 0])
    lonLines.push({ d: pts.join(' '), depth: midProj.depth })
  }

  // Axes
  const ALEN = 1.28
  const ax = { n: proj([-ALEN, 0, 0]), p: proj([ALEN, 0, 0]) }
  const ay = { n: proj([0, -ALEN, 0]), p: proj([0, ALEN, 0]) }
  const az = { n: proj([0, 0, -ALEN]), p: proj([0, 0, ALEN]) }

  // Poles
  const north = proj([0, 0, 1])
  const south = proj([0, 0, -1])
  const lNorth = proj([0, 0, 1.45])
  const lSouth = proj([0, 0, -1.45])

  // State vector
  const origin = proj([0, 0, 0])
  const tip = proj([bx, by, bz])

  // Arrowhead calculation
  const dx = tip.x - origin.x
  const dy = tip.y - origin.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = dx / len
  const ny = dy / len
  const arrowSize = 7
  const arrow = [
    `${tip.x},${tip.y}`,
    `${tip.x - arrowSize * nx + arrowSize * 0.4 * ny},${tip.y - arrowSize * ny - arrowSize * 0.4 * nx}`,
    `${tip.x - arrowSize * nx - arrowSize * 0.4 * ny},${tip.y - arrowSize * ny + arrowSize * 0.4 * nx}`,
  ].join(' ')

  return (
    <div
      className="absolute top-3 left-3 z-10 rounded-xl overflow-hidden select-none"
      style={{
        width: SIZE,
        height: SIZE,
        background: 'rgba(10, 14, 26, 0.85)',
        border: '1px solid rgba(100,116,139,0.3)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <svg width={SIZE} height={SIZE}>
        {/* Glow filter */}
        <defs>
          <filter id="bloch-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Title */}
        <text x={cx} y={14} textAnchor="middle" fill="#94a3b8" fontSize={9} fontFamily="sans-serif" letterSpacing="0.08em">
          BLOCH SPHERE
        </text>

        {/* Back wireframe (depth < 0) */}
        {latLines.filter(l => l.depth < 0).map((l, i) => (
          <path key={`lat-b-${i}`} d={l.d} stroke={stateCol} strokeWidth={0.5} fill="none" opacity={0.18} />
        ))}
        {lonLines.filter(l => l.depth < 0).map((l, i) => (
          <path key={`lon-b-${i}`} d={l.d} stroke={stateCol} strokeWidth={0.5} fill="none" opacity={0.18} />
        ))}

        {/* Axes */}
        <line x1={ax.n.x} y1={ax.n.y} x2={ax.p.x} y2={ax.p.y} stroke="#f87171" strokeWidth={1} opacity={0.6} />
        <line x1={ay.n.x} y1={ay.n.y} x2={ay.p.x} y2={ay.p.y} stroke="#86efac" strokeWidth={1} opacity={0.6} />
        <line x1={az.n.x} y1={az.n.y} x2={az.p.x} y2={az.p.y} stroke="#93c5fd" strokeWidth={1} opacity={0.6} />

        {/* Axis labels */}
        <text x={ax.p.x + 5} y={ax.p.y + 4} fill="#f87171" fontSize={9} fontFamily="monospace">x</text>
        <text x={ay.p.x + 5} y={ay.p.y + 4} fill="#86efac" fontSize={9} fontFamily="monospace">y</text>
        <text x={az.p.x + 5} y={az.p.y + 4} fill="#93c5fd" fontSize={9} fontFamily="monospace">z</text>

        {/* State vector glow */}
        <line
          x1={origin.x} y1={origin.y} x2={tip.x} y2={tip.y}
          stroke={stateCol} strokeWidth={6} opacity={0.2} strokeLinecap="round"
          filter="url(#bloch-glow)"
        />
        {/* State vector shaft */}
        <line
          x1={origin.x} y1={origin.y} x2={tip.x} y2={tip.y}
          stroke={stateCol} strokeWidth={2} opacity={0.95} strokeLinecap="round"
        />
        {/* Arrowhead */}
        <polygon points={arrow} fill={stateCol} opacity={0.95} />

        {/* Front wireframe (depth >= 0) */}
        {latLines.filter(l => l.depth >= 0).map((l, i) => (
          <path key={`lat-f-${i}`} d={l.d} stroke={stateCol} strokeWidth={0.6} fill="none" opacity={0.3} />
        ))}
        {lonLines.filter(l => l.depth >= 0).map((l, i) => (
          <path key={`lon-f-${i}`} d={l.d} stroke={stateCol} strokeWidth={0.6} fill="none" opacity={0.3} />
        ))}

        {/* Pole markers */}
        <circle cx={north.x} cy={north.y} r={3.5} fill="#4ade80" opacity={0.9} />
        <circle cx={south.x} cy={south.y} r={3.5} fill="#60a5fa" opacity={0.9} />

        {/* Pole labels */}
        <text x={lNorth.x} y={lNorth.y - 2} textAnchor="middle" fill="#4ade80" fontSize={10} fontFamily="monospace" fontWeight="bold">|0⟩</text>
        <text x={lSouth.x} y={lSouth.y + 10} textAnchor="middle" fill="#60a5fa" fontSize={10} fontFamily="monospace" fontWeight="bold">|1⟩</text>

        {/* Tip dot */}
        <circle cx={tip.x} cy={tip.y} r={4} fill={stateCol} opacity={1} filter="url(#bloch-glow)" />
        <circle cx={tip.x} cy={tip.y} r={2} fill="white" opacity={0.9} />

        {/* bz readout at bottom */}
        <text x={cx} y={SIZE - 5} textAnchor="middle" fill="#94a3b8" fontSize={9} fontFamily="monospace">
          {`bz = ${bz.toFixed(3)}`}
        </text>
      </svg>
    </div>
  )
}
