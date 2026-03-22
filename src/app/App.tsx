import { AnimatePresence } from 'framer-motion'
import { Header } from './layout/Header'
import { AnimatedSVGScene } from '../render/scene/AnimatedSVGScene'
import { ControlPanel } from '../components/panels/ControlPanel'
import { InspectorPanel } from '../components/panels/InspectorPanel'
import { TruthModePanel } from '../components/panels/TruthModePanel'
import { BenchmarkPanel } from '../components/panels/BenchmarkPanel'
import { CircuitStrip } from '../components/circuit/CircuitStrip'
import { OptimizationDemo } from '../components/overlays/OptimizationDemo'
import { BlochSphereWidget } from '../components/visualization/BlochSphereWidget'
import { ExportSurface } from '../components/export/ExportSurface'
import { useStudioStore } from '../store'

export default function App() {
  const mode = useStudioStore((s) => s.mode)

  const isEvidenceMode = mode === 'truth' || mode === 'benchmark'

  return (
    <div className="flex flex-col h-screen bg-rqm-navy overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Left panel — ControlPanel for core modes, hidden in evidence modes */}
        {!isEvidenceMode && <ControlPanel />}

        {/* Truth Mode — full left panel */}
        {mode === 'truth' && (
          <div className="w-[480px] flex-shrink-0 border-r border-slate-700/50 overflow-y-auto scrollbar-thin">
            <TruthModePanel />
          </div>
        )}

        {/* Benchmark Mode — full left panel */}
        {mode === 'benchmark' && (
          <div className="w-[520px] flex-shrink-0 border-r border-slate-700/50 overflow-y-auto scrollbar-thin">
            <BenchmarkPanel />
          </div>
        )}

        {/* Central animated scene — hidden in evidence modes */}
        {!isEvidenceMode && (
          <div className="flex-1 relative">
            <AnimatedSVGScene />

            {/* Bloch sphere overlay — top left of the central scene */}
            <BlochSphereWidget />

            <AnimatePresence>
              {mode === 'optimize' && <OptimizationDemo />}
            </AnimatePresence>
          </div>
        )}

        {/* Evidence mode center: placeholder / hint */}
        {isEvidenceMode && (
          <div className="flex-1 flex items-center justify-center text-slate-700 select-none">
            <div className="text-center">
              <p className="text-4xl mb-3">⚛</p>
              <p className="text-sm font-mono text-slate-600">
                {mode === 'truth' ? 'Run Truth Mode to see optimization evidence.' : 'Select a circuit and run to view benchmark results.'}
              </p>
            </div>
          </div>
        )}

        {/* Right panel */}
        {!isEvidenceMode && <InspectorPanel />}

        {/* Benchmark export panel */}
        {mode === 'benchmark' && (
          <div className="w-72 flex-shrink-0 border-l border-slate-700/50 overflow-y-auto scrollbar-thin p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
              Export Surface
            </p>
            <ExportSurface />
          </div>
        )}
      </div>

      {/* Bottom circuit strip — hidden in full evidence modes */}
      {!isEvidenceMode && <CircuitStrip />}
    </div>
  )
}
