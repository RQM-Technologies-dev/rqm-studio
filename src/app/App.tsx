import { AnimatePresence } from 'framer-motion'
import { Header } from './layout/Header'
import { AnimatedSVGScene } from '../render/scene/AnimatedSVGScene'
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

        {/* Central animated scene */}
        <div className="flex-1 relative">
          <AnimatedSVGScene />

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
