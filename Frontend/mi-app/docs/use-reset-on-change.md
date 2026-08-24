# Reset de estado al cambiar deps (`useResetOnChange`)

Describe el hook que **ajusta estado local durante el render** cuando cambian
props o claves, en lugar de un `useEffect` + `setState`. Evita un frame
pintado con el estado viejo y el render en cascada que eso provoca.

Fuente: `src/hooks/useResetOnChange.ts`.
Guía de React: [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect).

## Intent

- Sincronizar estado derivado cuando cambia una dep (id de documento, `postId`,
  modo de búsqueda, apertura de un modal).
- Pintar el estado correcto **en el mismo commit** en el que llega la prop nueva.
- Dejar `useEffect` para efectos secundarios: fetch, DOM (`scrollTo`, overflow),
  timers, observers, callbacks al padre.

## Cómo funciona

```
dep cambia (Object.is, posición a posición)
        │
        ▼
useResetOnChange  ──durante el render──►  reset() + setPrevDeps
        │
        ▼
mismo commit: UI con estado ya reiniciado
```

Comparación idéntica a `useEffect`: `Object.is` por índice. Si cambia la
longitud del array o algún valor, ejecuta `reset`.

```ts
useResetOnChange([postId], () => setLoading(true))
```

Equivalente incorrecto (frame sucio):

```ts
useEffect(() => {
  setLoading(true)
}, [postId])
```

El efecto corre **después** de pintar: un frame muestra `loading === false`
con el `postId` nuevo.

## Contrato

| | |
|---|---|
| Firma | `useResetOnChange(deps: readonly unknown[], reset: () => void): void` |
| Comparación | `Object.is` por posición; también si `deps.length` cambia |
| Momento | Render del mismo componente (patrón «adjusting state when a prop changes») |
| Primer render | No llama `reset` (guarda `deps` como `prevDeps`) |

`reset` **solo** puede llamar `setState` de **este** componente. No fetch, no
DOM, no `navigate`, no callbacks de props.

## Callers actuales

| Archivo | Deps | Qué reinicia |
|---------|------|----------------|
| `LegalContentModal` | `[kind, preloadedDocument]` | error, ready, scroll, doc precargado |
| `LegalContentModal` | `[doc?.id, kind]` | `scrolledToEnd` |
| `TermsPublic` / `PrivacyPublic` | `[doc?.id]` | `markdownReady` |
| `useLegalPublicScrollUnlock` | `[active, contentKey]` | `reachedEnd` |
| `useScrollSentinelVisible` | `[active, contentKey]` | `sentinelVisible` *(sin callers hoy)* |
| `Dashboard` | `[isFeedActive]` | cierra sheet/popover de filtros al salir del feed |
| `FeedSearchBar` | `[mode]` | query + dropdown |
| `useFeedSearch` | `[mode]` | `loading` (el fetch sigue en `useEffect`) |
| `PostImageCarousel` | `[postId]` / `[totalImages]` | loading; clamp del índice |
| `EventHeroCarousel` | `[count]` | índice activo |
| `Step5_Preview` | `[totalImages]` | clamp del índice |
| `OrgsOrbitalModal` | `[open]` | `activeId` al abrir |
| `OrgCarousel` | `[orgs.length]` | índice + animación (refs/timeouts en efecto) |
| `LeftSidebar` | `[editingInterests, interestsList]` | draft de intereses al salir de edición |
| `ProfileAvatar` | `[imageUrl]` | flag de error de imagen |
| `EditOrgProfileModal` | iniciales de nombre/desc/contactos/intereses | formulario |
| `StudentProfileSelf` | `[openSettingsOnMount]` | abre edición; el aviso al padre va en efecto |
| `OrganizationProfileSelf` | `[highlightPostId]` | highlight + tab posts |
| `OrganizationProfilePublic` | `[highlightPostId, publishedPosts]` | highlight |

El scroll (`scrollTo(0, 0)`), el fetch del documento legal y el
`IntersectionObserver` **siguen en** `useEffect`: son efectos, no estado.

## Qué no va aquí

| Caso | Dónde |
|------|--------|
| Fetch / `Promise` | `useEffect` (p. ej. `useFeedSearch`, `LegalContentModal`) |
| DOM: `scrollTo`, `body.style`, listeners | `useEffect` |
| Avisar al padre (`onSettingsOpened`) | `useEffect` — nunca en `reset` |
| Animación que **necesita** el frame inicial (`opacity-0`) | `requestAnimationFrame` en efecto (`PageTransition`) |
| Módulo no-React (`setAnalyticsEnabled`) | `useEffect` (`AnalyticsProvider`) |

## Pitfalls

1. **Deps con identidad inestable.** Un array/objeto creado en el render
   (`posts.filter(...)`, `user.contacts ?? {}`, `user.interests ?? []`)
   cambia en **cada** render (`Object.is` es `false`) → `reset` en bucle o
   el formulario se pisa mientras el usuario escribe.
   - `LeftSidebar` usa `EMPTY_INTERESTS` constante precisamente para evitarlo
     cuando `interests` no viene en las props.
   - `OrganizationProfilePublic` pasa `publishedPosts` (`.filter` cada render):
     preferir `highlightPostId` solo, o una clave primitiva (`posts.length`, ids).
   - `EditOrgProfileModal` recibe `user.contacts ?? {}` y `user.interests ?? []`
     en el padre: si esos campos son `undefined`, el fallback es un objeto
     nuevo cada render.

2. **`reset` no es un efecto.** Si mezclas `scrollTo` o `onClose()` dentro,
   React lo trata como side effect durante el render.

3. **Updater funcional si el valor nuevo depende del anterior.**
   Carruseles usan `setImgIndex((prev) => …)` / `setDraftInterests((prev) => …)`
   para no leer un state stale y para que React baje el re-render si el valor
   no cambia.

4. **Aún hay `setState` en `useEffect`.** No es un bug por sí solo; son
   candidatos si el único trabajo del efecto es ajustar estado:
   - `useFeed`: vacía posts/página al cambiar filtros
   - `ProfileSettingsModal`: copia `initialCycle` / `initialInterests` / …
   - `TermsAcceptance`: resetea checkboxes al cambiar el id del documento
   - `PostImageViewerModal`: clamp de índice + `resetView` (solo `setState`)
   - `useAdminMetrics`: `setPage(1)` al cambiar filtros

## Relacionados

- `useLegalPublicScrollUnlock` — desbloquea «Volver» al llegar al final del
  markdown legal (`TermsPublic` / `PrivacyPublic`). Threshold 64 px.
- `useScrollSentinelVisible` — `IntersectionObserver` sobre un sentinela;
  mismo reset de flag al cambiar `contentKey`. Sin usos en el árbol actual.
- `useRole` — fetch de rol; no usa este patrón (efecto de red).
