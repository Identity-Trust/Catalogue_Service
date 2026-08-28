import App from '../src/App'
import HostedIdentityPage from '../src/features/catalogue/pages/HostedIdentityPage'

interface HomePageProps {
  searchParams?: Promise<{ client_id?: string; redirect_uri?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  if (params?.client_id) {
    return <HostedIdentityPage mode="choice" initialClientId={params.client_id} initialRedirectUri={params.redirect_uri || ''} />
  }
  return <App />
}
