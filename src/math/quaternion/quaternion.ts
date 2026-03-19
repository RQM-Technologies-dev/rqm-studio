import type { Quaternion, AxisAngle, Vec3 } from './types'

/** Construct a quaternion from components */
export function quat(w: number, x: number, y: number, z: number): Quaternion {
  return { w, x, y, z }
}

/** Identity quaternion (no rotation) */
export const IDENTITY: Quaternion = { w: 1, x: 0, y: 0, z: 0 }

/** Compute the norm (magnitude) of a quaternion */
export function norm(q: Quaternion): number {
  return Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z)
}

/** Normalize a quaternion to unit length */
export function normalize(q: Quaternion): Quaternion {
  const n = norm(q)
  if (n < 1e-10) return IDENTITY
  return { w: q.w / n, x: q.x / n, y: q.y / n, z: q.z / n }
}

/**
 * Hamilton product of two quaternions.
 * Represents composition of rotations: apply p first, then q.
 */
export function multiply(q: Quaternion, p: Quaternion): Quaternion {
  return normalize({
    w: q.w * p.w - q.x * p.x - q.y * p.y - q.z * p.z,
    x: q.w * p.x + q.x * p.w + q.y * p.z - q.z * p.y,
    y: q.w * p.y - q.x * p.z + q.y * p.w + q.z * p.x,
    z: q.w * p.z + q.x * p.y - q.y * p.x + q.z * p.w,
  })
}

/** Conjugate of a unit quaternion (equals its inverse) */
export function conjugate(q: Quaternion): Quaternion {
  return { w: q.w, x: -q.x, y: -q.y, z: -q.z }
}

/** Check if two quaternions are approximately equal (up to global phase) */
export function approxEqual(q: Quaternion, p: Quaternion, eps = 1e-6): boolean {
  const d1 = Math.abs(q.w - p.w) + Math.abs(q.x - p.x) + Math.abs(q.y - p.y) + Math.abs(q.z - p.z)
  const d2 = Math.abs(q.w + p.w) + Math.abs(q.x + p.x) + Math.abs(q.y + p.y) + Math.abs(q.z + p.z)
  return Math.min(d1, d2) < eps
}

/**
 * Convert a unit quaternion to axis-angle form.
 * q = cos(θ/2) + sin(θ/2)(xi + yj + zk)
 */
export function toAxisAngle(q: Quaternion): AxisAngle {
  const nq = normalize(q)
  // Clamp w to avoid NaN from floating point
  const w = Math.max(-1, Math.min(1, nq.w))
  const angle = 2 * Math.acos(Math.abs(w))
  const s = Math.sqrt(1 - w * w)
  const sign = w < 0 ? -1 : 1

  if (s < 1e-6) {
    // No rotation — axis is arbitrary
    return { axis: [0, 0, 1], angle: 0 }
  }

  return {
    axis: [(sign * nq.x) / s, (sign * nq.y) / s, (sign * nq.z) / s],
    angle,
  }
}

/**
 * Construct a rotation quaternion from axis-angle.
 * axis must be a unit vector.
 */
export function fromAxisAngle(axis: Vec3, angle: number): Quaternion {
  const half = angle / 2
  const s = Math.sin(half)
  return normalize({
    w: Math.cos(half),
    x: axis[0] * s,
    y: axis[1] * s,
    z: axis[2] * s,
  })
}

/** Format a quaternion for display */
export function formatQuat(q: Quaternion, precision = 3): string {
  const fmt = (n: number) => n.toFixed(precision)
  const xi = q.x >= 0 ? `+${fmt(q.x)}i` : `${fmt(q.x)}i`
  const yj = q.y >= 0 ? `+${fmt(q.y)}j` : `${fmt(q.y)}j`
  const zk = q.z >= 0 ? `+${fmt(q.z)}k` : `${fmt(q.z)}k`
  return `${fmt(q.w)}${xi}${yj}${zk}`
}
