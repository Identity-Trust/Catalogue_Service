'use client'

import type { ReactNode } from 'react'
import { logoutFromKeycloak } from '../../../lib/keycloak'
import PageHeader from './PageHeader'
import PlatformSidebar from './PlatformSidebar'
import { useCatalogue } from '../context/CatalogueContext'

interface PlatformLayoutProps {
  children: ReactNode
  title: string
  heading: string
}

export default function PlatformLayout({ children, title, heading }: PlatformLayoutProps) {
  const { applications, pendingOrganizations, schemas, setView, view } = useCatalogue()

  const handleLogout = async () => {
    try {
      await logoutFromKeycloak()
    } catch (error) {
      console.error('Platform Admin logout failed:', error)
      setView('home')
    }
  }

  return (
    <div className="dashboard-shell">
      <PlatformSidebar
        applications={applications}
        currentView={view}
        onNavigate={setView}
        pendingOrganizations={pendingOrganizations}
        schemas={schemas}
      />
      <main className="dashboard-main">
        <PageHeader title={title} onBack={() => setView('home')} />
        <header className="dashboard-header">
          <div><div className="eyebrow">Platform Admin</div><h2>{heading}</h2></div>
          <button type="button" className="primary-button" onClick={handleLogout}>Sign Out</button>
        </header>
        {children}
      </main>
    </div>
  )
}
