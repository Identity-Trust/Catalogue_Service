'use client'

import PageHeader from '../components/PageHeader'
import { useCatalogue } from '../context/CatalogueContext'

function RegistrationStep() {
  const { registrationForm, step, updateRegistrationField } = useCatalogue()
  if (step === 0) {
    return (
      <>
        <div className="step-row"><label>ORGANIZATION NAME*<input value={registrationForm.name} onChange={(e) => updateRegistrationField('name', e.target.value)} placeholder="Legal entity name" /></label></div>
        <div className="step-row"><label>ORGANIZATION TYPE*<select value={registrationForm.type} onChange={(e) => updateRegistrationField('type', e.target.value)}><option value="">Select Organization Type</option><option value="Bank">Bank</option><option value="Company">Company</option><option value="Government">Government</option><option value="NGO">NGO</option><option value="Startup">Startup</option><option value="Other">Other</option></select></label></div>
        <div className="step-row"><label>COUNTRY*<select value={registrationForm.country} onChange={(e) => updateRegistrationField('country', e.target.value)}><option value="">Select Country</option><option value="India">India</option><option value="United States">United States</option><option value="United Kingdom">United Kingdom</option><option value="Singapore">Singapore</option><option value="UAE">UAE</option><option value="Australia">Australia</option></select></label></div>
        <div className="split-row"><label>OFFICIAL EMAIL*<input value={registrationForm.email} onChange={(e) => updateRegistrationField('email', e.target.value)} placeholder="admin@yourorg.com" /></label><button type="button" className="ghost-button">Send OTP to verify -&gt;</button></div>
        <div className="split-row"><label>OFFICIAL PHONE NUMBER*<input value={registrationForm.phone} onChange={(e) => updateRegistrationField('phone', e.target.value)} placeholder="+91-XXXXXXXXXX" /></label><button type="button" className="ghost-button">Send OTP to verify -&gt;</button></div>
      </>
    )
  }
  if (step === 1) return <><div className="step-row"><label>REGISTRATION NUMBER*<input value={registrationForm.gst} onChange={(e) => updateRegistrationField('gst', e.target.value)} placeholder="GST / CIN / NGO registration number" /></label></div><button type="button" className="ghost-button align-start">Verify</button></>
  if (step === 2) return <><div className="step-row"><label>REPRESENTATIVE NAME*<input value={registrationForm.repName} onChange={(e) => updateRegistrationField('repName', e.target.value)} placeholder="Enter representative name" /></label></div><div className="split-row"><label>REPRESENTATIVE EMAIL*<input value={registrationForm.repEmail} onChange={(e) => updateRegistrationField('repEmail', e.target.value)} placeholder="rep@yourorg.com" /></label><button type="button" className="ghost-button">Send OTP to verify -&gt;</button></div><div className="step-row"><label>MOBILE NUMBER*<input value={registrationForm.repMobile} onChange={(e) => updateRegistrationField('repMobile', e.target.value)} placeholder="+91-XXXXXXXXXX" /></label></div><div className="step-row"><label>DESIGNATION*<input value={registrationForm.designation} onChange={(e) => updateRegistrationField('designation', e.target.value)} placeholder="Designation" /></label></div></>
  if (step === 3) return <div className="step-row"><label>ADDRESS*<textarea value={registrationForm.address} onChange={(e) => updateRegistrationField('address', e.target.value)} placeholder="Street, city, state, postal code, country" rows={5} /></label></div>
  return <><div className="step-row"><label>WEBSITE<input value={registrationForm.website} onChange={(e) => updateRegistrationField('website', e.target.value)} placeholder="https://www.yourorg.com" /></label></div><div className="step-row"><label>DOMAIN<input value={registrationForm.domain} onChange={(e) => updateRegistrationField('domain', e.target.value)} placeholder="yourorg.com" /></label></div><div className="step-row"><label>LOGO UPLOAD<input value={registrationForm.logo} onChange={(e) => updateRegistrationField('logo', e.target.value)} placeholder="Upload logo" /></label></div></>
}

export default function RegistrationPage() {
  const { nextStep, previousStep, registrationSteps, setView, step, submitRegistration } = useCatalogue()
  return (
    <section className="panel-page">
      <PageHeader title="Identity OS - Organization Registration" onBack={() => setView('home')} />
      <div className="progress-indicator">{registrationSteps.map((item, index) => <span key={item} className={`progress-dot ${index === step ? 'active' : ''}`}>{index + 1}</span>)}</div>
      <div className="panel-copy"><h2>Step {step + 1} of {registrationSteps.length}: {registrationSteps[step]}</h2><p>{step === 0 && 'Provide your organization basic details'}{step === 1 && 'Add your registration details'}{step === 2 && 'Provide your representative information'}{step === 3 && 'Add your office address'}{step === 4 && 'Add your digital presence and branding'}</p></div>
      <div className="form-card">
        <RegistrationStep />
        <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setView('home')}>Cancel</button><div className="form-actions-right">{step > 0 && <button type="button" className="secondary-button" onClick={previousStep}>Previous</button>}{step < registrationSteps.length - 1 ? <button type="button" className="primary-button" onClick={nextStep}>Next</button> : <button type="button" className="primary-button" onClick={submitRegistration}>Submit</button>}</div></div>
      </div>
    </section>
  )
}
