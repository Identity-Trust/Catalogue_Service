'use client'

import PlatformLayout from '../../components/PlatformLayout'
import { useCatalogue } from '../../context/CatalogueContext'

export default function PlatformAuditPage() {
  const { auditLogs } = useCatalogue()
  return (
    <PlatformLayout title="Identity OS - Audit Logs" heading="Audit Logs">
      <div className="approval-list">
        {auditLogs.length === 0 && <div className="form-card">No audit entries yet.</div>}
        {auditLogs.map((log) => <div key={log.id} className="form-card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontWeight:700}}>{log.action}</div><div style={{color:'rgba(218,228,255,0.7)'}}>{log.details}</div></div><div style={{fontSize:12,opacity:0.8}}>{log.timestamp}</div></div>)}
      </div>
    </PlatformLayout>
  )
}
