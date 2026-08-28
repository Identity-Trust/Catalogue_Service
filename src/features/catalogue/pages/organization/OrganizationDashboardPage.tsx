'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import keycloak from '../../../../lib/keycloak'
import { AdminIcon } from '../../../../components/ui'
import OrgSidebar from '../../components/OrgSidebar'
import OrgTopbar from '../../components/OrgTopbar'
import { useCatalogue } from '../../context/CatalogueContext'

const countByStatus = (items: Array<{ status: string }>) => ({
  pending: items.filter((item) => item.status === 'pending').length,
  approved: items.filter((item) => item.status === 'approved').length,
  rejected: items.filter((item) => item.status === 'rejected').length,
  draft: items.filter((item) => item.status === 'draft').length,
})

const percent = (value: number, total: number) => total ? Math.max(8, Math.round((value / total) * 100)) : 8

export default function OrganizationDashboardPage() {
  const { applications, auditLogs, currentOrg, orgLoginId, refreshCatalogueData, schemas, setView } = useCatalogue()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (!keycloak.authenticated || !keycloak.hasRealmRole('ORGANISATION_ADMIN')) {
      router.replace('/organization')
      return
    }
    setAuthorized(true)
    refreshCatalogueData?.()
  }, [router])

  const organizationId = currentOrg?.id || orgLoginId || (keycloak.tokenParsed?.organization_id as string | undefined) || '-'
  const orgApps = useMemo(() => applications.filter((app) => app.orgId === organizationId), [applications, organizationId])
  const orgSchemas = useMemo(() => schemas.filter((schema) => schema.orgId === organizationId), [schemas, organizationId])
  const registrationSchemas = orgSchemas.filter((schema) => schema.type === 'registration')
  const loginSchemas = orgSchemas.filter((schema) => schema.type === 'login')
  const appCounts = countByStatus(orgApps)
  const schemaCounts = countByStatus(orgSchemas)
  const approvedApps = orgApps.filter((app) => app.status === 'approved')
  const readyApplications = approvedApps.filter((app) => (
    registrationSchemas.some((schema) => schema.appId === app.id && schema.status === 'approved') &&
    loginSchemas.some((schema) => schema.appId === app.id && schema.status === 'approved')
  ))
  const recentItems = [
    ...orgApps.map((app) => ({ id: app.id, label: app.name, detail: `Application ${app.status}`, time: app.createdAt || app.approvedAt || app.rejectedAt || '', icon: 'applications' })),
    ...orgSchemas.map((schema) => ({ id: schema.versionId || schema.id, label: schema.name, detail: `${schema.type === 'login' ? 'Login' : 'Registration'} schema ${schema.status}`, time: schema.createdAt || schema.approvedAt || schema.rejectedAt || '', icon: schema.type === 'login' ? 'auth' : 'schema' })),
    ...auditLogs.slice(0, 4).map((log) => ({ id: log.id, label: log.action, detail: log.details, time: log.timestamp, icon: 'audit' })),
  ].slice(0, 6)

  if (!authorized) return <div>Checking authentication...</div>

  const registrationNumber = currentOrg?.registrationDetails?.gst || currentOrg?.registrationDetails?.registrationNumber || '-'

  return (
    <div className="org-dashboard-shell org-console-shell">
      <OrgSidebar activeItem="Dashboard" />
      <main className="org-main org-console-main">
        <OrgTopbar heading={currentOrg?.name || organizationId} />
        <section className="org-console-content">
          <div className="org-dashboard-hero">
            <div>
              <div className="eyebrow">Workspace Overview</div>
              <h2>{currentOrg?.name || 'Organization profile loading'}</h2>
              <p>Track application onboarding, registration schemas, login configurations, and readiness for hosted Identity OS redirects.</p>
            </div>
            <div className="org-dashboard-actions">
              <button type="button" className="secondary-button icon-text-button" onClick={() => setView('org-applications')}><AdminIcon name="applications" />Applications</button>
              <button type="button" className="primary-button icon-text-button" onClick={() => setView('org-registration-builder')}><AdminIcon name="schema" />Create Schema</button>
            </div>
          </div>

          <section className="org-widget-grid">
            <article className="org-widget-card blue"><span><AdminIcon name="organizations" /></span><strong>1</strong><label>Organization</label><small>{currentOrg?.status || 'Active'} profile</small></article>
            <article className="org-widget-card green"><span><AdminIcon name="applications" /></span><strong>{orgApps.length}</strong><label>Applications</label><small>{appCounts.approved} approved, {appCounts.pending} pending</small></article>
            <article className="org-widget-card purple"><span><AdminIcon name="schema" /></span><strong>{registrationSchemas.length}</strong><label>Registration Schemas</label><small>{registrationSchemas.filter((schema) => schema.status === 'approved').length} approved</small></article>
            <article className="org-widget-card orange"><span><AdminIcon name="auth" /></span><strong>{loginSchemas.length}</strong><label>Login Configurations</label><small>{loginSchemas.filter((schema) => schema.status === 'approved').length} approved</small></article>
          </section>

          <section className="org-analytics-grid">
            <article className="org-chart-panel large">
              <div className="panel-heading"><h3>Application Approval Status</h3><span>{orgApps.length} total</span></div>
              <div className="status-bar-chart">
                {[
                  ['Approved', appCounts.approved, 'approved'],
                  ['Pending', appCounts.pending, 'pending'],
                  ['Rejected', appCounts.rejected, 'rejected'],
                ].map(([label, value, status]) => (
                  <div key={label} className="status-bar-row">
                    <span>{label}</span>
                    <div><i className={`bar-${status}`} style={{ width: `${percent(Number(value), orgApps.length)}%` }} /></div>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </article>
            <article className="org-chart-panel">
              <div className="panel-heading"><h3>Schema Readiness</h3><span>{readyApplications.length}/{approvedApps.length} apps ready</span></div>
              <div className="auth-donut schema-donut" style={{ background: `conic-gradient(#047857 0 ${percent(schemaCounts.approved, orgSchemas.length)}%, #d97706 ${percent(schemaCounts.approved, orgSchemas.length)}% ${percent(schemaCounts.approved + schemaCounts.pending, orgSchemas.length)}%, #b42318 ${percent(schemaCounts.approved + schemaCounts.pending, orgSchemas.length)}% 100%)` }}><strong>{orgSchemas.length}</strong></div>
              <ul className="legend-list"><li><span className="green-dot" /> Approved {schemaCounts.approved}</li><li><span className="orange-dot" /> Pending {schemaCounts.pending}</li><li><span className="red-dot" /> Rejected {schemaCounts.rejected}</li></ul>
            </article>
          </section>

          <section className="org-dashboard-lower">
            <article className="org-chart-panel">
              <div className="panel-heading"><h3>Organization Profile</h3><span>{currentOrg?.status || 'ACTIVE'}</span></div>
              <div className="profile-mini-grid"><label>Organization ID</label><strong>{organizationId}</strong><label>Official Email</label><strong>{currentOrg?.email || '-'}</strong><label>Registration Number</label><strong>{registrationNumber}</strong></div>
            </article>
            <article className="org-chart-panel">
              <div className="panel-heading"><h3>Recent Activity</h3><span>Live data</span></div>
              <ul className="org-activity-feed">{recentItems.length ? recentItems.map((item) => <li key={item.id}><span><AdminIcon name={item.icon} /></span><div><strong>{item.label}</strong><small>{item.detail}{item.time ? ` - ${item.time}` : ''}</small></div></li>) : <li><span><AdminIcon name="pending" /></span><div><strong>No activity yet</strong><small>Register an application or submit a schema to start.</small></div></li>}</ul>
            </article>
          </section>
        </section>
      </main>
    </div>
  )
}
