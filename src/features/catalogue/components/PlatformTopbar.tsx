'use client'

import { AdminIcon } from '../../../components/ui'
import { logoutFromKeycloak } from '../../../lib/keycloak'
import { useCatalogue } from '../context/CatalogueContext'

interface PlatformTopbarProps {
  heading: string
}

export default function PlatformTopbar({ heading }: PlatformTopbarProps) {
  const { setView } = useCatalogue()

  const handleLogout = async () => {
    try {
      await logoutFromKeycloak()
    } catch (error) {
      console.error('Platform Admin logout failed:', error)
      setView('home')
    }
  }

  return (
    <header className="platform-topbar">
      <h1>{heading}</h1>
      <div className="platform-topbar-actions">
        <button type="button" className="icon-button" title="Notifications" onClick={() => setView('platform-notifications')}><AdminIcon name="notifications" /></button>
        <span className="admin-account-pill"><AdminIcon name="shield" />Platform Owner</span>
        <button type="button" className="platform-logout-button" onClick={handleLogout}>Log Out</button>
      </div>
    </header>
  )
}
