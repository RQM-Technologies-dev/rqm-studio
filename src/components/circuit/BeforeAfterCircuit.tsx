import type { GateStep } from '../../types/circuit'

interface BeforeAfterCircuitProps {
  original: GateStep[]
  optimized: GateStep[]
}

function CircuitLane({ gates, label }: { gates: GateStep[]; label: string }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{label} ({gates.length} gates)</p>
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs font-mono text-slate-600 flex-shrink-0">|0⟩</span>
        <div className="w-3 h-px bg-slate-700 flex-shrink-0" />
        {gates.length === 0 ? (
          <span className="text-xs text-slate-500 italic">Empty circuit</span>
        ) : (
          gates.map((gate, i) => (
            <div key={i} className="flex items-center gap-0 flex-shrink-0">
              <span
                className="px-2 py-1 rounded font-mono text-xs font-bold border"
                style={{
                  color: gate.color,
                  borderColor: `${gate.color}55`,
                  backgroundColor: `${gate.color}18`,
                }}
              >
                {gate.label}
              </span>
              {i < gates.length - 1 && (
                <div className="w-2 h-px bg-slate-700" />
              )}
            </div>
          ))
        )}
        <div className="w-3 h-px bg-slate-700 flex-shrink-0" />
        <span className="text-xs font-mono text-slate-600 flex-shrink-0">out</span>
      </div>
    </div>
  )
}

export function BeforeAfterCircuit({ original, optimized }: BeforeAfterCircuitProps) {
  const reduction = original.length - optimized.length
  return (
    <div className="flex flex-col gap-4">
      <CircuitLane gates={original} label="Original" />
      <div className="border-t border-slate-700/50" />
      <CircuitLane gates={optimized} label="Optimized" />
      {reduction > 0 && (
        <p className="text-xs text-teal-400 font-medium">
          ↓ {reduction} gate{reduction !== 1 ? 's' : ''} removed
        </p>
      )}
    </div>
  )
}
