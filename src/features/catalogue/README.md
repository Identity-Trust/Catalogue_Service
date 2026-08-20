# Catalogue Feature Structure

- `CatalogueApp.tsx` owns the current demo workflow and screen-level state.
- Shared data contracts live in `src/types/catalogue.ts`.
- Temporary seed/demo data lives in `src/data/mockCatalogueData.ts`.
- Browser utilities such as local storage live in `src/utils`.
- API integrations should start in `src/services`, then be called from feature hooks or screen containers.
- Reusable UI pieces belong in `src/components/ui`.

As the app grows, move each state-heavy screen from `CatalogueApp.tsx` into this folder as its own component and pass only the state/actions it needs.
