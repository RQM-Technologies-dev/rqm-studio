import { AnimatePresence } from 'framer-motion'
import { Header } from './layout/Header'
import { Scene } from '../render/scene/Scene'
import { ControlPanel } from '../components/panels/ControlPanel'
import { InspectorPanel } from '../components/panels/InspectorPanel'
import { CircuitStrip } from '../components/circuit/CircuitStrip'
import { OptimizationDemo } from '../components/overlays/OptimizationDemo'
import { QuaternionicSpinorVisual } from '../components/visualization/QuaternionicSpinorVisual'
import { EigenSpinorCanvas } from '../components/visualization/EigenSpinorCanvas'
import { useStudioStore } from '../store'

export default function App() {
  const mode = useStudioStore((s) => s.mode)

  // Full-screen immersive modes replace the standard studio layout
  if (mode === 'quaternionic') {
    return (
      <div className="flex flex-col h-screen bg-rqm-navy overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto">
          <QuaternionicSpinorVisual />
        </div>
      </div>
    )
  }

  if (mode === 'eigenspinor') {
    return (
      <div className="flex flex-col h-screen bg-rqm-navy overflow-hidden">
        <Header />
        <div className="flex-1 overflow-hidden">
          <EigenSpinorCanvas />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-rqm-navy overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left control panel */}
        <ControlPanel />

        {/* Central 3D scene */}
        <div className="flex-1 relative">
          <Scene />
          {/* Axis labels overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-1 pointer-events-none">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-red-400" />
              <span className="text-xs text-red-400 font-mono">x</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-green-400" />
              <span className="text-xs text-green-400 font-mono">y</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-blue-400" />
              <span className="text-xs text-blue-400 font-mono">z (|0⟩ axis)</span>
            </div>
          </div>

          {/* Pole labels overlay */}
          <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1">
            <span className="text-xs text-green-400/70 font-mono">|0⟩ ↑</span>
            <span className="text-xs text-red-400/70 font-mono">|1⟩ ↓</span>
          </div>

          <AnimatePresence>
            {mode === 'optimize' && <OptimizationDemo />}
          </AnimatePresence>
        </div>

        {/* Right inspector panel */}
        <InspectorPanel />
      </div>

      {/* Bottom circuit strip */}
      <CircuitStrip />
    </div>
  )
}
