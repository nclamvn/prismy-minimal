// src/components/features/TierSelector.tsx
'use client'

interface TierSelectorProps {
  value: 'basic' | 'standard' | 'premium'
  onChange: (tier: 'basic' | 'standard' | 'premium') => void
  disabled?: boolean
}

export function TierSelector({ value, onChange, disabled }: TierSelectorProps) {
  const tiers = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Fast, simple translation',
      icon: '⚡',
      color: 'bg-gray-100 hover:bg-gray-200'
    },
    {
      id: 'standard', 
      name: 'Standard',
      description: 'Balanced quality',
      icon: '✨',
      color: 'bg-blue-100 hover:bg-blue-200'
    },
    {
      id: 'premium',
      name: 'Premium', 
      description: 'Best quality, context-aware',
      icon: '💎',
      color: 'bg-purple-100 hover:bg-purple-200'
    }
  ]

  return (
    <div className="flex gap-2 mb-4">
      {tiers.map((tier) => (
        <button
          key={tier.id}
          onClick={() => onChange(tier.id as any)}
          disabled={disabled}
          className={`
            flex-1 p-3 rounded-lg transition-all
            ${value === tier.id ? 'ring-2 ring-blue-500' : ''}
            ${tier.color}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="text-2xl mb-1">{tier.icon}</div>
          <div className="font-medium">{tier.name}</div>
          <div className="text-xs text-gray-600">{tier.description}</div>
        </button>
      ))}
    </div>
  )
}