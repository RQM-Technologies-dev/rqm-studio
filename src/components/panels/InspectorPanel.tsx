import { motion } from 'framer-motion'
import { useStudioStore } from '../../store'
import { useStateVector } from '../../hooks/useStateVector'
import { COMPILER_NOTES } from '../../data/compilerNotes'
import { SectionHeader } from '../ui/SectionHeader'
import { DataRow } from '../ui/DataRow'
import { MathDisplay } from '../ui/MathDisplay'
import { quatToSpinor, spinorToBloch, measurementProbabilities, formatComplex } from '../../math/spinor/spinor'

export function InspectorPanel() {
  const { currentQuaternion, activeGateLabel, optimizationNotes } = useStudioStore()
  const { blochVector, axisAngle, angleDeg, quatString } = useStateVector(currentQuaternion)

  const note = activeGateLabel ? COMPILER_NOTES[activeGateLabel] : null

  // Spinor and measurement data
  const spinor = quatToSpinor(currentQuaternion)
  const bloch = spinorToBloch(spinor)
  const { p0, p1 } = measurementProbabilities(bloch.bz)
  const pct0 = Math.round(p0 * 100)
  const pct1 = Math.round(p1 * 100)

  return (
    <motion.aside
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-96 flex-shrink-0 flex flex-col gap-4 overflow-y-auto scrollbar-thin p-4"
    >
      {/* State vector */}
      <div className="panel-card p-3">
        <SectionHeader title="State Vector" subtitle="Bloch sphere coordinates" />
        <div className="py-1.5 border-b border-slate-700/40">
          <span className="text-sm text-slate-500 uppercase tracking-wider">Bloch vector</span>
          <div className="mt-1 text-base font-mono text-cyan-400">
            <MathDisplay expr={`\\vec{n} = (${blochVector[0].toFixed(4)},\\, ${blochVector[1].toFixed(4)},\\, ${blochVector[2].toFixed(4)})`} />
          </div>
        </div>
      </div>

      {/* Quaternion notation */}
      <div className="panel-card p-3">
        <SectionHeader title="Quaternion Form" subtitle="Unit quaternion representation" />
        <div className="py-1.5 border-b border-slate-700/40">
          <span className="text-sm text-slate-500 uppercase tracking-wider">q</span>
          <div className="mt-1">
            <MathDisplay expr={`q = ${quatString}`} className="text-cyan-400" />
          </div>
        </div>
        <DataRow label="Rotation axis" value={`(${axisAngle.axis.map((v) => v.toFixed(3)).join(', ')})`} mono />
        <DataRow label="Rotation angle" value={`${angleDeg.toFixed(2)}°`} mono accent />
      </div>

      {/* Spinor coefficients */}
      <div className="panel-card p-3">
        <SectionHeader title="Spinor |ψ⟩" subtitle="SU(2) complex amplitudes" />
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex justify-between items-center">
            <MathDisplay expr="\alpha =" className="text-slate-500 text-sm" />
            <span className="text-sm font-mono text-green-400">{formatComplex(spinor.alphaReal, spinor.alphaImag)}</span>
          </div>
          <div className="flex justify-between items-center">
            <MathDisplay expr="\beta =" className="text-slate-500 text-sm" />
            <span className="text-sm font-mono text-blue-400">{formatComplex(spinor.betaReal, spinor.betaImag)}</span>
          </div>
        </div>
      </div>

      {/* Measurement probabilities */}
      <div className="panel-card p-3">
        <SectionHeader title="Measurement" subtitle="Z-basis probabilities" />
        <div className="mt-2 space-y-2">
          {pct0 >= 99 ? (
            <div className="text-center">
              <MathDisplay expr="|0\rangle" display className="text-2xl font-bold text-green-400" />
              <p className="text-sm text-slate-500 mt-0.5">Ground state</p>
            </div>
          ) : pct1 >= 99 ? (
            <div className="text-center">
              <MathDisplay expr="|1\rangle" display className="text-2xl font-bold text-blue-400" />
              <p className="text-sm text-slate-500 mt-0.5">Excited state</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-sm font-mono">
                <span className="text-green-400">{pct0}% <MathDisplay expr="|0\rangle" /></span>
                <span className="text-blue-400">{pct1}% <MathDisplay expr="|1\rangle" /></span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-blue-500 transition-all duration-300"
                  style={{ width: `${pct0}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compiler interpretation */}
      {note && (
        <div className="panel-card p-3 border-teal-600/30">
          <SectionHeader title="Compiler Interpretation" />
          <p className="text-sm text-slate-300 leading-relaxed mb-2">{note.geometric}</p>
          {note.optimization && (
            <div className="mt-2 pt-2 border-t border-slate-700/50">
              <p className="text-sm text-teal-400/80 leading-relaxed">{note.optimization}</p>
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
                <span className="text-orange-400 text-sm mt-0.5">→</span>
                <p className="text-sm text-slate-400 leading-relaxed">{n}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.aside>
  )
}
