interface LogoProps {
  className?: string
}

export function Logo({ className = "h-8 w-8" }: LogoProps) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16 2L2 9L16 16L30 9L16 2Z" opacity="0.9"/>
      <path d="M2 23L16 30L30 23V9L16 16L2 9V23Z" opacity="0.7"/>
      <path d="M16 16L30 9V23L16 30V16Z" opacity="0.5"/>
    </svg>
  )
}
