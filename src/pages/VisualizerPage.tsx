import { AnimatedSVGScene } from '../render/scene/AnimatedSVGScene'
import { ControlPanel } from '../components/panels/ControlPanel'
import { InspectorPanel } from '../components/panels/InspectorPanel'
import { CircuitStrip } from '../components/circuit/CircuitStrip'
import { BlochSphereWidget } from '../components/visualization/BlochSphereWidget'

export function VisualizerPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative">
        <ControlPanel />
        <div className="flex-1 relative">
          <AnimatedSVGScene />
          <BlochSphereWidget />
        </div>
        <InspectorPanel />
      </div>
      <CircuitStrip />
    </div>
  )
}
