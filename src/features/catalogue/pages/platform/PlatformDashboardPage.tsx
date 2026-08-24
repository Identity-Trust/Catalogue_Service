'use client'

import { AdminIcon } from '../../../../components/ui'
import { logoutFromKeycloak } from '../../../../lib/keycloak'
import PlatformSidebar from '../../components/PlatformSidebar'
import { useCatalogue } from '../../context/CatalogueContext'

export default function PlatformDashboardPage() {
  const { applications, organizations, pendingOrganizations, schemas, setView, view } = useCatalogue()
  const handleLogout = async () => {
    try {
      await logoutFromKeycloak()
    } catch (error) {
      console.error('Platform Admin logout failed:', error)
      setView('home')
    }
  }
  const totalOrgs = organizations.length
  const approvedCount = organizations.filter((org) => org.status === 'approved').length
  const pendingOrgCount = pendingOrganizations.filter((org) => org.status === 'pending' || org.status === 'requires_more_info').length
  const pendingAppCount = applications.filter((app) => app.status === 'pending').length
  const schemaReviewCount = schemas.filter((schema) => schema.status === 'pending').length
  const recentRows = [
    { type: 'User', text: 'User Registered', meta: 'john.doe@technova.io', time: '09:12:34', dot: 'green' },
    { type: 'Org', text: `${pendingOrganizations[0]?.name || 'Apex Digital'} submitted registration`, meta: pendingOrganizations[0]?.email || 'admin@apexdigital.io', time: '08:45:12', dot: 'blue' },
    { type: 'App', text: `${applications[0]?.name || 'Identity Suite'} awaiting approval`, meta: applications[0]?.orgName || 'TechNova Solutions', time: '08:18:09', dot: 'orange' },
  ]

  return (
    <div className="dashboard-shell platform-dashboard-shell">
      <PlatformSidebar applications={applications} currentView={view} onNavigate={setView} pendingOrganizations={pendingOrganizations} schemas={schemas} />
      <main className="dashboard-main platform-dashboard-main">
        <header className="platform-topbar"><h1>Dashboard</h1><button type="button" className="admin-account-pill" onClick={handleLogout}><AdminIcon name="shield" />Platform Admin</button></header>
        <section className="platform-content">
          <div className="admin-stats-grid">
            <article className="admin-stat-card blue"><span className="admin-stat-icon"><AdminIcon name="organizations" /></span><strong>{totalOrgs}</strong><h3>Total Orgs</h3><p>{pendingOrgCount} pending</p></article>
            <article className="admin-stat-card green"><span className="admin-stat-icon"><AdminIcon name="check" /></span><strong>{approvedCount}</strong><h3>Approved</h3><p>active orgs</p></article>
            <article className="admin-stat-card purple"><span className="admin-stat-icon"><AdminIcon name="applications" /></span><strong>{applications.length}</strong><h3>Applications</h3><p>{pendingAppCount} pending</p></article>
            <article className="admin-stat-card orange"><span className="admin-stat-icon"><AdminIcon name="schema" /></span><strong>{schemaReviewCount}</strong><h3>Schema Reviews</h3><p>awaiting review</p></article>
          </div>
          <div className="admin-chart-grid">
            <article className="admin-chart-card"><h2>Organization Registrations</h2><svg className="line-chart" viewBox="0 0 520 210" role="img" aria-label="Organization registrations by month"><path className="chart-fill" d="M52 150 C110 140 130 132 160 128 C220 116 235 106 270 102 C330 92 350 88 390 70 C425 55 455 64 500 82 L500 180 L52 180 Z" /><path className="line-path" d="M52 150 C110 140 130 132 160 128 C220 116 235 106 270 102 C330 92 350 88 390 70 C425 55 455 64 500 82" /></svg></article>
            <article className="admin-chart-card"><h2>Platform Login Activity</h2><div className="bar-chart">{[['Mon',64],['Tue',82],['Wed',88],['Thu',78],['Fri',96],['Sat',42],['Sun',28]].map(([day, value]) => <div className="bar-column" key={day}><span style={{ height: `${value}%` }} /><label>{day}</label></div>)}</div></article>
          </div>
          <section className="recent-activity-card"><h2>Recent Activity</h2><div className="recent-activity-list">{recentRows.map((row) => <div className="recent-activity-row" key={`${row.text}-${row.time}`}><span className={`activity-dot ${row.dot}`} /><span className="activity-type">{row.type}</span><strong>{row.text}</strong><span className="activity-meta">{row.meta}</span><time>{row.time}</time></div>)}</div></section>
        </section>
      </main>
    </div>
  )
}
