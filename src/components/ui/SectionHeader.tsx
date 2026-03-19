interface Props {
  title: string
  subtitle?: string
}

export function SectionHeader({ title, subtitle }: Props) {
  return (
    <div className="mb-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-500">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}
