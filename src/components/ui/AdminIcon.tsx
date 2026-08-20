const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function AdminIcon({ name }: { name?: string }) {
  const paths = {
    shield: <><path {...common} d="M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3z" /><path {...common} d="M9 12l2 2 4-5" /></>,
    dashboard: <><rect {...common} x="4" y="4" width="6" height="6" /><rect {...common} x="14" y="4" width="6" height="6" /><rect {...common} x="4" y="14" width="6" height="6" /><rect {...common} x="14" y="14" width="6" height="6" /></>,
    organizations: <><path {...common} d="M6 21V7h8v14" /><path {...common} d="M10 21V3h8v18" /><path {...common} d="M8 11h2M8 15h2M12 7h2M12 11h2M12 15h2" /></>,
    applications: <><path {...common} d="M12 4l8 4-8 4-8-4 8-4z" /><path {...common} d="M4 12l8 4 8-4" /><path {...common} d="M4 16l8 4 8-4" /></>,
    schema: <><path {...common} d="M7 3h7l4 4v14H7V3z" /><path {...common} d="M14 3v5h5" /><path {...common} d="M10 13l2 2 3-5" /></>,
    identity: <><circle {...common} cx="9" cy="8" r="4" /><path {...common} d="M3 21c.7-4 3-6 6-6 2 0 3.6.8 4.8 2.4" /><path {...common} d="M17 8v6M14 11h6" /></>,
    auth: <><path {...common} d="M4 12h4l2-7 4 14 2-7h4" /></>,
    audit: <><path {...common} d="M8 4h8l2 3v14H6V7l2-3z" /><path {...common} d="M9 12h6M9 16h6M10 4v4h4V4" /></>,
    security: <><path {...common} d="M12 3l7 3v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3z" /></>,
    api: <><path {...common} d="M8 7H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h3M16 7h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-3M9 17h6M9 21h6" /></>,
    trust: <><path {...common} d="M5 13l4 4L19 7" /><path {...common} d="M5 5h14v14H5z" /></>,
    reports: <><path {...common} d="M6 20V10M12 20V4M18 20v-7" /></>,
    notifications: <><path {...common} d="M18 16v-5a6 6 0 1 0-12 0v5l-2 3h16l-2-3z" /><path {...common} d="M10 21h4" /></>,
    check: <><circle {...common} cx="12" cy="12" r="9" /><path {...common} d="M8 12l3 3 5-6" /></>,
  }

  return <svg className="admin-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name] || paths.dashboard}</svg>
}
