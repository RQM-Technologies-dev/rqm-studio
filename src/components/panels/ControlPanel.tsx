import { motion } from 'framer-motion'
import { useStudioStore } from '../../store'
import { useStateVector } from '../../hooks/useStateVector'
import { COMPILER_NOTES } from '../../data/compilerNotes'
import { SectionHeader } from '../ui/SectionHeader'
import { DataRow } from '../ui/DataRow'
import { MathDisplay } from '../ui/MathDisplay'
import type { StudioMode } from '../../types/circuit'

const MODES: { id: StudioMode; label: string }[] = [
  { id: 'visualize', label: 'Visualize' },
  { id: 'compile', label: 'Compile' },
  { id: 'optimize', label: 'Optimize' },
]

export function ControlPanel() {
  const { mode, setMode, currentQuaternion, activeGateLabel, circuit, currentStep } = useStudioStore()
  const { axisAngle, angleDeg, quatString } = useStateVector(currentQuaternion)

  const note = activeGateLabel ? COMPILER_NOTES[activeGateLabel] : null
  const gateInfo = currentStep >= 0 ? circuit[currentStep] : null

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto scrollbar-thin p-4"
    >
      {/* Mode selector */}
      <div className="panel-card p-3">
        <SectionHeader title="Mode" />
        <div className="flex flex-col gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`
                text-left px-3 py-2 rounded text-base font-medium transition-all duration-200
                ${mode === m.id
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                }
              `}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current gate */}
      <div className="panel-card p-3">
        <SectionHeader title="Active Gate" />
        {gateInfo ? (
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-xl font-bold px-3 py-1 rounded"
              style={{ color: gateInfo.color, backgroundColor: `${gateInfo.color}22` }}
            >
              {gateInfo.label}
            </span>
            <span className="text-sm text-slate-400">{gateInfo.description}</span>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">|0⟩ initial state</p>
        )}
      </div>

      {/* Quaternion readout */}
      <div className="panel-card p-3">
        <SectionHeader title="Quaternion" subtitle="SU(2) state" />
        <div className="py-1.5 border-b border-slate-700/40">
          <MathDisplay expr={`q = ${quatString}`} className="text-cyan-400 text-sm" />
        </div>
        <DataRow
          label="Axis"
          value={`[${axisAngle.axis.map((v) => v.toFixed(3)).join(', ')}]`}
          mono
        />
        <DataRow label="Angle" value={`${angleDeg.toFixed(1)}°`} mono accent />
      </div>

      {/* Compiler status */}
      {note && (
        <div className="panel-card p-3 border-cyan-600/30">
          <SectionHeader title="Compiler" />
          <p className="text-sm text-slate-400 leading-relaxed">{note.educational}</p>
        </div>
      )}

      <div className="panel-card p-3">
        <SectionHeader title="Progress" />
        <p className="text-base text-slate-400">
          Step{' '}
          <span className="text-cyan-400 font-mono">
            {currentStep + 1}
          </span>{' '}
          of{' '}
          <span className="text-slate-200 font-mono">{circuit.length}</span>
        </p>
      </div>
    </motion.aside>
  )
}
