import { motion } from 'framer-motion'
import { GraduationCap, Briefcase, Wrench, Scale } from 'lucide-react'

interface UseCasesProps {
  translations: any
}

export function UseCases({ translations: t }: UseCasesProps) {
  const cases = [
    { icon: GraduationCap, label: t.academic },
    { icon: Briefcase, label: t.business },
    { icon: Wrench, label: t.technical },
    { icon: Scale, label: t.legal },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      {cases.map((item, index) => {
        const Icon = item.icon
        return (
          <button
            key={index}
            className="liquid-case-button group"
          >
            <Icon className="w-6 h-6 mx-auto mb-2 liquid-text-secondary group-hover:text-current transition-colors" />
            <span className="text-sm font-medium liquid-text-secondary group-hover:text-current transition-colors">
              {item.label}
            </span>
          </button>
        )
      })}
      
      <style jsx>{`
        .liquid-case-button {
          padding: 20px;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--blur-sm));
          -webkit-backdrop-filter: blur(var(--blur-sm));
          border: var(--border-glass);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }
        
        .liquid-case-button:hover {
          background: var(--glass-bg-hover);
          transform: translateY(-4px);
          box-shadow: 
            0 0 0 1px hsla(0 0% 100% / .15) inset,
            0 8px 16px hsla(0 0% 0% / .1);
        }
      `}</style>
    </motion.div>
  )
}
