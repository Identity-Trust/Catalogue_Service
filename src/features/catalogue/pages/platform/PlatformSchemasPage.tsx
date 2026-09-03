'use client'

import { useEffect } from 'react'
import { AdminIcon } from '../../../../components/ui'
import PlatformLayout from '../../components/PlatformLayout'
import { useCatalogue } from '../../context/CatalogueContext'

export default function PlatformSchemasPage() {
  const { approveSchema, refreshCatalogueData, rejectSchema, schemaFilterStatus, schemaSearch, schemas, schemaTab, setOrgApprovalModal, setSchemaFilterStatus, setSchemaSearch, setSchemaTab } = useCatalogue()
  useEffect(() => { refreshCatalogueData?.() }, [])
  const filtered = schemas.filter((schema) => {
    if (schemaTab === 'registration' && schema.type !== 'registration') return false
    if (schemaTab === 'login' && schema.type !== 'login') return false
    if (schemaFilterStatus !== 'All' && schema.status !== schemaFilterStatus.toLowerCase()) return false
    const query = schemaSearch.trim().toLowerCase()
    return !query || (schema.name || '').toLowerCase().includes(query) || (schema.orgName || '').toLowerCase().includes(query) || (schema.id || '').toLowerCase().includes(query)
  })
  const statusIcon = (status: string) => status === 'approved' ? 'check' : status === 'rejected' ? 'rejected' : 'pending'
  return (
    <PlatformLayout title="Identity OS - Schema Approvals" heading="Schema Approvals">
      <div className="platform-schema-page">
        <div className="panel-copy"><p>Review and approve schema definitions and login policies submitted by organizations.</p></div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:12}}>
          <div className="tab-row" style={{margin:0}}><button className={`tab ${schemaTab === 'registration' ? 'active' : ''}`} onClick={() => setSchemaTab('registration')}>Registration Schemas</button><button className={`tab ${schemaTab === 'login' ? 'active' : ''}`} onClick={() => setSchemaTab('login')}>Login Policies</button><button className={`tab ${schemaTab === 'all' ? 'active' : ''}`} onClick={() => setSchemaTab('all')}>All</button></div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}><input placeholder="Search by name or org" value={schemaSearch} onChange={(e) => setSchemaSearch(e.target.value)} style={{minWidth:220}} /><select value={schemaFilterStatus} onChange={(e) => setSchemaFilterStatus(e.target.value)}><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div>
        </div>
        <div className="approval-list schema-list">{filtered.map((schema) => <div key={`${schema.id}-${schema.versionId || schema.createdAt}`} className="approval-card"><div><div className="approval-name-row"><div className="approval-name">{schema.name}</div><span className={`status-pill-ui status-${schema.status}`}><AdminIcon name={statusIcon(schema.status)} />{schema.status}</span></div><div className="approval-meta">{schema.orgName} - {schema.appName || schema.appId || 'Application'} - v{schema.versionNumber || 1} - {schema.type === 'login' ? 'Login Policy' : 'Registration Schema'}</div></div><div className="approval-actions"><button type="button" className="ghost-button icon-text-button" onClick={() => setOrgApprovalModal({ type: 'schema', item: schema })}><AdminIcon name="view" />View</button>{schema.status === 'pending' && <button type="button" className="primary-button icon-text-button" onClick={async () => approveSchema(schema)}><AdminIcon name="check" />Approve</button>}{schema.status === 'pending' && <button type="button" className="secondary-button danger-button icon-text-button" onClick={async () => rejectSchema(schema)}><AdminIcon name="rejected" />Reject</button>}</div></div>)}{!filtered.length && <div className="empty-state">No schema approval records found for this filter.</div>}</div>
      </div>
    </PlatformLayout>
  )
}
