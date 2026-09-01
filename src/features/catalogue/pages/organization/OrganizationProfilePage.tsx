'use client'

import { AdminIcon, ProfileField } from '../../../../components/ui'
import OrgSidebar from '../../components/OrgSidebar'
import OrgTopbar from '../../components/OrgTopbar'
import { useCatalogue } from '../../context/CatalogueContext'

export default function OrganizationProfilePage() {
  const { currentOrg, orgLoginId } = useCatalogue()
  const org = currentOrg
  const representative = org?.representative
  const address = org?.addressDetails
  const registrationNumber = org?.registrationDetails?.gst || org?.registrationDetails?.registrationNumber || '-'

  return (
    <div className="org-dashboard-shell org-profile-shell">
      <OrgSidebar activeItem="Organization Profile" />
      <main className="org-main org-profile-main">
        <OrgTopbar heading="Organization Profile" subtitle={representative?.name || org?.id || 'Organization Admin'} />
        <section className="org-profile-content">
          <article className="org-profile-card org-profile-summary">
            <div className="org-profile-hero"><span className="org-profile-logo"><AdminIcon name="organizations" /></span><div><h2>{org?.name || '-'}</h2><div className="org-profile-badges"><span>{org?.type || '-'}</span><span className="approved">Approved</span></div><code>{org?.id || orgLoginId}</code></div></div>
            <div className="org-profile-details-grid"><ProfileField label="Organization ID" value={org?.id || orgLoginId} mono /><ProfileField label="Name" value={org?.name} /><ProfileField label="Type" value={org?.type} /><ProfileField label="Country" value={org?.country} /><ProfileField label="Official Email" value={org?.email} /><ProfileField label="Phone" value={org?.phone} /><ProfileField label="Registration Type" value={org?.registrationType || (org?.registrationDetails?.gst ? 'GST' : '-')} /><ProfileField label="Registration Number" value={registrationNumber} /><ProfileField label="Registration Authority" value={org?.registrationDetails?.authority} /><ProfileField label="Verification Status" value={org?.registrationDetails?.verificationStatus} /></div>
          </article>
          <div className="org-profile-lower-grid"><article className="org-profile-card"><h3>Representative</h3><ProfileField label="Name" value={representative?.name} /><ProfileField label="Email" value={representative?.email} /><ProfileField label="Mobile" value={representative?.mobile} /><ProfileField label="Designation" value={representative?.designation} /><ProfileField label="Employee ID" value={representative?.employeeId} /></article><article className="org-profile-card"><h3>Address</h3><ProfileField label="Address Type" value={address?.type} /><ProfileField label="Address Line 1" value={address?.line1} /><ProfileField label="Address Line 2" value={address?.line2} /><ProfileField label="City" value={address?.city} /><ProfileField label="District" value={address?.district} /><ProfileField label="State" value={address?.state} /><ProfileField label="Postal Code" value={address?.postalCode} /><ProfileField label="Country" value={address?.country} /><ProfileField label="Address Proof Ref" value={address?.proofRef} /><ProfileField label="Website" value={org?.website || org?.domain} link /></article></div>
        </section>
      </main>
    </div>
  )
}
