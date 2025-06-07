'use client'

import { useState } from 'react'
import { Settings, Globe, Zap, Shield } from 'lucide-react'

interface TranslationSettingsProps {
  onSettingsChange: (settings: any) => void
}

export function TranslationSettings({ onSettingsChange }: TranslationSettingsProps) {
  const [settings, setSettings] = useState({
    targetLanguage: 'vi',
    tier: 'standard',
    preserveFormatting: true
  })

  const languages = [
    { code: 'vi', name: 'Vietnamese' },
    { code: 'en', name: 'English' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' }
  ]

  const tiers = [
    { 
      value: 'basic', 
      name: 'Basic', 
      description: 'Fast translation with Google Translate',
      icon: Zap,
      color: 'text-gray-600'
    },
    { 
      value: 'standard', 
      name: 'Standard', 
      description: 'AI-powered with GPT-3.5',
      icon: Globe,
      color: 'text-blue-600'
    },
    { 
      value: 'premium', 
      name: 'Premium', 
      description: 'Best quality with GPT-4 + Claude',
      icon: Shield,
      color: 'text-purple-600'
    }
  ]

  const updateSettings = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    onSettingsChange(newSettings)
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 p-6 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Translation Settings
      </h3>

      <div className="space-y-4">
        {/* Target Language */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Target Language
          </label>
          <select
            value={settings.targetLanguage}
            onChange={(e) => updateSettings('targetLanguage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Translation Tier */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Translation Quality
          </label>
          <div className="grid grid-cols-3 gap-3">
            {tiers.map(tier => {
              const Icon = tier.icon
              return (
                <button
                  key={tier.value}
                  onClick={() => updateSettings('tier', tier.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    settings.tier === tier.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-1 ${tier.color}`} />
                  <div className="font-medium text-sm">{tier.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {tier.description}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.preserveFormatting}
              onChange={(e) => updateSettings('preserveFormatting', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm">Preserve original formatting</span>
          </label>
        </div>
      </div>
    </div>
  )
}
