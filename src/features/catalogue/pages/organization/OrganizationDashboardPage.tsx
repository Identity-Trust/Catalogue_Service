'use client'

import OrgSidebar from '../../components/OrgSidebar'
import { useCatalogue } from '../../context/CatalogueContext'

export default function OrganizationDashboardPage() {
  const { applications, currentOrg, pendingOrganizations, setView } = useCatalogue()
  return (
    <div className="org-dashboard-shell">
      <OrgSidebar activeItem="Dashboard" />
      <main className="org-main">
        <header className="org-main-header"><div><div className="eyebrow">Organization Admin</div><h2>{currentOrg?.name || 'TechNova Solutions'} Overview</h2></div><div style={{display:'flex',gap:12}}><button type="button" className="secondary-button" onClick={() => setView('home')}>Sign Out</button><button type="button" className="primary-button" onClick={() => setView('org-registration-builder')}>Open Registration Builder</button></div></header>
        <section className="kpi-grid"><div className="kpi-card"><strong>{100 + applications.length}</strong><span>Total Users</span></div><div className="kpi-card"><strong>80</strong><span>Active Users</span></div><div className="kpi-card"><strong>{applications.length}</strong><span>Applications</span></div><div className="kpi-card"><strong>{pendingOrganizations.length}</strong><span>Registration Requests</span></div><div className="kpi-card"><strong>4200</strong><span>Login Attempts</span></div><div className="kpi-card"><strong>3</strong><span>Security Alerts</span></div></section>
        <section className="chart-grid"><div className="chart-card large"><h4>User Registration Trend</h4><div className="chart-bars">{[20,40,55,70,80,95].map((value) => <span key={value} style={{ height: `${value}%` }} />)}</div></div><div className="chart-card"><h4>Login Success vs Failure</h4><div className="donut-wrapper"><div className="donut" /></div></div><div className="chart-card"><h4>Authentication Methods</h4><ul className="mini-list"><li>Password 60%</li><li>OTP 30%</li><li>SSO 10%</li></ul></div><div className="chart-card wide"><h4>Recent Activity</h4><ul className="activity-list">{applications.slice(0, 5).map((app) => <li key={app.id}>{app.orgName} requested {app.name}</li>)}</ul></div></section>
      </main>
    </div>
  )
}
