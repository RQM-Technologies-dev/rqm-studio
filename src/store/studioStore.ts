import { create } from 'zustand'
import type { GateStep, StudioMode } from '../types/circuit'
import type { Quaternion } from '../math/quaternion/types'
import type { OptimizeResponseData, OptimizeMeta, JobItem, RqmCircuit } from '../types/optimization'
import { IDENTITY, multiply, canonicalize } from '../math/quaternion/quaternion'
import { DEFAULT_CIRCUIT } from '../data/defaultCircuit'
import { optimizeCircuit } from '../math/compiler/rules'
import { optimizeCircuitApi, getExampleCircuit } from '../api/optimizationApi'

function getErrorCode(err: unknown): string {
  return err instanceof Error && 'code' in err ? (err as { code: string }).code : 'UNKNOWN'
}

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

  // Active gate label
  activeGateLabel: string | null

  // ── Optimize ─────────────────────────────────────────────────────────────
  optimizeLoading: boolean
  optimizeError: string | null
  optimizeErrorCode: string | null
  optimizeResult: OptimizeResponseData | null
  optimizeMeta: OptimizeMeta | null
  runOptimize: (circuit: RqmCircuit) => Promise<void>
  runQuickstart: () => Promise<void>
  clearOptimize: () => void

  // ── Jobs ─────────────────────────────────────────────────────────────────
  jobs: JobItem[]
  addJob: (job: JobItem) => void
  clearJobs: () => void

  // ── Settings (in-memory only) ─────────────────────────────────────────────
  ibmToken: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
  awsRegion: string
  setIbmToken: (token: string) => void
  setAwsCredentials: (keyId: string, secret: string, region?: string) => void
}

export const useStudioStore = create<StudioState>((set, get) => ({
  mode: 'optimize',
  setMode: (mode) => set({ mode }),

  circuit: DEFAULT_CIRCUIT,
  optimizedCircuit: optimizeCircuit(DEFAULT_CIRCUIT).gates,
  optimizationNotes: optimizeCircuit(DEFAULT_CIRCUIT).notes,

  currentStep: -1,
  currentQuaternion: IDENTITY,
  activeGateLabel: null,

  stepForward: () => {
    const { currentStep, circuit } = get()
    if (currentStep >= circuit.length - 1) return
    const nextStep = currentStep + 1
    const newQuat = canonicalize(multiply(circuit[nextStep].quaternion, get().currentQuaternion))
    set({ currentStep: nextStep, currentQuaternion: newQuat, activeGateLabel: circuit[nextStep].label })
  },

  stepBackward: () => {
    const { currentStep, circuit } = get()
    if (currentStep < 0) return
    const prevStep = currentStep - 1
    let q = IDENTITY
    for (let i = 0; i <= prevStep; i++) {
      q = multiply(circuit[i].quaternion, q)
    }
    set({ currentStep: prevStep, currentQuaternion: canonicalize(q), activeGateLabel: prevStep >= 0 ? circuit[prevStep].label : null })
  },

  resetCircuit: () => {
    set({ currentStep: -1, currentQuaternion: IDENTITY, activeGateLabel: null })
  },

  jumpToStep: (step: number) => {
    const { circuit } = get()
    const clampedStep = Math.max(-1, Math.min(step, circuit.length - 1))
    let q = IDENTITY
    for (let i = 0; i <= clampedStep; i++) {
      q = multiply(circuit[i].quaternion, q)
    }
    set({ currentStep: clampedStep, currentQuaternion: canonicalize(q), activeGateLabel: clampedStep >= 0 ? circuit[clampedStep].label : null })
  },

  // ── Optimize ──────────────────────────────────────────────────────────────
  optimizeLoading: false,
  optimizeError: null,
  optimizeErrorCode: null,
  optimizeResult: null,
  optimizeMeta: null,

  runOptimize: async (circuit: RqmCircuit) => {
    set({ optimizeLoading: true, optimizeError: null, optimizeErrorCode: null, optimizeResult: null, optimizeMeta: null })
    try {
      const { data, meta } = await optimizeCircuitApi(circuit)
      set({ optimizeLoading: false, optimizeResult: data, optimizeMeta: meta })
      const job: JobItem = {
        id: meta.request_id,
        type: 'optimize',
        status: 'completed',
        submittedAt: new Date().toISOString(),
        circuitName: circuit.name,
        requestId: meta.request_id,
        processingTimeMs: meta.processing_time_ms,
        summary: data.summary,
        report: data.report,
      }
      get().addJob(job)
    } catch (err) {
      set({
        optimizeLoading: false,
        optimizeError: err instanceof Error ? err.message : 'Unknown error',
        optimizeErrorCode: getErrorCode(err),
      })
    }
  },

  runQuickstart: async () => {
    set({ optimizeLoading: true, optimizeError: null, optimizeErrorCode: null, optimizeResult: null, optimizeMeta: null, mode: 'optimize' })
    try {
      const exampleCircuit = await getExampleCircuit()
      const { data, meta } = await optimizeCircuitApi(exampleCircuit)
      set({ optimizeLoading: false, optimizeResult: data, optimizeMeta: meta })
      const job: JobItem = {
        id: meta.request_id,
        type: 'optimize',
        status: 'completed',
        submittedAt: new Date().toISOString(),
        circuitName: exampleCircuit.name ?? 'example',
        requestId: meta.request_id,
        processingTimeMs: meta.processing_time_ms,
        summary: data.summary,
        report: data.report,
      }
      get().addJob(job)
    } catch (err) {
      set({
        optimizeLoading: false,
        optimizeError: err instanceof Error ? err.message : 'Unknown error',
        optimizeErrorCode: getErrorCode(err),
      })
    }
  },

  clearOptimize: () => {
    set({ optimizeLoading: false, optimizeError: null, optimizeErrorCode: null, optimizeResult: null, optimizeMeta: null })
  },

  // ── Jobs ───────────────────────────────────────────────────────────────────
  jobs: [],
  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs].slice(0, 50) })),
  clearJobs: () => set({ jobs: [] }),

  // ── Settings ───────────────────────────────────────────────────────────────
  ibmToken: '',
  awsAccessKeyId: '',
  awsSecretAccessKey: '',
  awsRegion: 'us-east-1',
  setIbmToken: (token) => set({ ibmToken: token }),
  setAwsCredentials: (keyId, secret, region) =>
    set({ awsAccessKeyId: keyId, awsSecretAccessKey: secret, awsRegion: region ?? get().awsRegion }),
}))
