import type { Quaternion } from '../math/quaternion/types'

/** A single gate step in a circuit */
export interface GateStep {
  id: string
  label: string
  description: string
  quaternion: Quaternion
  /** Optional angle parameter for parametric gates */
  parameter?: number
  /** Axis of rotation for display */
  axis?: [number, number, number]
  /** Color for gate badge */
  color: string
}

/** Compiler interpretation for a gate */
export interface CompilerNote {
  gateLabel: string
  geometric: string
  educational: string
  optimization?: string
}

/** Application mode */
export type StudioMode = 'optimize' | 'jobs' | 'benchmarks' | 'settings' | 'docs' | 'visualize' | 'compile' | 'eigenspinor' | 'quaternionic' | 'truth' | 'benchmark'
