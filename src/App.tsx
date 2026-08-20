import CatalogueApp from './features/catalogue/CatalogueApp'
import type { CatalogueView } from './features/catalogue/routes'

interface AppProps {
  initialView?: CatalogueView
}

export default function App({ initialView }: AppProps) {
  return <CatalogueApp initialView={initialView} />
}
