'use client'

import type { ReactNode } from 'react'
import PlatformSidebar from './PlatformSidebar'
import PlatformTopbar from './PlatformTopbar'
import { useCatalogue } from '../context/CatalogueContext'

interface PlatformLayoutProps {
  children: ReactNode
  title: string
  heading: string
}

export default function PlatformLayout({ children, title: _title, heading }: PlatformLayoutProps) {
  const { applications, pendingOrganizations, schemas, setView, view } = useCatalogue()

  return (
    <div className="dashboard-shell platform-dashboard-shell">
      <PlatformSidebar
        applications={applications}
        currentView={view}
        onNavigate={setView}
        pendingOrganizations={pendingOrganizations}
        schemas={schemas}
      />
      <main className="dashboard-main platform-dashboard-main">
        <PlatformTopbar heading={heading} />
        <section className="platform-content">{children}</section>
      </main>
    </div>
  )
}
