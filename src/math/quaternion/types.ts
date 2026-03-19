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
