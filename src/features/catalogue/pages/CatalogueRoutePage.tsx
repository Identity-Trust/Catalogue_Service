'use client'

import CatalogueApp from '../CatalogueApp'
import type { CatalogueView } from '../routes'

interface CatalogueRoutePageProps {
  view: CatalogueView
}

export default function CatalogueRoutePage({ view }: CatalogueRoutePageProps) {
  return <CatalogueApp initialView={view} />
}
