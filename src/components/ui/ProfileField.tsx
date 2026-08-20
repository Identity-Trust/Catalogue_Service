export function ProfileField({ label, value, mono, link }: { label: string; value?: string | null; mono?: boolean; link?: boolean }) {
  const displayValue = value || '-'
  const href = link && displayValue !== '-' ? (displayValue.startsWith('http') ? displayValue : `https://${displayValue}`) : ''

  return (
    <div className="profile-field">
      <label>{label}</label>
      {href ? <a href={href} target="_blank" rel="noreferrer">{displayValue}</a> : <p className={mono ? 'mono' : ''}>{displayValue}</p>}
    </div>
  )
}
