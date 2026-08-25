'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import keycloak, { logoutFromKeycloak } from '../../../../lib/keycloak'
import { AdminIcon } from '../../../../components/ui'
import OrgSidebar from '../../components/OrgSidebar'
import { useCatalogue } from '../../context/CatalogueContext'

export default function OrganizationDashboardPage() {
  const { applications, currentOrg, orgLoginId, setView } = useCatalogue()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    if (!keycloak.authenticated || !keycloak.hasRealmRole('ORGANISATION_ADMIN')) {
      router.replace('/organization')
      return
    }
    setAuthorized(true)
  }, [router])

  const handleLogout = async () => {
    await logoutFromKeycloak()
  }

  if (!authorized) return <div>Checking authentication...</div>

  const registrationNumber = currentOrg?.registrationDetails?.gst || currentOrg?.registrationDetails?.registrationNumber || '-'
  const organizationId = currentOrg?.id || orgLoginId || (keycloak.tokenParsed?.organization_id as string | undefined) || '-'
  const orgApps = applications.filter((app) => app.orgId === organizationId)
  const initials = (currentOrg?.name || organizationId).split(/[ _-]/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="org-dashboard-shell org-console-shell">
      <OrgSidebar activeItem="Dashboard" />
      <main className="org-main org-console-main">
        <header className="org-console-topbar">
          <div className="org-console-title">
            <div className="eyebrow">Organization Admin</div>
            <h1>{currentOrg?.name || organizationId}</h1>
          </div>
          <div className="org-console-actions">
            <button type="button" className="icon-button" title="Notifications"><AdminIcon name="notifications" /><span className="notification-dot" /></button>
            <div className="profile-menu">
              <button type="button" className="profile-trigger" onClick={() => setProfileOpen((open) => !open)}><span>{initials}</span><strong>{organizationId}</strong></button>
              {profileOpen && <div className="profile-dropdown"><button type="button" onClick={() => setView('org-profile')}>Organization Profile</button><button type="button" onClick={handleLogout}>Log Out</button></div>}
            </div>
          </div>
        </header>
        <section className="org-console-content">
          <div className="org-dashboard-hero">
            <div>
              <div className="eyebrow">Workspace Overview</div>
              <h2>{currentOrg?.name || 'Organization profile loading'}</h2>
              <p>Monitor identity operations, schema readiness, and application activity for this organization.</p>
            </div>
            <button type="button" className="primary-button" onClick={() => setView('org-registration-builder')}>Create Registration Schema</button>
          </div>

          <section className="org-widget-grid">
            <article className="org-widget-card blue"><span><AdminIcon name="identity" /></span><strong>128</strong><label>Managed Identities</label><small>+12 this week</small></article>
            <article className="org-widget-card green"><span><AdminIcon name="applications" /></span><strong>{orgApps.length}</strong><label>Applications</label><small>{orgApps.filter((app) => app.status === 'approved').length} approved</small></article>
            <article className="org-widget-card purple"><span><AdminIcon name="schema" /></span><strong>4</strong><label>Registration Schemas</label><small>2 pending review</small></article>
            <article className="org-widget-card orange"><span><AdminIcon name="auth" /></span><strong>97.8%</strong><label>Login Success</label><small>Last 24 hours</small></article>
          </section>

          <section className="org-analytics-grid">
            <article className="org-chart-panel large">
              <div className="panel-heading"><h3>Identity Growth</h3><span>Last 6 months</span></div>
              <div className="smooth-line-chart">
                {[32, 46, 58, 72, 84, 96].map((value, index) => <span key={index} style={{ height: `${value}%` }} />)}
              </div>
            </article>
            <article className="org-chart-panel">
              <div className="panel-heading"><h3>Auth Mix</h3><span>Policy usage</span></div>
              <div className="auth-donut"><strong>72%</strong></div>
              <ul className="legend-list"><li><span className="blue-dot" /> Password</li><li><span className="green-dot" /> Email OTP</li><li><span className="purple-dot" /> MFA</li></ul>
            </article>
          </section>

          <section className="org-dashboard-lower">
            <article className="org-chart-panel">
              <div className="panel-heading"><h3>Organization Profile</h3><span>{currentOrg?.status || 'ACTIVE'}</span></div>
              <div className="profile-mini-grid"><label>Organization ID</label><strong>{organizationId}</strong><label>Official Email</label><strong>{currentOrg?.email || '-'}</strong><label>Registration Number</label><strong>{registrationNumber}</strong></div>
            </article>
            <article className="org-chart-panel">
              <div className="panel-heading"><h3>Recent Activity</h3><span>Live</span></div>
              <ul className="org-activity-feed"><li><span /> Admin signed in with organization credentials</li><li><span /> OTP verification completed</li><li><span /> Profile loaded from onboarding service</li></ul>
            </article>
          </section>
        </section>
      </main>
    </div>
  )
}
