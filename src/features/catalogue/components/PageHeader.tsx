'use client'

interface PageHeaderProps {
  title: string
  onBack: () => void
}

export default function PageHeader({ title, onBack }: PageHeaderProps) {
  return (
    <div className="page-header">
      <button type="button" className="back-button" onClick={onBack}>Back</button>
      <span className="back-divider">|</span>
      <span className="page-title">{title}</span>
    </div>
  )
}
