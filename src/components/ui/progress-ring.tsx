interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  'aria-valuenow'?: number
  'aria-valuemin'?: number
  'aria-valuemax'?: number
}

export function ProgressRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  'aria-valuenow': ariaValueNow,
  'aria-valuemin': ariaValueMin = 0,
  'aria-valuemax': ariaValueMax = 100,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div 
      className="relative inline-flex items-center justify-center"
      role="progressbar"
      aria-valuenow={ariaValueNow || progress}
      aria-valuemin={ariaValueMin}
      aria-valuemax={ariaValueMax}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-border-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-accent transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute text-2xl font-bold text-text">
        {Math.round(progress)}%
      </div>
    </div>
  )
}
