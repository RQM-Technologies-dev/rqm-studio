/**
 * Interpolate the hypersphere/Bloch sphere display colour based on the Bloch
 * z-component (bz).
 *
 *   bz = +1  →  |0⟩  →  green  rgb(34, 197, 94)  (#22c55e)
 *   bz =  0  →  superposition  →  mid (teal-ish)
 *   bz = -1  →  |1⟩  →  blue   rgb(59, 130, 246)  (#3b82f6)
 */
export function blochStateColor(bz: number): string {
  const t = (bz + 1) / 2 // t=1 → |0⟩ (green), t=0 → |1⟩ (blue)
  const r = Math.round(34 + (59 - 34) * (1 - t))
  const g = Math.round(197 + (130 - 197) * (1 - t))
  const b = Math.round(94 + (246 - 94) * (1 - t))
  return `rgb(${r},${g},${b})`
}
