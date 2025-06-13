interface FooterProps {
  translations: any
}

export function Footer({ translations: t }: FooterProps) {
  return (
    <footer className="mt-20 py-8 text-center text-sm text-text-tertiary">
      <p className="opacity-60">{t.poweredBy}</p>
    </footer>
  )
}
