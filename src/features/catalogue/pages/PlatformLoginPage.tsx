'use client'

import PageHeader from '../components/PageHeader'
import { useCatalogue } from '../context/CatalogueContext'

export default function PlatformLoginPage() {
  const { handlePlatformLogin, platformLogin, platformLoginError, setPlatformLogin, setView } = useCatalogue()
  return (
    <section className="panel-page">
      <PageHeader title="Identity OS" onBack={() => setView('home')} />
      <div className="panel-copy compact"><h2>Platform Admin</h2><p>Sign in to the Identity OS control plane</p></div>
      <div className="form-card narrow">
        <div className="step-row"><label>USERNAME<input value={platformLogin.username} onChange={(e) => setPlatformLogin((prev) => ({ ...prev, username: e.target.value }))} placeholder="admin" /></label></div>
        <div className="step-row"><label>PASSWORD<input type="password" value={platformLogin.password} onChange={(e) => setPlatformLogin((prev) => ({ ...prev, password: e.target.value }))} placeholder="password" /></label></div>
        {platformLoginError && <div className="error-message">{platformLoginError}</div>}
        <button type="button" className="primary-button" onClick={handlePlatformLogin}>Sign In</button>
        <p className="hint-text">Default: admin / admin</p>
      </div>
    </section>
  )
}
