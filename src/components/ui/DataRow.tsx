interface Props {
  label: string
  value: string
  mono?: boolean
  accent?: boolean
}

export function DataRow({ label, value, mono = false, accent = false }: Props) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5 border-b border-slate-700/40 last:border-0">
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      <span
        className={`text-sm break-all ${mono ? 'font-mono' : ''} ${
          accent ? 'text-cyan-400' : 'text-slate-200'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
