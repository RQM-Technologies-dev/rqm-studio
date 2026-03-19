import type { GateStep } from '../../types/circuit'
import { isIdentity, areInverses, composeGates } from '../su2/gates'
import { toAxisAngle } from '../quaternion'

/** Result of a compiler pass */
export interface CompilerResult {
  gates: GateStep[]
  notes: string[]
  optimized: boolean
}

/**
 * Remove identity gates from a circuit.
 */
export function removeIdentities(gates: GateStep[]): CompilerResult {
  const notes: string[] = []
  const result = gates.filter((g) => {
    if (isIdentity(g.quaternion)) {
      notes.push(`Removed identity gate ${g.label} (no-op)`)
      return false
    }
    return true
  })
  return { gates: result, notes, optimized: notes.length > 0 }
}

/**
 * Cancel adjacent inverse pairs (e.g. X·X = I, H·H = I).
 */
export function cancelInversePairs(gates: GateStep[]): CompilerResult {
  const notes: string[] = []
  const result: GateStep[] = []
  let i = 0
  while (i < gates.length) {
    if (i + 1 < gates.length && areInverses(gates[i].quaternion, gates[i + 1].quaternion)) {
      notes.push(`Cancelled inverse pair: ${gates[i].label}·${gates[i + 1].label} = I`)
      i += 2
    } else {
      result.push(gates[i])
      i++
    }
  }
  return { gates: result, notes, optimized: notes.length > 0 }
}

/**
 * Fuse adjacent rotations about the same axis.
 */
export function fuseSameAxisRotations(gates: GateStep[]): CompilerResult {
  const notes: string[] = []
  const result: GateStep[] = []
  let i = 0

  while (i < gates.length) {
    if (i + 1 < gates.length) {
      const a = toAxisAngle(gates[i].quaternion)
      const b = toAxisAngle(gates[i + 1].quaternion)

      const sameAxis =
        Math.abs(a.axis[0] - b.axis[0]) < 0.01 &&
        Math.abs(a.axis[1] - b.axis[1]) < 0.01 &&
        Math.abs(a.axis[2] - b.axis[2]) < 0.01

      if (sameAxis && a.angle > 0.001 && b.angle > 0.001) {
        const fusedQuat = composeGates([gates[i].quaternion, gates[i + 1].quaternion])
        const fusedAngle = (a.angle + b.angle).toFixed(3)
        notes.push(
          `Fused ${gates[i].label}·${gates[i + 1].label} → single Rz(${fusedAngle}) rotation`,
        )
        result.push({
          ...gates[i],
          label: `${gates[i].label}·${gates[i + 1].label}`,
          quaternion: fusedQuat,
        })
        i += 2
        continue
      }
    }
    result.push(gates[i])
    i++
  }

  return { gates: result, notes, optimized: notes.length > 0 }
}

/**
 * Run all optimization passes in sequence.
 */
export function optimizeCircuit(gates: GateStep[]): CompilerResult {
  let current = gates
  const allNotes: string[] = []

  const passes = [removeIdentities, cancelInversePairs, fuseSameAxisRotations]

  for (const pass of passes) {
    const result = pass(current)
    current = result.gates
    allNotes.push(...result.notes)
  }

  return {
    gates: current,
    notes: allNotes,
    optimized: allNotes.length > 0,
  }
}
