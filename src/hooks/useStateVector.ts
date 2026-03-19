import { useMemo } from 'react'
import type { Quaternion } from '../math/quaternion/types'
import { toAxisAngle, formatQuat } from '../math/quaternion/quaternion'

/** Compute display data from the current quaternion state */
export function useStateVector(q: Quaternion) {
  return useMemo(() => {
    const axisAngle = toAxisAngle(q)
    const axisDeg = (axisAngle.angle * 180) / Math.PI

    const [ax, ay, az] = axisAngle.axis
    const angle = axisAngle.angle

    // Rodrigues' rotation formula applied to (0, 0, 1) — the |0⟩ Bloch vector
    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)

    const vx = (1 - cosA) * ax * az + sinA * ay
    const vy = (1 - cosA) * ay * az - sinA * ax
    const vz = cosA + (1 - cosA) * az * az

    return {
      blochVector: [vx, vy, vz] as [number, number, number],
      axisAngle,
      axisDeg,
      quatString: formatQuat(q),
    }
  }, [q])
}
