import React from 'react'
export default function AuditList({ logs }) {
  return (
    <div>
      <h3>Audit Logs</h3>
      <div style={{display:'grid',gap:8}}>
        {(!logs || logs.length===0) && <div className="form-card">No audit entries yet.</div>}
        {(logs || []).map(l => (
          <div key={l.id} className="form-card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700}}>{l.action}</div>
              <div style={{color:'rgba(218,228,255,0.7)'}}>{l.details}</div>
            </div>
            <div style={{fontSize:12,opacity:0.8}}>{l.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
