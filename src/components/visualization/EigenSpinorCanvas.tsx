import { useEffect, useRef, useState, useMemo } from 'react'

/**
 * EigenSpinorCanvas
 *
 * Interactive 3-D SVG visualization of the quaternionic eigen-spinor
 *   ψ_q = e^{+iωt} + e^{-iωt}
 *
 * Adapted from the Replit Quaternionic Compiler visual (EigenSpinorVisual.tsx).
 * Shows two counter-rotating helical paths that interfere to produce the
 * EigenCircle standing resonance (orange ellipse).
 */
export function EigenSpinorCanvas() {
  const [omega, setOmega] = useState(1.2)
  const [amplitude, setAmplitude] = useState(1.0)
  const [showComponents, setShowComponents] = useState(true)
  const [running, setRunning] = useState(true)
  const [phase, setPhase] = useState(0)
  const [frame, setFrame] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const qRef = useRef<[number, number, number, number]>([1, 0, 0, 0])
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null)

  // Canvas dimensions and projection
  const W = 900
  const H = 560
  const R = 250
  const FOV = 600

  // Generate base star positions (fixed in space)
  const baseStarPositions = useMemo(() => {
    const stars: Array<{ pos: [number, number, number]; r: number; opacity: number }> = []
    for (let i = 0; i < 200; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 800 + Math.random() * 400

      stars.push({
        pos: [
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi),
        ],
        r: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.8 + 0.2,
      })
    }
    return stars
  }, [])

  // Quaternion multiplication
  const quatMul = (a: number[], b: number[]): number[] => [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
  ]

  const rotateVecByQuat = (
    v: [number, number, number],
    q: number[],
  ): [number, number, number] => {
    const qConj = [q[0], -q[1], -q[2], -q[3]]
    const vq = [0, v[0], v[1], v[2]]
    const tmp = quatMul(q, vq)
    const res = quatMul(tmp, qConj)
    return [res[1], res[2], res[3]]
  }

  // Project 3-D point to 2-D
  const project = (
    p: [number, number, number],
    q: number[],
  ): { x: number; y: number; z: number } => {
    const v3 = rotateVecByQuat(p, q)
    const v = [v3[0] * R, v3[1] * R, v3[2] * R + 500]
    const persp = FOV / (FOV + v[2])
    return {
      x: v[0] * persp + W / 2,
      y: v[1] * persp + H / 2,
      z: v[2],
    }
  }

  // Mouse interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    lastMouseRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !lastMouseRef.current) return
    const dx = e.clientX - lastMouseRef.current.x
    const dy = e.clientY - lastMouseRef.current.y
    lastMouseRef.current = { x: e.clientX, y: e.clientY }

    const sensitivity = 0.01
    const axis: [number, number, number] = [dy, dx, 0]
    const len = Math.sqrt(axis[0] ** 2 + axis[1] ** 2 + axis[2] ** 2)

    if (len > 0) {
      const normAxis: [number, number, number] = [
        axis[0] / len,
        axis[1] / len,
        axis[2] / len,
      ]
      const angle = len * sensitivity
      const s = Math.sin(angle / 2)
      const dq = [Math.cos(angle / 2), normAxis[0] * s, normAxis[1] * s, normAxis[2] * s]
      qRef.current = quatMul(dq, qRef.current) as [number, number, number, number]
      setFrame((f) => f + 1)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    lastMouseRef.current = null
  }

  const handleReset = () => {
    setPhase(0)
    qRef.current = [1, 0, 0, 0]
    setFrame((f) => f + 1)
  }

  // Animation loop
  useEffect(() => {
    if (!running) return

    let animId: number
    let lastTime = performance.now()

    const animate = () => {
      const now = performance.now()
      const dt = (now - lastTime) / 1000
      lastTime = now

      if (!isDragging) {
        const axis: [number, number, number] = [0.3, 1, 0.2]
        const len = Math.sqrt(axis[0] ** 2 + axis[1] ** 2 + axis[2] ** 2)
        const normAxis: [number, number, number] = [
          axis[0] / len,
          axis[1] / len,
          axis[2] / len,
        ]
        const angle = dt * 0.15
        const s = Math.sin(angle / 2)
        const dq = [Math.cos(angle / 2), normAxis[0] * s, normAxis[1] * s, normAxis[2] * s]
        qRef.current = quatMul(dq, qRef.current) as [number, number, number, number]
      }

      setPhase((prev) => prev + omega * dt)
      setFrame((f) => f + 1)
      animId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animId)
  }, [omega, isDragging, running])

  // Helical paths for e^{+iωt} and e^{-iωt}
  const helicalPaths = useMemo(() => {
    const q = qRef.current
    const numPoints = 150
    const positiveHelix = []
    const negativeHelix = []

    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 6
      const z = (i / numPoints) * 2 - 1

      const xPos = amplitude * 0.7 * Math.cos(t)
      const yPos = amplitude * 0.7 * Math.sin(t)
      positiveHelix.push(project([xPos, yPos, z], q))

      const xNeg = amplitude * 0.7 * Math.cos(-t)
      const yNeg = amplitude * 0.7 * Math.sin(-t)
      negativeHelix.push(project([xNeg, yNeg, z], q))
    }

    return { positiveHelix, negativeHelix }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, amplitude])

  // Combined quaternionic spinor trajectory (interference ellipse)
  const spinorTrajectory = useMemo(() => {
    const q = qRef.current
    const numPoints = 100
    const points = []

    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2
      const x = amplitude * Math.cos(t)
      const y = amplitude * Math.sin(t) * 0.6
      points.push(project([x, y, 0], q))
    }

    return points
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, amplitude])

  // Current position markers
  const currentMarkers = useMemo(() => {
    const q = qRef.current
    const t = phase
    const zCurrent = ((t % (Math.PI * 6)) / (Math.PI * 6)) * 2 - 1

    const posMarker = project([amplitude * 0.7 * Math.cos(t), amplitude * 0.7 * Math.sin(t), zCurrent], q)
    const negMarker = project([amplitude * 0.7 * Math.cos(-t), amplitude * 0.7 * Math.sin(-t), zCurrent], q)

    const tSpinor = t % (Math.PI * 2)
    const spinorMarker = project([amplitude * Math.cos(tSpinor), amplitude * Math.sin(tSpinor) * 0.6, 0], q)

    return { posMarker, negMarker, spinorMarker }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, phase, amplitude])

  // Critical-sphere wireframe
  const criticalSphere = useMemo(() => {
    const q = qRef.current
    const circles = []

    for (let j = 0; j < 8; j++) {
      const z = -0.8 + (j / 7) * 1.6
      const r = Math.sqrt(Math.max(0, 1 - z * z))
      const points = []
      for (let i = 0; i <= 50; i++) {
        const angle = (i / 50) * Math.PI * 2
        points.push(project([r * Math.cos(angle), r * Math.sin(angle), z], q))
      }
      circles.push(points)
    }

    for (let j = 0; j < 8; j++) {
      const azimuth = (j / 8) * Math.PI * 2
      const points = []
      for (let i = 0; i <= 50; i++) {
        const theta = (i / 50) * Math.PI
        points.push(
          project(
            [Math.sin(theta) * Math.cos(azimuth), Math.sin(theta) * Math.sin(azimuth), Math.cos(theta)],
            q,
          ),
        )
      }
      circles.push(points)
    }

    return circles
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame])

  // Starfield
  const stars = useMemo(() => {
    const q = qRef.current
    const result = []

    for (const star of baseStarPositions) {
      const rot = rotateVecByQuat(star.pos, q)
      const v = [rot[0], rot[1], rot[2] + 500]
      const persp = FOV / (FOV + v[2])
      const x2 = v[0] * persp + W / 2
      const y2 = v[1] * persp + H / 2

      if (x2 >= 0 && x2 <= W && y2 >= 0 && y2 <= H) {
        result.push({ x: x2, y: y2, r: star.r, opacity: star.opacity })
      }
    }
    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, baseStarPositions])

  const pointsToPath = (points: Array<{ x: number; y: number }>) => {
    if (points.length === 0) return ''
    return (
      `M ${points[0].x},${points[0].y} ` +
      points
        .slice(1)
        .map((p) => `L ${p.x},${p.y}`)
        .join(' ')
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* 3-D visualization */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          data-testid="svg-eigenspinor-visualization"
        >
          {/* Black background */}
          <rect x={0} y={0} width={W} height={H} fill="#000308" />

          {/* Starfield */}
          <g>
            {stars.map((star, i) => (
              <circle key={i} cx={star.x} cy={star.y} r={star.r} fill="white" opacity={star.opacity} />
            ))}
          </g>

          {/* Critical sphere wireframe */}
          <g opacity="0.15">
            {criticalSphere.map((circle, i) => (
              <path key={i} d={pointsToPath(circle)} fill="none" stroke="#88e5ff" strokeWidth="1" />
            ))}
          </g>

          {/* Positive-frequency helix  e^{+iωt} */}
          {showComponents && (
            <path
              d={pointsToPath(helicalPaths.positiveHelix)}
              fill="none"
              stroke="#8ef7ff"
              strokeWidth="2.5"
              opacity="0.7"
            />
          )}

          {/* Negative-frequency helix  e^{-iωt} */}
          {showComponents && (
            <path
              d={pointsToPath(helicalPaths.negativeHelix)}
              fill="none"
              stroke="#e38cff"
              strokeWidth="2.5"
              opacity="0.7"
            />
          )}

          {/* Combined spinor (interference ellipse) */}
          <path
            d={pointsToPath(spinorTrajectory) + ' Z'}
            fill="none"
            stroke="#ffb454"
            strokeWidth="3.5"
          />

          {/* Current position markers */}
          {showComponents && (
            <>
              <circle cx={currentMarkers.posMarker.x} cy={currentMarkers.posMarker.y} r="5" fill="#8ef7ff" />
              <circle cx={currentMarkers.negMarker.x} cy={currentMarkers.negMarker.y} r="5" fill="#e38cff" />
            </>
          )}
          <circle cx={currentMarkers.spinorMarker.x} cy={currentMarkers.spinorMarker.y} r="7" fill="#ffb454" />

          {/* Equation label */}
          <text x="20" y="50" fontSize="30" fontFamily="Georgia, Times New Roman, serif" fontStyle="italic" opacity="0.95">
            <tspan fill="#ffb454">ψ</tspan>
            <tspan fill="#ffb454" fontStyle="normal" fontSize="22" baselineShift="sub">q</tspan>
            <tspan fill="#ffb454"> = </tspan>
            <tspan fill="#8ef7ff">e</tspan>
            <tspan fill="#8ef7ff" fontSize="22" baselineShift="super">+iωt</tspan>
            <tspan fill="#ffb454"> + </tspan>
            <tspan fill="#e38cff">e</tspan>
            <tspan fill="#e38cff" fontSize="22" baselineShift="super">−iωt</tspan>
          </text>

          {/* Legend */}
          <g transform={`translate(20, ${H - 80})`}>
            <circle cx="8" cy="8" r="5" fill="#8ef7ff" />
            <text x="18" y="13" fontSize="12" fill="#8ef7ff">e^(+iωt) — CCW helix</text>
            <circle cx="8" cy="28" r="5" fill="#e38cff" />
            <text x="18" y="33" fontSize="12" fill="#e38cff">e^(−iωt) — CW helix</text>
            <circle cx="8" cy="48" r="5" fill="#ffb454" />
            <text x="18" y="53" fontSize="12" fill="#ffb454">ψ_q — Combined spinor</text>
          </g>

          <text x={W - 10} y={H - 10} textAnchor="end" fontSize="11" fill="#ffffff44">
            Drag to rotate
          </text>
        </svg>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-t border-slate-700/50 bg-rqm-navy-light/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Frequency ω</label>
          <input
            type="range"
            min="0.2"
            max="3"
            step="0.1"
            value={omega}
            onChange={(e) => setOmega(parseFloat(e.target.value))}
            className="w-24 accent-cyan-400"
            data-testid="input-omega"
          />
          <span className="text-xs text-cyan-300 font-mono w-8">{omega.toFixed(1)}</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Amplitude</label>
          <input
            type="range"
            min="0.3"
            max="1.5"
            step="0.1"
            value={amplitude}
            onChange={(e) => setAmplitude(parseFloat(e.target.value))}
            className="w-24 accent-amber-400"
            data-testid="input-amplitude"
          />
          <span className="text-xs text-amber-300 font-mono w-8">{amplitude.toFixed(1)}</span>
        </div>

        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showComponents}
            onChange={(e) => setShowComponents(e.target.checked)}
            className="accent-cyan-400"
            data-testid="checkbox-components"
          />
          Show helices
        </label>

        <button
          onClick={() => setRunning(!running)}
          className="px-2.5 py-1 rounded text-xs border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          data-testid="button-pause"
        >
          {running ? '⏸ Pause' : '▶ Play'}
        </button>

        <button
          onClick={handleReset}
          className="px-2.5 py-1 rounded text-xs border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          data-testid="button-reset"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
