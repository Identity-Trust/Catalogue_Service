'use client'

import { Building2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useCatalogue } from '../context/CatalogueContext'

function RegistrationStep() {
  const { registrationForm, step, updateRegistrationField } = useCatalogue()

  if (step === 0) {
    return (
      <>
        <div className="step-row"><label>ORGANIZATION NAME*<input value={registrationForm.name} onChange={(e) => updateRegistrationField('name', e.target.value)} placeholder="Legal entity name" /></label></div>
        <div className="step-row"><label>ORGANIZATION TYPE*<select value={registrationForm.type} onChange={(e) => updateRegistrationField('type', e.target.value)}><option value="">Select Organization Type</option><option value="Bank">Bank</option><option value="Company">Company</option><option value="Government">Government</option><option value="NGO">NGO</option><option value="Startup">Startup</option><option value="Other">Other</option></select></label></div>
        <div className="step-row"><label>COUNTRY*<select value={registrationForm.country} onChange={(e) => updateRegistrationField('country', e.target.value)}><option value="">Select Country</option><option value="IN">India</option><option value="US">United States</option><option value="GB">United Kingdom</option><option value="SG">Singapore</option><option value="AE">UAE</option><option value="AU">Australia</option></select></label></div>
        <div className="split-row verify-row"><label>OFFICIAL EMAIL*<input type="email" value={registrationForm.email} onChange={(e) => updateRegistrationField('email', e.target.value)} placeholder="admin@yourorg.com" /></label><button type="button" className="verify-button">Verify</button></div>
        <div className="split-row verify-row"><label>OFFICIAL PHONE NUMBER*<input type="tel" inputMode="tel" value={registrationForm.phone} onChange={(e) => updateRegistrationField('phone', e.target.value)} placeholder="+91-XXXXXXXXXX" /></label><button type="button" className="verify-button">Verify</button></div>
      </>
    )
  }
  if (step === 1) return <><div className="split-row verify-row"><label>REGISTRATION NUMBER*<input value={registrationForm.gst} onChange={(e) => updateRegistrationField('gst', e.target.value.toUpperCase())} placeholder="GST / CIN / NGO registration number" /></label><button type="button" className="verify-button">Verify</button></div></>
  if (step === 2) return <><div className="step-row"><label>REPRESENTATIVE NAME*<input value={registrationForm.repName} onChange={(e) => updateRegistrationField('repName', e.target.value)} placeholder="Enter representative name" /></label></div><div className="split-row verify-row"><label>REPRESENTATIVE EMAIL*<input type="email" value={registrationForm.repEmail} onChange={(e) => updateRegistrationField('repEmail', e.target.value)} placeholder="rep@yourorg.com" /></label><button type="button" className="verify-button">Verify</button></div><div className="step-row"><label>MOBILE NUMBER<input type="tel" inputMode="tel" value={registrationForm.repMobile} onChange={(e) => updateRegistrationField('repMobile', e.target.value)} placeholder="+91-XXXXXXXXXX" /></label></div><div className="step-row"><label>DESIGNATION<input value={registrationForm.designation} onChange={(e) => updateRegistrationField('designation', e.target.value)} placeholder="Designation" /></label></div><div className="step-row"><label>EMPLOYEE ID<input value={registrationForm.empId} onChange={(e) => updateRegistrationField('empId', e.target.value)} placeholder="Employee ID" /></label></div></>
  if (step === 3) return <><div className="step-row"><label>ADDRESS LINE 1*<input value={registrationForm.address} onChange={(e) => updateRegistrationField('address', e.target.value)} placeholder="Building, street, area" /></label></div><div className="step-row"><label>ADDRESS LINE 2<input value={registrationForm.addressLine2} onChange={(e) => updateRegistrationField('addressLine2', e.target.value)} placeholder="Landmark, suite, floor" /></label></div><div className="split-row"><label>CITY*<input value={registrationForm.city} onChange={(e) => updateRegistrationField('city', e.target.value)} placeholder="City" /></label><label>DISTRICT<input value={registrationForm.district} onChange={(e) => updateRegistrationField('district', e.target.value)} placeholder="District" /></label></div><div className="split-row"><label>STATE*<input value={registrationForm.state} onChange={(e) => updateRegistrationField('state', e.target.value)} placeholder="State" /></label><label>POSTAL CODE*<input value={registrationForm.postalCode} onChange={(e) => updateRegistrationField('postalCode', e.target.value)} placeholder="Postal code" /></label></div><div className="step-row"><label>ADDRESS PROOF REFERENCE<input value={registrationForm.addressProofRef} onChange={(e) => updateRegistrationField('addressProofRef', e.target.value)} placeholder="Document URL or reference number" /></label></div></>
  return <><div className="step-row"><label>WEBSITE<input type="url" value={registrationForm.website} onChange={(e) => updateRegistrationField('website', e.target.value)} placeholder="https://www.yourorg.com" /></label></div><div className="step-row"><label>DOMAIN<input value={registrationForm.domain} onChange={(e) => updateRegistrationField('domain', e.target.value)} placeholder="yourorg.com" /></label></div><div className="step-row"><label>LOGO UPLOAD<input value={registrationForm.logo} onChange={(e) => updateRegistrationField('logo', e.target.value)} placeholder="Upload logo" /></label></div></>
}

export default function RegistrationPage() {
  const { nextStep, previousStep, registrationError, registrationSteps, registrationSubmitting, setView, step, submitRegistration } = useCatalogue()
  return (
    <section className="panel-page registration-shell">
      <PageHeader title="Identity OS - Organization Registration" onBack={() => setView('home')} />
      <div className="registration-layout">
        <aside className="registration-aside">
          <span className="registration-mark role-icon role-icon-blue">
            <Building2 size={28} strokeWidth={2} />
          </span>
          <h1>Organization Registration</h1>
          <p>Submit verified organization, representative, and address information for Identity OS onboarding.</p>
          <div className="registration-steps-list">{registrationSteps.map((item, index) => <div key={item} className={`registration-step-item ${index === step ? 'active' : ''}`}><span>{index + 1}</span><strong>{item}</strong></div>)}</div>
        </aside>
        <div className="registration-main">
          <div className="progress-indicator registration-progress">{registrationSteps.map((item, index) => <span key={item} className={`progress-dot ${index === step ? 'active' : ''}`}>{index + 1}</span>)}</div>
          <div className="panel-copy registration-copy"><h2>{registrationSteps[step]}</h2><p>{step === 0 && 'Provide your organization basic details'}{step === 1 && 'Add your registration details'}{step === 2 && 'Provide your representative information'}{step === 3 && 'Add your office address'}{step === 4 && 'Add your digital presence and branding'}</p></div>
          <div className="form-card registration-card">
            <RegistrationStep />
            {registrationError && <div className="error-message">{registrationError}</div>}<div className="form-actions"><button type="button" className="secondary-button" onClick={() => setView('home')}>Cancel</button><div className="form-actions-right">{step > 0 && <button type="button" className="secondary-button" onClick={previousStep}>Previous</button>}{step < registrationSteps.length - 1 ? <button type="button" className="primary-button" onClick={nextStep}>Next</button> : <button type="button" className="primary-button" onClick={submitRegistration} disabled={registrationSubmitting}>{registrationSubmitting ? 'Submitting...' : 'Submit'}</button>}</div></div>
          </div>
        </div>
      </div>
    </section>
  )
}
