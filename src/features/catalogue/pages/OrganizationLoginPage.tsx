'use client'

import PageHeader from '../components/PageHeader'
import { useCatalogue } from '../context/CatalogueContext'

export default function OrganizationLoginPage() {
  const { handleOrgLoginSubmit, orgLoginChannel, orgLoginError, orgLoginId, orgLoginStage, orgOtp, setOrgLoginChannel, setOrgLoginId, setOrgOtp, setView } = useCatalogue()
  return (
    <section className="panel-page">
      <PageHeader title="Identity OS" onBack={() => setView('home')} />
      <div className="progress-indicator three-step">{[1, 2, 3].map((n) => <span key={n} className={`progress-dot ${orgLoginStage === n ? 'active' : ''}`}>{n}</span>)}</div>
      <div className="panel-copy compact"><h2>Organization Admin</h2><p>{orgLoginStage === 1 && 'Enter your Organization ID'}{orgLoginStage === 2 && 'Choose a verification channel'}{orgLoginStage === 3 && 'Enter the OTP received'}</p></div>
      <div className="form-card narrow">
        {orgLoginStage === 1 && <><div className="step-row"><label>ORGANIZATION ID<input value={orgLoginId} onChange={(e) => setOrgLoginId(e.target.value)} placeholder="org_xxxxxxxx" /></label></div>{orgLoginError && <div className="error-message">{orgLoginError}</div>}<button type="button" className="primary-button" onClick={handleOrgLoginSubmit}>Continue</button><p className="hint-text">Demo: org_7k3m9p2x</p></>}
        {orgLoginStage === 2 && <><div className="channel-list"><button type="button" className={`channel-option ${orgLoginChannel === 'email' ? 'selected' : ''}`} onClick={() => setOrgLoginChannel('email')}>Email OTP to the registered representative</button></div>{orgLoginError && <div className="error-message">{orgLoginError}</div>}<button type="button" className="primary-button" onClick={handleOrgLoginSubmit}>Send OTP</button></>}
        {orgLoginStage === 3 && <><div className="step-row"><label>ENTER OTP<input value={orgOtp} onChange={(e) => setOrgOtp(e.target.value)} placeholder="123456" inputMode="numeric" maxLength={6} /></label></div>{orgLoginError && <div className="error-message">{orgLoginError}</div>}<button type="button" className="primary-button" onClick={handleOrgLoginSubmit}>Verify OTP</button><p className="hint-text">The OTP expires shortly and has limited attempts.</p></>}
      </div>
    </section>
  )
}
