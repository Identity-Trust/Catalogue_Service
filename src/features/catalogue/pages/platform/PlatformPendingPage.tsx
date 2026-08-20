'use client'

import PlatformLayout from '../../components/PlatformLayout'
import { useCatalogue } from '../../context/CatalogueContext'

export default function PlatformPendingPage() {
  const { addAudit, applications, approveApplication, approveOrganization, approveSchema, pendingOrganizations, rejectOrganization, rejectSchema, schemas, setOrgApprovalModal } = useCatalogue()
  return (
    <PlatformLayout title="Identity OS - Pending Center" heading="Pending Items">
      <div className="panel-copy"><p>Centralized view of all pending organizations, applications, and policies/schemas.</p></div>
      <h4>Pending Organizations</h4>
      <div className="approval-list">{pendingOrganizations.map((org) => <div key={org.id} className="approval-card"><div><div className="approval-name">{org.name}</div><div className="approval-meta">{org.type} - {org.country} - {org.id}</div></div><div className="approval-actions"><button className="ghost-button" onClick={() => setOrgApprovalModal({ type: 'org', item: org })}>View</button><button className="primary-button" onClick={() => { approveOrganization(org); addAudit('Approve Organization', `Approved ${org.name}`) }}>Approve</button><button className="secondary-button" onClick={() => { rejectOrganization(org); addAudit('Reject Organization', `Rejected ${org.name}`) }}>Reject</button></div></div>)}</div>
      <h4 style={{marginTop:18}}>Pending Applications</h4>
      <div className="approval-list">{applications.filter((app) => app.status === 'pending').map((app) => <div key={app.id} className="approval-card"><div><div className="approval-name">{app.name}</div><div className="approval-meta">{app.orgName} - {app.type} - {app.id}</div></div><div className="approval-actions"><button className="ghost-button" onClick={() => setOrgApprovalModal({ type: 'app', item: app })}>View</button><button className="primary-button" onClick={() => { approveApplication(app); addAudit('Approve Application', `Approved ${app.name}`) }}>Approve</button></div></div>)}</div>
      <h4 style={{marginTop:18}}>Pending Schemas & Policies</h4>
      <div className="approval-list schema-list">{schemas.filter((schema) => schema.status === 'pending').map((schema) => <div key={schema.id} className="approval-card"><div><div className="approval-name">{schema.name}</div><div className="approval-meta">{schema.orgName} - {schema.type === 'login' ? 'Login Policy' : 'Schema'} - {schema.id}</div></div><div className="approval-actions"><button className="ghost-button" onClick={() => setOrgApprovalModal({ type: 'schema', item: schema })}>View</button><button className="primary-button" onClick={() => approveSchema(schema)}>Approve</button><button className="secondary-button" onClick={() => rejectSchema(schema)}>Reject</button></div></div>)}</div>
    </PlatformLayout>
  )
}
