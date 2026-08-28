'use client'

import { useEffect } from 'react'
import { AdminIcon } from '../../../../components/ui'
import PlatformLayout from '../../components/PlatformLayout'
import { useCatalogue } from '../../context/CatalogueContext'

export default function PlatformApplicationsPage() {
  const { addAudit, appFilterStatus, appSearch, applications, approveApplication, refreshCatalogueData, rejectApplication, setAppCredentialModal, setAppFilterStatus, setAppSearch, setOrgApprovalModal } = useCatalogue()
  useEffect(() => { refreshCatalogueData?.() }, [])
  const filtered = applications.filter((app) => {
    if (appFilterStatus !== 'All' && app.status !== appFilterStatus.toLowerCase()) return false
    const query = appSearch.trim().toLowerCase()
    return !query || (app.name || '').toLowerCase().includes(query) || (app.orgName || '').toLowerCase().includes(query) || (app.id || '').toLowerCase().includes(query)
  })
  const statusIcon = (status: string) => status === 'approved' ? 'check' : status === 'rejected' ? 'rejected' : 'pending'
  return (
    <PlatformLayout title="Identity OS - Applications" heading="Applications">
      <div className="panel-copy"><p>Approve and manage applications registered by organizations.</p></div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:12}}>
        <div style={{display:'flex',gap:8,alignItems:'center'}}><input placeholder="Search applications" value={appSearch} onChange={(e) => setAppSearch(e.target.value)} style={{minWidth:300}} /><select value={appFilterStatus} onChange={(e) => setAppFilterStatus(e.target.value)}><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div>
      </div>
      <div className="approval-list">{filtered.map((app) => (
        <div key={app.id} className="approval-card">
          <div style={{display:'flex',flexDirection:'column',gap:6}}><div className="approval-name-row"><div className="approval-name">{app.name}</div><span className={`status-pill-ui status-${app.status}`}><AdminIcon name={statusIcon(app.status)} />{app.status}</span></div><div className="approval-meta">{app.orgName} - {app.type} - {app.id}</div><small className="approval-description">{app.description}</small></div>
          <div className="approval-actions"><button className="ghost-button icon-text-button" onClick={() => setOrgApprovalModal({ type: 'app', item: app })}><AdminIcon name="view" />View</button>{app.status === 'pending' && <button className="primary-button icon-text-button" onClick={async () => { await approveApplication(app); addAudit('Approve Application', `Approved ${app.name}`) }}><AdminIcon name="check" />Approve</button>}{app.status === 'pending' && <button className="secondary-button danger-button icon-text-button" onClick={async () => { await rejectApplication(app); addAudit('Reject Application', `Rejected ${app.name}`) }}><AdminIcon name="rejected" />Reject</button>}{app.status === 'approved' && <><button className="secondary-button" onClick={() => { navigator.clipboard?.writeText(app.clientId || app.id); alert('Client ID copied to clipboard') }}>Copy Client ID</button><button className="secondary-button" onClick={() => setAppCredentialModal({ app, clientId: app.clientId || app.id, clientSecret: app.clientSecret })}>View Credentials</button></>}</div>
        </div>
      ))}{!filtered.length && <div className="empty-state">No applications found for this filter.</div>}</div>
    </PlatformLayout>
  )
}
