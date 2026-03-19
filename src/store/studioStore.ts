import { create } from 'zustand'
import type { GateStep, StudioMode } from '../types/circuit'
import type { Quaternion } from '../math/quaternion/types'
import { IDENTITY } from '../math/quaternion/quaternion'
import { multiply } from '../math/quaternion/quaternion'
import { DEFAULT_CIRCUIT } from '../data/defaultCircuit'
import { optimizeCircuit } from '../math/compiler/rules'

interface StudioState {
  // Mode
  mode: StudioMode
  setMode: (mode: StudioMode) => void

  // Circuit
  circuit: GateStep[]
  optimizedCircuit: GateStep[]
  optimizationNotes: string[]

  // Current step
  currentStep: number
  currentQuaternion: Quaternion

  // Navigation
  stepForward: () => void
  stepBackward: () => void
  resetCircuit: () => void
  jumpToStep: (step: number) => void

  // Active gate label (for panel display)
  activeGateLabel: string | null
}

export const useStudioStore = create<StudioState>((set, get) => ({
  mode: 'visualize',
  setMode: (mode) => set({ mode }),

  circuit: DEFAULT_CIRCUIT,
  optimizedCircuit: optimizeCircuit(DEFAULT_CIRCUIT).gates,
  optimizationNotes: optimizeCircuit(DEFAULT_CIRCUIT).notes,

  currentStep: -1, // -1 = at |0⟩ state, before any gates
  currentQuaternion: IDENTITY,
  activeGateLabel: null,

  stepForward: () => {
    const { currentStep, circuit } = get()
    if (currentStep >= circuit.length - 1) return

    const nextStep = currentStep + 1
    const newQuat = multiply(circuit[nextStep].quaternion, get().currentQuaternion)
    set({
      currentStep: nextStep,
      currentQuaternion: newQuat,
      activeGateLabel: circuit[nextStep].label,
    })
  },

  stepBackward: () => {
    const { currentStep, circuit } = get()
    if (currentStep < 0) return

    const prevStep = currentStep - 1
    // Recompute quaternion from scratch up to prevStep
    let q = IDENTITY
    for (let i = 0; i <= prevStep; i++) {
      q = multiply(circuit[i].quaternion, q)
    }
    set({
      currentStep: prevStep,
      currentQuaternion: q,
      activeGateLabel: prevStep >= 0 ? circuit[prevStep].label : null,
    })
  },

  resetCircuit: () => {
    set({
      currentStep: -1,
      currentQuaternion: IDENTITY,
      activeGateLabel: null,
    })
  },

  jumpToStep: (step: number) => {
    const { circuit } = get()
    const clampedStep = Math.max(-1, Math.min(step, circuit.length - 1))
    let q = IDENTITY
    for (let i = 0; i <= clampedStep; i++) {
      q = multiply(circuit[i].quaternion, q)
    }
    set({
      currentStep: clampedStep,
      currentQuaternion: q,
      activeGateLabel: clampedStep >= 0 ? circuit[clampedStep].label : null,
    })
  },
}))
