import { create } from 'zustand'
import type { GateStep, StudioMode } from '../types/circuit'
import type { Quaternion } from '../math/quaternion/types'
import type { OptimizationRunReport, BenchmarkRunResult, BenchmarkCircuitDefinition } from '../types/optimization'
import { IDENTITY, multiply, canonicalize } from '../math/quaternion/quaternion'
import { DEFAULT_CIRCUIT } from '../data/defaultCircuit'
import { optimizeCircuit } from '../math/compiler/rules'
import { runOptimization } from '../api/optimizationApi'

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

  // ── Truth Mode ──────────────────────────────────────────────────────────
  truthModeActive: boolean
  truthModeLoading: boolean
  truthModeError: string | null
  truthModeReport: OptimizationRunReport | null
  runTruthMode: (definition: BenchmarkCircuitDefinition) => Promise<void>
  clearTruthMode: () => void

  // ── Benchmark Mode ──────────────────────────────────────────────────────
  benchmarkResults: BenchmarkRunResult[]
  benchmarkRunning: boolean
  benchmarkError: string | null
  runBenchmark: (definition: BenchmarkCircuitDefinition) => Promise<void>
  clearBenchmarks: () => void
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
    // Accumulate gate: q_new = gate · q_current, then canonicalize (w ≥ 0).
    // Canonicalization selects the shorter geodesic representative on S³
    // without changing the physical rotation, giving stable display values.
    const newQuat = canonicalize(multiply(circuit[nextStep].quaternion, get().currentQuaternion))
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
    // Recompute quaternion from scratch up to prevStep and canonicalize.
    let q = IDENTITY
    for (let i = 0; i <= prevStep; i++) {
      q = multiply(circuit[i].quaternion, q)
    }
    set({
      currentStep: prevStep,
      currentQuaternion: canonicalize(q),
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
      currentQuaternion: canonicalize(q),
      activeGateLabel: clampedStep >= 0 ? circuit[clampedStep].label : null,
    })
  },

  // ── Truth Mode ────────────────────────────────────────────────────────────
  truthModeActive: false,
  truthModeLoading: false,
  truthModeError: null,
  truthModeReport: null,

  runTruthMode: async (definition) => {
    set({ truthModeActive: true, truthModeLoading: true, truthModeError: null, truthModeReport: null })
    try {
      const report = await runOptimization(definition)
      set({ truthModeLoading: false, truthModeReport: report })
    } catch (err) {
      set({
        truthModeLoading: false,
        truthModeError: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  },

  clearTruthMode: () => {
    set({ truthModeActive: false, truthModeLoading: false, truthModeError: null, truthModeReport: null })
  },

  // ── Benchmark Mode ────────────────────────────────────────────────────────
  benchmarkResults: [],
  benchmarkRunning: false,
  benchmarkError: null,

  runBenchmark: async (definition) => {
    set({ benchmarkRunning: true, benchmarkError: null })
    try {
      const report = await runOptimization(definition)
      const result: BenchmarkRunResult = {
        definition,
        report,
        ranAt: new Date().toISOString(),
      }
      set((state) => ({
        benchmarkRunning: false,
        benchmarkResults: [
          result,
          ...state.benchmarkResults.filter((r) => r.definition.circuitId !== definition.circuitId),
        ],
      }))
    } catch (err) {
      set({
        benchmarkRunning: false,
        benchmarkError: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  },

  clearBenchmarks: () => {
    set({ benchmarkResults: [], benchmarkError: null })
  },
}))
