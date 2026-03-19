import { motion } from 'framer-motion'
import { useStudioStore } from '../../store'
import { useStateVector } from '../../hooks/useStateVector'
import { COMPILER_NOTES } from '../../data/compilerNotes'
import { SectionHeader } from '../ui/SectionHeader'
import { DataRow } from '../ui/DataRow'

export function InspectorPanel() {
  const { currentQuaternion, activeGateLabel, optimizationNotes } = useStudioStore()
  const { blochVector, axisAngle, axisDeg, quatString } = useStateVector(currentQuaternion)

  const note = activeGateLabel ? COMPILER_NOTES[activeGateLabel] : null

  return (
    <motion.aside
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto scrollbar-thin p-4"
    >
      {/* State vector */}
      <div className="panel-card p-3">
        <SectionHeader title="State Vector" subtitle="Bloch sphere coordinates" />
        <DataRow label="x" value={blochVector[0].toFixed(4)} mono accent />
        <DataRow label="y" value={blochVector[1].toFixed(4)} mono accent />
        <DataRow label="z" value={blochVector[2].toFixed(4)} mono accent />
      </div>

      {/* Quaternion notation */}
      <div className="panel-card p-3">
        <SectionHeader title="Quaternion Form" subtitle="Unit quaternion representation" />
        <DataRow label="q = w+xi+yj+zk" value={quatString} mono />
        <DataRow label="Rotation axis" value={`(${axisAngle.axis.map((v) => v.toFixed(3)).join(', ')})`} mono />
        <DataRow label="Rotation angle" value={`${axisDeg.toFixed(2)}°`} mono accent />
      </div>

      {/* Compiler interpretation */}
      {note && (
        <div className="panel-card p-3 border-teal-600/30">
          <SectionHeader title="Compiler Interpretation" />
          <p className="text-xs text-slate-300 leading-relaxed mb-2">{note.geometric}</p>
          {note.optimization && (
            <div className="mt-2 pt-2 border-t border-slate-700/50">
              <p className="text-xs text-teal-400/80 leading-relaxed">{note.optimization}</p>
            </div>
          )}
        </div>
      )}

      {/* Optimization notes */}
      {optimizationNotes.length > 0 && (
        <div className="panel-card p-3 border-orange-600/20">
          <SectionHeader title="Optimization Notes" subtitle={`${optimizationNotes.length} rule(s) applied`} />
          <div className="flex flex-col gap-1.5">
            {optimizationNotes.map((n, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-orange-400 text-xs mt-0.5">→</span>
                <p className="text-xs text-slate-400 leading-relaxed">{n}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.aside>
  )
}
