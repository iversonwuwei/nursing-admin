import { DataCard, Tag } from '@/components/nh'
import { CircleHelp } from 'lucide-react'
import Link from 'next/link'

interface PageHelpCardProps {
  title: string
  subtitle: string
  summary: string
  items: string[]
  href: string
  actionLabel?: string
}

export function PageHelpCard({
  title,
  subtitle,
  summary,
  items,
  href,
  actionLabel = '查看完整帮助',
}: PageHelpCardProps) {
  return (
    <DataCard
      icon={<CircleHelp size={16} />}
      title={title}
      subtitle={subtitle}
      badge={<Tag variant="info">Help</Tag>}
    >
      <div className="page-help-card">
        <div className="page-help-card-summary">{summary}</div>
        <div className="page-help-card-list">
          {items.map(item => (
            <div key={item} className="page-help-card-item">{item}</div>
          ))}
        </div>
        <Link href={href} className="btn btn-secondary btn-sm">{actionLabel}</Link>
      </div>
    </DataCard>
  )
}