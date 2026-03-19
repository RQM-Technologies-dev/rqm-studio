/** A quaternion q = w + xi + yj + zk */
export interface Quaternion {
  w: number
  x: number
  y: number
  z: number
}

/** Axis-angle representation of a rotation */
export interface AxisAngle {
  axis: [number, number, number]
  /** Rotation angle in radians */
  angle: number
}

/** A 3D vector */
export type Vec3 = [number, number, number]

/**
 * SU(2) matrix representation of a unit quaternion.
 *
 * For q = w + xi + yj + zk the corresponding SU(2) matrix is
 *   U = [[ w+xi,  y+zi ],
 *        [-y+zi,  w-xi ]]
 *
 * Each entry is stored as its real and imaginary parts.
 */
export interface SU2Matrix {
  /** U[0][0] = w + xi */ re00: number; im00: number
  /** U[0][1] = y + zi */ re01: number; im01: number
  /** U[1][0] = -y + zi */ re10: number; im10: number
  /** U[1][1] = w - xi */ re11: number; im11: number
}
