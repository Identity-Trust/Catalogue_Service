'use client'

import { useEffect } from 'react'
import { AdminIcon } from '../../../../components/ui'
import PlatformSidebar from '../../components/PlatformSidebar'
import PlatformTopbar from '../../components/PlatformTopbar'
import { useCatalogue } from '../../context/CatalogueContext'

export default function PlatformDashboardPage() {
  const { applications, organizations, pendingOrganizations, refreshCatalogueData, schemas, setView, view } = useCatalogue()
  useEffect(() => { refreshCatalogueData?.() }, [])
  const totalOrgs = organizations.length
  const approvedCount = organizations.filter((org) => org.status === 'approved').length
  const pendingOrgCount = pendingOrganizations.filter((org) => org.status === 'pending' || org.status === 'requires_more_info').length
  const pendingAppCount = applications.filter((app) => app.status === 'pending').length
  const schemaReviewCount = schemas.filter((schema) => schema.status === 'pending').length
  const orgStatusCounts = [
    { label: 'Approved', value: approvedCount },
    { label: 'Pending', value: pendingOrgCount },
    { label: 'Rejected', value: organizations.filter((org) => org.status === 'rejected').length },
    { label: 'Suspended', value: organizations.filter((org) => org.status === 'suspended').length },
  ]
  const appStatusCounts = [
    { label: 'Approved', value: applications.filter((app) => app.status === 'approved').length },
    { label: 'Pending', value: pendingAppCount },
    { label: 'Rejected', value: applications.filter((app) => app.status === 'rejected').length },
  ]
  const maxOrgStatus = Math.max(1, ...orgStatusCounts.map((item) => item.value))
  const maxAppStatus = Math.max(1, ...appStatusCounts.map((item) => item.value))
  const recentRows = [
    ...organizations.map((org) => ({
      type: 'Org',
      text: org.name || org.id,
      meta: `${org.id} - ${org.status}`,
      time: org.createdAt || org.submittedAt || org.approvedAt || org.rejectedAt || '',
      dot: org.status === 'approved' ? 'green' : org.status === 'rejected' ? 'red' : 'blue',
    })),
    ...applications.map((app) => ({
      type: 'App',
      text: app.name || app.id,
      meta: `${app.id} - ${app.orgName || app.orgId} - ${app.status}`,
      time: app.createdAt || app.approvedAt || app.rejectedAt || '',
      dot: app.status === 'approved' ? 'green' : app.status === 'rejected' ? 'red' : 'orange',
    })),
    ...schemas.map((schema) => ({
      type: 'Schema',
      text: schema.name || schema.id,
      meta: `${schema.id} - ${schema.orgName || 'Organization'} - ${schema.status}`,
      time: schema.createdAt || schema.approvedAt || schema.rejectedAt || '',
      dot: schema.status === 'approved' ? 'green' : schema.status === 'rejected' ? 'red' : 'blue',
    })),
  ].slice(0, 8)

  return (
    <div className="dashboard-shell platform-dashboard-shell">
      <PlatformSidebar applications={applications} currentView={view} onNavigate={setView} pendingOrganizations={pendingOrganizations} schemas={schemas} />
      <main className="dashboard-main platform-dashboard-main">
        <PlatformTopbar heading="Dashboard" />
        <section className="platform-content">
          <div className="admin-stats-grid">
            <article className="admin-stat-card blue"><span className="admin-stat-icon"><AdminIcon name="organizations" /></span><strong>{totalOrgs}</strong><h3>Total Orgs</h3><p>{pendingOrgCount} pending</p></article>
            <article className="admin-stat-card green"><span className="admin-stat-icon"><AdminIcon name="check" /></span><strong>{approvedCount}</strong><h3>Approved</h3><p>active orgs</p></article>
            <article className="admin-stat-card purple"><span className="admin-stat-icon"><AdminIcon name="applications" /></span><strong>{applications.length}</strong><h3>Applications</h3><p>{pendingAppCount} pending</p></article>
            <article className="admin-stat-card orange"><span className="admin-stat-icon"><AdminIcon name="schema" /></span><strong>{schemaReviewCount}</strong><h3>Schema Reviews</h3><p>awaiting review</p></article>
          </div>
          <div className="admin-chart-grid">
            <article className="admin-chart-card"><h2>Organization Approval Status</h2><div className="status-chart">{orgStatusCounts.map((item) => <div className="status-bar-row" key={item.label}><span>{item.label}</span><div><strong style={{ width: `${(item.value / maxOrgStatus) * 100}%` }} /></div><b>{item.value}</b></div>)}</div></article>
            <article className="admin-chart-card"><h2>Application Approval Status</h2><div className="status-chart">{appStatusCounts.map((item) => <div className="status-bar-row" key={item.label}><span>{item.label}</span><div><strong style={{ width: `${(item.value / maxAppStatus) * 100}%` }} /></div><b>{item.value}</b></div>)}</div></article>
          </div>
          <section className="recent-activity-card"><h2>Recent Records</h2>{recentRows.length ? <div className="recent-activity-list">{recentRows.map((row) => <div className="recent-activity-row" key={`${row.type}-${row.text}-${row.meta}`}><span className={`activity-dot ${row.dot}`} /><span className="activity-type">{row.type}</span><strong>{row.text}</strong><span className="activity-meta">{row.meta}</span><time>{row.time || 'Synced'}</time></div>)}</div> : <div className="empty-state">No organization, application, or schema records found from the database yet.</div>}</section>
        </section>
      </main>
    </div>
  )
}
