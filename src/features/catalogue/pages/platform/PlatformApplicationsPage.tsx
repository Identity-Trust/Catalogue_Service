'use client'

import PlatformLayout from '../../components/PlatformLayout'
import { useCatalogue } from '../../context/CatalogueContext'

export default function PlatformApplicationsPage() {
  const { addAudit, appFilterStatus, appSearch, applications, approveApplication, setAppCredentialModal, setAppFilterStatus, setApplications, setAppSearch, setOrgApprovalModal, setView } = useCatalogue()
  const filtered = applications.filter((app) => {
    if (appFilterStatus !== 'All' && app.status !== appFilterStatus.toLowerCase()) return false
    const query = appSearch.trim().toLowerCase()
    return !query || (app.name || '').toLowerCase().includes(query) || (app.orgName || '').toLowerCase().includes(query) || (app.id || '').toLowerCase().includes(query)
  })
  return (
    <PlatformLayout title="Identity OS - Applications" heading="Applications">
      <div className="panel-copy"><p>Approve and manage applications registered by organizations.</p></div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:12}}>
        <div style={{display:'flex',gap:8,alignItems:'center'}}><input placeholder="Search applications" value={appSearch} onChange={(e) => setAppSearch(e.target.value)} style={{minWidth:300}} /><select value={appFilterStatus} onChange={(e) => setAppFilterStatus(e.target.value)}><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div>
        <button className="primary-button" onClick={() => setView('platform-pending')}>View Pending Center</button>
      </div>
      <div className="approval-list">{filtered.map((app) => (
        <div key={app.id} className="approval-card">
          <div style={{display:'flex',flexDirection:'column',gap:6}}><div className="approval-name">{app.name}</div><div className="approval-meta">{app.orgName} - {app.type} - {app.id}</div><small style={{opacity:0.86}}>{app.description}</small></div>
          <div className="approval-actions"><button className="ghost-button" onClick={() => setOrgApprovalModal({ type: 'app', item: app })}>View</button>{app.status === 'pending' && <button className="primary-button" onClick={() => { approveApplication(app); addAudit('Approve Application', `Approved ${app.name}`) }}>Approve</button>}{app.status === 'pending' && <button className="secondary-button" onClick={() => { setApplications((prev) => prev.map((item) => item.id === app.id ? { ...item, status: 'rejected', rejectedAt: new Date().toLocaleString() } : item)); addAudit('Reject Application', `Rejected ${app.name}`) }}>Reject</button>}{app.status === 'approved' && <><button className="secondary-button" onClick={() => { navigator.clipboard?.writeText(app.clientId || ''); alert('Client ID copied to clipboard') }}>Copy Client ID</button><button className="secondary-button" onClick={() => setAppCredentialModal({ app, clientId: app.clientId, clientSecret: app.clientSecret })}>View Credentials</button></>}</div>
        </div>
      ))}</div>
    </PlatformLayout>
  )
}
