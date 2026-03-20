import type { Quaternion } from '../quaternion/types'

/** Spinor coefficients (α, β) as complex numbers */
export interface Spinor {
  alphaReal: number
  alphaImag: number
  betaReal: number
  betaImag: number
}

/** Bloch vector derived from spinor */
export interface BlochVec {
  bx: number
  by: number
  bz: number
}

/**
 * Convert a unit quaternion to SU(2) spinor coefficients.
 * Uses the half-angle convention: q = [w, x, y, z] = cos(θ/2) + u·sin(θ/2)
 * The spinor |ψ⟩ = U|0⟩ where U = cos(θ/2)·I - i·sin(θ/2)·(û·σ)
 *
 * Yields: α = w - i·z,  β = -y - i·x
 */
export function quatToSpinor(q: Quaternion): Spinor {
  return {
    alphaReal: q.w,
    alphaImag: -q.z,
    betaReal: -q.y,
    betaImag: -q.x,
  }
}

/**
 * Convert spinor coefficients to a Bloch vector.
 * bx = 2·Re(α*·β), by = 2·Im(α*·β), bz = |α|² - |β|²
 */
export function spinorToBloch(s: Spinor): BlochVec {
  const { alphaReal: ar, alphaImag: ai, betaReal: br, betaImag: bi } = s
  return {
    bx: 2 * (ar * br + ai * bi),
    by: 2 * (ar * bi - ai * br),
    bz: ar * ar + ai * ai - (br * br + bi * bi),
  }
}

/** Convenience: convert a quaternion directly to a Bloch vector */
export function quatToBloch(q: Quaternion): BlochVec {
  return spinorToBloch(quatToSpinor(q))
}

/** Compute Z-measurement probabilities from the Bloch z-component */
export function measurementProbabilities(bz: number): { p0: number; p1: number } {
  return {
    p0: (1 + bz) / 2,
    p1: (1 - bz) / 2,
  }
}

/** Format a complex number for display */
export function formatComplex(real: number, imag: number, precision = 3): string {
  if (Math.abs(imag) < 0.001) return real.toFixed(precision)
  const sign = imag >= 0 ? '+' : ''
  return `${real.toFixed(precision)} ${sign}${imag.toFixed(precision)}i`
}
