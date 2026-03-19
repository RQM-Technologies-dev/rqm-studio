import { motion } from 'framer-motion'

export function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between px-6 py-3 border-b border-slate-700/50 bg-rqm-navy-light/80 backdrop-blur-sm flex-shrink-0"
    >
      <div className="flex items-center gap-3">
        {/* Logo mark */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-glow-cyan">
          <span className="text-white font-bold text-xs font-mono">RQ</span>
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-100 leading-none glow-text">
            RQM Studio
          </h1>
          <p className="text-xs text-slate-500 leading-none mt-0.5">
            Visualizing Quaternionic Compilation
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-slate-600 font-mono">v0.1.0</span>
        <a
          href="https://github.com/RQM-Technologies-dev/rqm-studio"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
        >
          RQM Technologies
        </a>
      </div>
    </motion.header>
  )
}
