'use client'

import PageHeader from '../components/PageHeader'
import { useCatalogue } from '../context/CatalogueContext'

export default function RegistrationSuccessPage() {
  const { setView, successData } = useCatalogue()
  return (
    <section className="panel-page success-page">
      <PageHeader title="Identity OS - Registration Submitted" onBack={() => setView('home')} />
      <div className="success-box">
        <div className="success-status">Submitted successfully</div>
        <h2>Organization registration request created</h2>
        <div className="org-id-box"><span>Organization ID</span><strong>{successData?.orgId}</strong><small>Save this ID - you will need it to log in as Organization Admin</small></div>
        <div className="meta-row"><div><label>Created</label><p>{successData?.createdAt}</p></div><div><label>Status</label><p>{successData?.status}</p></div></div>
      </div>
      <div className="success-actions"><button type="button" className="secondary-button" onClick={() => setView('home')}>Back to Home</button><button type="button" className="primary-button" onClick={() => setView('platform')}>Open Admin Portal</button></div>
    </section>
  )
}
