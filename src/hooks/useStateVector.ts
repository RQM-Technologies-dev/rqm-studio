import { useMemo } from 'react'
import type { Quaternion } from '../math/quaternion/types'
import { toAxisAngle, formatQuat, rotateVector } from '../math/quaternion/quaternion'

/**
 * Compute display data from the current quaternion state.
 *
 * The Bloch vector is derived by rotating the |0⟩ reference axis (0, 0, 1)
 * using the canonical quaternion rotation p′ = q p q* — directly implementing
 * the theory's section on "Bloch sphere from quaternion orientation".
 */
export function useStateVector(q: Quaternion) {
  return useMemo(() => {
    const axisAngle = toAxisAngle(q)
    const angleDeg = (axisAngle.angle * 180) / Math.PI

    // Rotate the |0⟩ reference axis [0, 0, 1] by the current gate quaternion.
    // This is the fundamental operation p′ = q p q* that maps the quaternion
    // rotation to its induced Bloch sphere orientation.
    const blochVector = rotateVector([0, 0, 1], q)

    return {
      blochVector,
      axisAngle,
      angleDeg,
      quatString: formatQuat(q),
    }
  }, [q])
}
