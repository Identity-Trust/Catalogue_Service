'use client'

import PlatformLayout from '../../components/PlatformLayout'

interface PlatformPlaceholderPageProps {
  title: string
}

export default function PlatformPlaceholderPage({ title }: PlatformPlaceholderPageProps) {
  return (
    <PlatformLayout title={`Identity OS - ${title}`} heading={title}>
      <div className="form-card">This page is routed and ready for its API-backed implementation.</div>
    </PlatformLayout>
  )
}
