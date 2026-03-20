import katex from 'katex'

interface Props {
  /** LaTeX expression to render */
  expr: string
  /** Render as display (block) or inline math */
  display?: boolean
  className?: string
}

export function MathDisplay({ expr, display = false, className }: Props) {
  const html = katex.renderToString(expr, {
    throwOnError: false,
    displayMode: display,
    output: 'html',
  })

  return (
    <span
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
