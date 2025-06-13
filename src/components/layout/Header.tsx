'use client'

import { useRouter } from 'next/navigation'

interface HeaderProps {
  lang: 'en' | 'vi'
  onToggleLang: () => void
  translations: any
}

export function Header({ lang, onToggleLang, translations: t }: HeaderProps) {
  const router = useRouter()

  return (
    <header className="liquid-header">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl font-bold">
            Prismy
          </span>
        </div>
        
        <nav className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="liquid-nav-button"
          >
            {lang.toUpperCase()}
          </button>

          <button className="liquid-nav-button liquid-nav-ghost">
            {t.signIn}
          </button>
          
          {/* Upgrade Button */}
          <button 
            onClick={() => router.push('/pricing')}
            className="liquid-nav-button liquid-nav-outline"
          >
            {t.upgradePro}
          </button>
          
          <button className="liquid-nav-button liquid-nav-primary">
            {t.getStarted}
          </button>
        </nav>
      </div>
      
      <style jsx>{`
        .liquid-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--blur-lg));
          -webkit-backdrop-filter: blur(var(--blur-lg));
          border-bottom: var(--border-glass);
        }
        
        .liquid-nav-button {
          position: relative;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        
        /* Ghost style (Sign in) */
        .liquid-nav-ghost {
          background: transparent;
          color: var(--mono-700);
          border: none;
        }
        
        .liquid-nav-ghost:hover {
          background: var(--glass-bg-hover);
          color: var(--mono-900);
        }
        
        /* Outline style (Upgrade) */
        .liquid-nav-outline {
          background: transparent;
          color: var(--mono-700);
          border: 1px solid var(--mono-400);
        }
        
        .liquid-nav-outline:hover {
          background: var(--glass-bg-hover);
          border-color: var(--mono-600);
          color: var(--mono-900);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px hsla(0 0% 0% / .08);
        }
        
        /* Primary style (Get Started) */
        .liquid-nav-primary {
          background: var(--mono-900);
          color: var(--mono-100);
          border: none;
        }
        
        .liquid-nav-primary:hover {
          background: var(--mono-800);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px hsla(0 0% 0% / .15);
        }
        
        /* Subtle shine effect on hover */
        .liquid-nav-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            hsla(0 0% 100% / .2),
            transparent
          );
          transition: left 0.5s;
        }
        
        .liquid-nav-button:hover::before {
          left: 100%;
        }
      `}</style>
    </header>
  )
}
