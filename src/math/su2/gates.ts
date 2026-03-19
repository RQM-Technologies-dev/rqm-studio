import { fromAxisAngle, multiply, normalize, IDENTITY, approxEqual } from '../quaternion/quaternion'
import type { Quaternion } from '../quaternion/types'

/**
 * SU(2) gate representations as unit quaternions.
 * A single-qubit gate U in SU(2) maps to a unit quaternion
 * via q = cos(θ/2)I + i·sin(θ/2)·(n_x·X + n_y·Y + n_z·Z)
 */

const X_AXIS: [number, number, number] = [1, 0, 0]
const Y_AXIS: [number, number, number] = [0, 1, 0]
const Z_AXIS: [number, number, number] = [0, 0, 1]

/** Identity — no rotation */
export const GateI: Quaternion = IDENTITY

/** Pauli-X: π rotation about x-axis */
export const GateX: Quaternion = fromAxisAngle(X_AXIS, Math.PI)

/** Pauli-Y: π rotation about y-axis */
export const GateY: Quaternion = fromAxisAngle(Y_AXIS, Math.PI)

/** Pauli-Z: π rotation about z-axis */
export const GateZ: Quaternion = fromAxisAngle(Z_AXIS, Math.PI)

/** Hadamard: π rotation about (x+z)/√2 axis */
export const GateH: Quaternion = fromAxisAngle(
  [1 / Math.SQRT2, 0, 1 / Math.SQRT2],
  Math.PI,
)

/** S gate: π/2 rotation about z-axis */
export const GateS: Quaternion = fromAxisAngle(Z_AXIS, Math.PI / 2)

/** T gate: π/4 rotation about z-axis */
export const GateT: Quaternion = fromAxisAngle(Z_AXIS, Math.PI / 4)

/** Parametric Rx(θ): rotation by θ about x-axis */
export function GateRx(theta: number): Quaternion {
  return fromAxisAngle(X_AXIS, theta)
}

/** Parametric Ry(θ): rotation by θ about y-axis */
export function GateRy(theta: number): Quaternion {
  return fromAxisAngle(Y_AXIS, theta)
}

/** Parametric Rz(θ): rotation by θ about z-axis */
export function GateRz(theta: number): Quaternion {
  return fromAxisAngle(Z_AXIS, theta)
}

/** Compose a sequence of gates into a single quaternion */
export function composeGates(gates: Quaternion[]): Quaternion {
  return gates.reduce((acc, g) => multiply(g, acc), IDENTITY)
}

/** Check if a quaternion is the identity (up to global phase) */
export function isIdentity(q: Quaternion): boolean {
  return approxEqual(q, IDENTITY)
}

/** Check if two gates are inverses of each other */
export function areInverses(q: Quaternion, p: Quaternion): boolean {
  return isIdentity(multiply(q, p))
}

/** Return the inverse of a gate (conjugate for unit quaternions) */
export function gateInverse(q: Quaternion): Quaternion {
  return normalize({ w: q.w, x: -q.x, y: -q.y, z: -q.z })
}

/**
 * Try to match a unit quaternion against the standard named gates.
 *
 * The comparison uses `approxEqual` which handles both q ≈ gate and q ≈ −gate
 * (global-phase / SU(2) double-cover equivalence), so the function is robust to
 * canonicalization choices.
 *
 * Returns the gate label ('I', 'X', 'Y', 'Z', 'H', 'S', 'T') or null if not matched.
 */
export function recognizeGate(q: Quaternion, tolerance = 1e-4): string | null {
  const candidates: [string, Quaternion][] = [
    ['I', GateI],
    ['X', GateX],
    ['Y', GateY],
    ['Z', GateZ],
    ['H', GateH],
    ['S', GateS],
    ['T', GateT],
  ]
  for (const [label, gate] of candidates) {
    if (approxEqual(q, gate, tolerance)) return label
  }
  return null
}
