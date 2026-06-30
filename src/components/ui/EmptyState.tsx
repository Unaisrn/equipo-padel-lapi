import Link from 'next/link'

interface Props {
  icon: React.ReactNode
  title: string
  action?: { href: string; label: string }
}

export function EmptyState({ icon, title, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-12 h-12 text-tenue mx-auto">{icon}</div>
      <p className="text-apagado text-sm max-w-xs">{title}</p>
      {action && (
        <Link href={action.href} className="btn-primary">
          {action.label}
        </Link>
      )}
    </div>
  )
}
