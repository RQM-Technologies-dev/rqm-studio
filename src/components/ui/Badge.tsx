import { motion } from 'framer-motion'

interface Props {
  label: string
  color?: string
  active?: boolean
  onClick?: () => void
}

export function Badge({ label, color = '#06b6d4', active = false, onClick }: Props) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center px-3 py-1 rounded
        font-mono text-sm font-semibold border transition-all duration-200
        ${active
          ? 'border-current text-current bg-current/10 shadow-glow-sm'
          : 'border-slate-600 text-slate-400 bg-slate-800/50 hover:border-slate-500'
        }
      `}
      style={active ? { color, borderColor: color } : {}}
    >
      {label}
    </motion.button>
  )
}
