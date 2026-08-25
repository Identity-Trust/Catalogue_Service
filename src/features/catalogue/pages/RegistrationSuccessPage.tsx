'use client'

import { useState } from 'react'
import keycloak from '../../../lib/keycloak'
import PageHeader from '../components/PageHeader'
import { useCatalogue } from '../context/CatalogueContext'

export default function RegistrationSuccessPage() {
  const { setView, successData } = useCatalogue()
  const [copied, setCopied] = useState(false)
  const orgId = successData?.orgId || ''

  const copyOrgId = async () => {
    if (!orgId) return
    await navigator.clipboard?.writeText(orgId)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const openPlatformAdmin = async () => {
    await keycloak.login({
      redirectUri: `${window.location.origin}/platform/dashboard`,
    })
  }

  return (
    <section className="panel-page success-page">
      <PageHeader title="Identity OS - Registration Submitted" onBack={() => setView('home')} />
      <div className="success-box">
        <div className="success-status">Submitted successfully</div>
        <h2>Organization registration request created</h2>
        <div className="org-id-box">
          <span>Organization ID</span>
          <div className="org-id-copy-row"><strong>{orgId || '-'}</strong><button type="button" className="secondary-button" onClick={copyOrgId} disabled={!orgId}>{copied ? 'Copied' : 'Copy'}</button></div>
          <small>Use this ID as the organization admin username. The one-time password has also been sent to the official email and is the same as this organization ID.</small>
        </div>
        <div className="meta-row"><div><label>Created</label><p>{successData?.createdAt || '-'}</p></div><div><label>Status</label><p>{successData?.status || '-'}</p></div>{successData?.officialEmail && <div><label>Official Email</label><p>{successData.officialEmail}</p></div>}</div>
      </div>
      <div className="success-actions"><button type="button" className="secondary-button" onClick={() => setView('home')}>Back to Home</button><button type="button" className="secondary-button" onClick={openPlatformAdmin}>Platform Admin Portal</button><button type="button" className="primary-button" onClick={() => setView('organization')}>Organization Admin Login</button></div>
    </section>
  )
}
