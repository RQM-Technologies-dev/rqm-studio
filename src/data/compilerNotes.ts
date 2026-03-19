import type { CompilerNote } from '../types/circuit'

export const COMPILER_NOTES: Record<string, CompilerNote> = {
  I: {
    gateLabel: 'I',
    geometric: 'No rotation on SU(2). The state vector is unchanged.',
    educational: 'The identity gate is a no-op. The compiler removes it automatically.',
    optimization: 'Identity gates are eliminated in the first compiler pass.',
  },
  X: {
    gateLabel: 'X',
    geometric: 'π rotation about the X-axis. Flips |0⟩ ↔ |1⟩ on the Bloch sphere.',
    educational: 'Pauli-X is the quantum NOT gate. Applying it twice returns to the original state (X·X = I).',
    optimization: 'Adjacent X gates cancel: X·X = I (inverse pair cancellation).',
  },
  Y: {
    gateLabel: 'Y',
    geometric: 'π rotation about the Y-axis. Combines bit-flip and phase-flip.',
    educational: 'Pauli-Y = iXZ. Applying twice returns identity. Y·Y = I.',
    optimization: 'Adjacent Y gates cancel: Y·Y = I.',
  },
  Z: {
    gateLabel: 'Z',
    geometric: 'π rotation about the Z-axis. Changes phase without altering measurement probability.',
    educational: 'Pauli-Z flips the phase of |1⟩. It does not change |0⟩ or |1⟩ individually.',
    optimization: 'Z = S² = T⁴. Can be fused with adjacent Z-axis rotations.',
  },
  H: {
    gateLabel: 'H',
    geometric: 'π rotation about the (X+Z)/√2 axis. Creates balanced superposition from basis states.',
    educational: 'Hadamard maps |0⟩ → |+⟩ and |1⟩ → |−⟩. H·H = I — applying it twice undoes it.',
    optimization: 'Adjacent H gates cancel: H·H = I.',
  },
  S: {
    gateLabel: 'S',
    geometric: 'π/2 rotation about the Z-axis. Quarter-turn phase gate.',
    educational: 'S = √Z. Applying S twice gives Z. S adds a phase of i to |1⟩.',
    optimization: 'S·S = Z. Adjacent S and Z-axis rotations can be fused.',
  },
  T: {
    gateLabel: 'T',
    geometric: 'π/4 rotation about the Z-axis. Eighth-turn phase gate.',
    educational: 'T = √S = ⁴√Z. The T gate is crucial for universal quantum computation.',
    optimization: 'T·T = S. T·T·T·T = Z. Consecutive T gates on the same axis fuse.',
  },
}
