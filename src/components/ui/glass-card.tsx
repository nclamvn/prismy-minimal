interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  const classes = [
    "backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl",
    className
  ].filter(Boolean).join(" ")
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}
