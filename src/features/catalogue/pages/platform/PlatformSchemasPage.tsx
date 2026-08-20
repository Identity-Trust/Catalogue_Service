'use client'

import PlatformLayout from '../../components/PlatformLayout'
import { useCatalogue } from '../../context/CatalogueContext'

export default function PlatformSchemasPage() {
  const { approveSchema, rejectSchema, schemaFilterStatus, schemaSearch, schemas, schemaTab, setOrgApprovalModal, setSchemaFilterStatus, setSchemaSearch, setSchemaTab } = useCatalogue()
  const filtered = schemas.filter((schema) => {
    if (schemaTab === 'registration' && schema.type !== 'registration') return false
    if (schemaTab === 'login' && schema.type !== 'login') return false
    if (schemaFilterStatus !== 'All' && schema.status !== schemaFilterStatus.toLowerCase()) return false
    const query = schemaSearch.trim().toLowerCase()
    return !query || (schema.name || '').toLowerCase().includes(query) || (schema.orgName || '').toLowerCase().includes(query) || (schema.id || '').toLowerCase().includes(query)
  })
  return (
    <PlatformLayout title="Identity OS - Schema Approvals" heading="Schema Approvals">
      <div className="panel-copy"><p>Review and approve schema definitions and login policies submitted by organizations.</p></div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:12}}>
        <div className="tab-row" style={{margin:0}}><button className={`tab ${schemaTab === 'registration' ? 'active' : ''}`} onClick={() => setSchemaTab('registration')}>Registration Schemas</button><button className={`tab ${schemaTab === 'login' ? 'active' : ''}`} onClick={() => setSchemaTab('login')}>Login Policies</button><button className={`tab ${schemaTab === 'all' ? 'active' : ''}`} onClick={() => setSchemaTab('all')}>All</button></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}><input placeholder="Search by name or org" value={schemaSearch} onChange={(e) => setSchemaSearch(e.target.value)} style={{minWidth:220}} /><select value={schemaFilterStatus} onChange={(e) => setSchemaFilterStatus(e.target.value)}><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div>
      </div>
      <div className="approval-list schema-list">{filtered.map((schema) => <div key={schema.id} className="approval-card"><div><div className="approval-name">{schema.name}</div><div className="approval-meta">{schema.orgName} - {schema.type === 'login' ? 'Login Policy' : 'Schema'} - {schema.id}</div></div><div className="approval-actions"><button type="button" className="ghost-button" onClick={() => setOrgApprovalModal({ type: 'schema', item: schema })}>View</button>{schema.status === 'pending' && <button type="button" className="primary-button" onClick={() => approveSchema(schema)}>Approve</button>}{schema.status === 'pending' && <button type="button" className="secondary-button" onClick={() => rejectSchema(schema)}>Reject</button>}{schema.status === 'approved' && <span className="nav-badge" style={{background:'#34d399'}}>Approved</span>}{schema.status === 'rejected' && <span className="nav-badge" style={{background:'#ef4444'}}>Rejected</span>}</div></div>)}</div>
    </PlatformLayout>
  )
}
