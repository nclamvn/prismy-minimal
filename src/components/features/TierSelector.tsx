import { Zap, Award, Crown } from 'lucide-react'
import { cn } from "@/lib/utils"

interface TierSelectorProps {
  value: 'basic' | 'standard' | 'premium'
  onChange: (value: 'basic' | 'standard' | 'premium') => void
  disabled?: boolean
  labels?: {
    basic: string
    standard: string
    premium: string
  }
}

export function TierSelector({ value, onChange, disabled, labels }: TierSelectorProps) {
  const defaultLabels = {
    basic: 'Basic',
    standard: 'Standard',
    premium: 'Premium'
  }
  
  const t = labels || defaultLabels
  
  const tiers = [
    { 
      id: 'basic', 
      name: t.basic, 
      speed: 'Fast', 
      quality: 'Good',
      icon: Zap,
      color: 'hover:border-gray-400'
    },
    { 
      id: 'standard', 
      name: t.standard, 
      speed: 'Balanced', 
      quality: 'Better',
      icon: Award,
      color: 'hover:border-blue-400'
    },
    { 
      id: 'premium', 
      name: t.premium, 
      speed: 'Slower', 
      quality: 'Best',
      icon: Crown,
      color: 'hover:border-purple-400'
    },
  ]

  return (
    <div className="flex gap-2">
      {tiers.map((tier) => {
        const Icon = tier.icon
        const isSelected = value === tier.id
        
        return (
          <button
            key={tier.id}
            onClick={() => onChange(tier.id as any)}
            disabled={disabled}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-200",
              "hover:shadow-md hover:-translate-y-0.5",
              isSelected
                ? "border-accent bg-accent/10 text-accent"
                : `border-border-secondary ${tier.color} text-text`,
              disabled && "opacity-50 cursor-not-allowed hover:shadow-none hover:translate-y-0"
            )}
          >
            <Icon className="w-4 h-4 mx-auto mb-2 opacity-70" />
            <div className="font-medium">{tier.name}</div>
            <div className="text-xs opacity-75">{tier.quality} • {tier.speed}</div>
          </button>
        )
      })}
    </div>
  )
}
