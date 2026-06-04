# 🎨 Utopp — Frontend Design System

> Documento vivo que describe el sistema de diseño, componentes, layout y reglas visuales del frontend de Utopp.
> Generado desde el análisis del código en `Frontend/mi-app/src/`.

---

## 1. Identidad de Marca

### Paleta de Colores Oficial

| Token | Hex | Uso |
|---|---|---|
| `brand.blue` | `#2563EB` | Color primario azul de marca |
| `brand.violet` | `#9333EA` | Color secundario violeta |
| `brand.fuchsia` | `#C026D3` | Color de acento fucsia |
| `brand.blue-alt` | `#2f55f6` | Variante azul para gradientes (CTAs, botones) |
| `brand.fuchsia-alt` | `#ba4ef8` | Variante fucsia para gradientes (CTAs, botones) |

### Gradientes de Marca

```
// Principal (diagonal) — logo, avatares fallback, squircle "U"
bg-gradient-to-br from-[#2f55f6] to-[#ba4ef8]

// Horizontal — botones pill primarios, barra "Crear"
bg-gradient-to-r from-[#2f55f6] to-[#ba4ef8]

// Texto — wordmark "utopp", headings de acento
bg-gradient-to-r from-[#2f55f6] to-[#ba4ef8] bg-clip-text text-transparent
```

### Gradientes por Tipo de Post (avatares de usuario en tarjetas)

| Tipo | Gradiente |
|---|---|
| `international_opportunity` | `from-blue-500 to-cyan-500` |
| `event` | `from-purple-500 to-pink-500` |
| `academic_project` | `from-green-500 to-emerald-500` |
| `announcement` | `from-orange-500 to-red-500` |
| `simple_post` | `from-gray-500 to-slate-500` |

### Logo y Assets

- **Logo oficial (CDN):** `https://raw.githubusercontent.com/gussephe-benjamin/Utopp/refs/heads/main/Frontend/mi-app/public/tempo-image-20251218T034846856Z.png`
- **Fondo de pantallas auth:** Foto de campus institucional (portada login/register)
- **Overlay auth:** `linear-gradient(to bottom right, rgba(255,255,255,0.66), rgba(116,113,113,0.61), rgba(48,46,46,0.68))`

---

## 2. Tipografía

La app usa la **fuente del sistema de Tailwind CSS** (sans-serif por defecto). No se ha configurado una fuente custom explícita en `tailwind.config.js`.

### Escala tipográfica usada (clases frecuentes)

| Rol | Clase Tailwind | Uso |
|---|---|---|
| Heading card | `text-base sm:text-lg font-extrabold` | Título de PostCard |
| Heading sidebar | `text-sm font-bold` | Títulos de widgets |
| Heading perfil | `text-lg font-bold` | Nombre en LeftSidebar |
| Subheading | `text-xs font-semibold` | Labels, timestamps, metadata |
| Body | `text-sm font-medium leading-relaxed` | Descripción de posts |
| Caption | `text-[11px] font-semibold` | Tiempo relativo, email |
| Micro | `text-[10px] font-bold` | Conteos, badges pequeños |
| Wordmark | `text-lg font-bold tracking-tight` | "utopp" en la barra |

---

## 3. Espaciado y Bordes

### Radios de borde frecuentes

| Elemento | Clase |
|---|---|
| Tarjeta de post (PostCard) | `rounded-[22px]` |
| Modales / popovers | `rounded-xl` |
| Botones pill (filtros, CTA) | `rounded-full` |
| Avatares de usuario | `rounded-full` |
| Logo "U" (header) | `rounded-xl` |
| Logo "U" (auth) | `rounded-2xl` |
| Tags de intereses | `rounded-full` |
| Inputs auth | `rounded-lg` o `rounded-full` |

### Sombras frecuentes

```css
/* Tarjeta feed (reposo) */
shadow-[0_4px_20px_rgba(0,0,0,0.015)]

/* Tarjeta feed (hover) */
shadow-[0_8px_30px_rgba(0,0,0,0.03)]

/* Botón CTA primario */
shadow-[0_4px_14px_rgba(47,85,246,0.25)]

/* Botón CTA primario (hover) */
shadow-[0_6px_20px_rgba(186,78,248,0.35)]

/* Barra superior escritorio */
shadow-[0_1px_12px_rgba(0,0,0,0.06)]

/* Barra inferior móvil */
shadow-[0_-4px_20px_rgba(0,0,0,0.03)]

/* Modales y sheets */
shadow-[0_8px_30px_rgba(0,0,0,0.12)]
```

---

## 4. Layout General

### Breakpoints (Tailwind por defecto)

| Nombre | Ancho | Comportamiento |
|---|---|---|
| `sm` | ≥ 640px | Oculta barra inferior móvil (`sm:hidden`) |
| `md` | ≥ 768px | Muestra barra superior de escritorio (`md:block`) |
| `lg` | ≥ 1024px | Muestra sidebar izquierdo del feed |
| `xl` | ≥ 1280px | Muestra sidebar derecho del feed |

### Estructura de pantalla principal (Dashboard)

```
┌─────────────────────────────────────────────────┐
│  AppTopBar (fixed, h-14, solo md+)               │
├─────────────────────────────────────────────────┤
│                                                  │
│  LeftSidebar │     Contenido principal    │ RightSidebar │
│  (w-72, lg+) │  (max-w-2xl, centrado)    │ (w-80, xl+)  │
│              │                            │              │
│              │  Feed / Profile / Outlet   │              │
│              │                            │              │
├─────────────────────────────────────────────────┤
│  FeedBottomBar / Nav Móvil (fixed, h-14, <sm)   │
└─────────────────────────────────────────────────┘
```

### Máximos de ancho

| Zona | Clase |
|---|---|
| Barra superior | `max-w-[1320px] mx-auto` |
| Feed (columna central) | `max-w-2xl` (implícito por grid) |
| Barra inferior | `max-w-6xl mx-auto` |
| Bottom Sheet (móvil) | `w-full` (fullwidth) |

---

## 5. Navegación

### Escritorio — `AppTopBar` (`hidden md:block`)

Componente: [`AppTopBar.tsx`](src/features/dashboard/components/AppTopBar.tsx)

| Zona | Contenido |
|---|---|
| Izquierda | `UtoppBrandMark` (logo U + wordmark) |
| Centro | Barra de búsqueda (input pill) |
| Derecha | Botón "Crear oportunidad" · Filtros · Campana · Avatar cuenta |

### Móvil — `FeedBottomBar` (`sm:hidden`)

Componente: [`FeedBottomBar.tsx`](src/features/feed/components/FeedBottomBar.tsx)

Distribución dinámica calculada con `ResizeObserver`:
- **Centro:** Botón `+` (Crear oportunidad) con gradiente de marca
- **Izquierda del +:** Logo `UtoppBrandMark`
- **Derecha del +:** Botón filtros (si está en feed) + Avatar de cuenta

### Rutas de la app

| Ruta | Página / Componente |
|---|---|
| `/` | `AppRoute` (redirige según auth) |
| `/login` | `Login` |
| `/register` | `RegisterOG` |
| `/onboarding` | `Onboarding` |
| `/app/terms` | `TermsAcceptance` |
| `/app/inicio` | `Feed` → `StudentFeedPage` |
| `/app/perfil` | `Profile` → `StudentProfilePage` |
| `/app/perfil/:id` | `Profile` (vista de otro usuario) |
| `/app/horario` | `Schedule` |
| `/terms` | `TermsPublic` |
| `/privacy` | `PrivacyPublic` |

---

## 6. Componentes

### 6.1 Componentes Globales (`src/components/`)

#### `PublicationWizard`
Modal multi-paso para crear publicaciones. Implementa un `reducer` para manejar el estado del formulario.

**Pasos del wizard:**
1. `Step1_TypeSelection` — Tipo de publicación
2. `Step2_SubtypeSelection` — Subtipo
3. `Step3_LinksForm` — URLs/botones
4. `Step4_GeneralInfo` — Título, descripción, deadline, tags
5. `StepFrameEditor` — Editor de imágenes con recorte/escala
6. `Step5_Preview` — Vista previa antes de publicar

**Animación:** `AnimatePresence + motion.div` con spring `scale 0.95 → 1, opacity 0 → 1`.

#### `EditPostWizard`
Misma estructura que `PublicationWizard` pero en modo edición. Reutiliza los mismos Steps.

#### `PostDetailModal`
Modal de detalle completo de una publicación. Se monta con `ReactDOM.createPortal` sobre el `body`.

**Incluye:** Carrusel de imágenes con navegación, botones de acción, información del autor, tags, links con botones.

**Animación:** `AnimatePresence` con backdrop y panel animados (fade + slide).

#### `ModernStepper`
Indicador visual de progreso de pasos del wizard (barra de puntos/líneas).

#### `PageTransition`
Wrapper de transición entre páginas (motion wrapper).

### 6.2 Componentes UI Base (`src/components/ui/`)

| Componente | Descripción |
|---|---|
| `Button` | Botón con variantes CVA: `default, destructive, outline, secondary, ghost, link` |
| `SyntheticBadge` | Chip violeta `✦ Data Sintética` para marcar widgets con datos hardcodeados |
| `input` | Input base con clases de Tailwind |

### 6.3 Feature: Feed (`src/features/feed/components/`)

| Componente | Descripción |
|---|---|
| `PostCard` | Tarjeta principal del feed con carrusel, menú, estadísticas y acciones |
| `FeedHorizontalFilters` | Fila de chips pill para filtrar por status, urgencia, y categorías |
| `FeedFiltersPanel` | Panel lateral/flotante con filtros avanzados |
| `FeedBottomBar` | Barra de navegación inferior (solo móvil, `sm:hidden`) |
| `FeedWelcomeBanner` | Banner de bienvenida en la parte superior del feed |
| `FeedQuickCreate` | Caja rápida de creación de publicaciones |
| `LeftSidebar` | Sidebar izquierdo con widget de perfil e intereses (solo `lg+`) |
| `RightSidebar` | Sidebar derecho con Trending, Orgs destacadas, Esta semana (solo `xl+`) |
| `PostImageViewerModal` | Modal de visualización de imágenes en pantalla completa |
| `ScoreExplanation` | Popover que explica el score de relevancia de un post |
| `UserAvatar` | Avatar de usuario con gradiente de fallback por tipo de post |

### 6.4 Feature: Dashboard (`src/features/dashboard/components/`)

| Componente | Descripción |
|---|---|
| `AppTopBar` | Barra superior de escritorio (brand + búsqueda + acciones) |
| `AccountOptionsSheet` | Panel de opciones de cuenta (escritorio: popover; móvil: bottom sheet) |

### 6.5 Feature: Profile (`src/features/profile/components/`)

| Componente | Descripción |
|---|---|
| `ProfilePostListCard` | Tarjeta compacta para listas de posts en el perfil |
| `EditProfileModal` | Modal para editar nombre, carrera, ciclo, avatar |
| `OrganizationsManagerModal` | Modal para gestionar organizaciones del usuario |
| `ConfirmModal` | Modal de confirmación genérico |

### 6.6 Shared Brand (`src/shared/brand/`)

| Componente | Variantes |
|---|---|
| `UtoppBrandMark` | `header` (U + wordmark, compacto) / `auth` (U grande, centrado) |
| `UtoppLogo` | Logo estático sin wordmark |

---

## 7. Animaciones (Framer Motion)

Dependencia: `framer-motion` (instalada).

### Reglas Generales

- **Duración corta:** `duration: 0.15–0.3s` para modales y popups
- **Spring:** `stiffness: 300, damping: 24` para popups (sensación nativa iOS)
- **Nunca bloquear el scroll:** Las animaciones de entrada son `opacity + scale/y`

### Animaciones Implementadas

#### PostCard — Carga escalonada del feed
```tsx
// Contenedor en Feed (stagger)
variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}

// Cada tarjeta (motion.div)
variants={{
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
}}
whileInView="show"
viewport={{ once: true, margin: "-50px" }}
```

#### PublicationWizard / EditPostWizard — Apertura del modal
```tsx
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.95 }}
transition={{ type: "spring", stiffness: 350, damping: 28 }}
```

#### PostDetailModal — Backdrop + panel
```tsx
// Backdrop
initial={{ opacity: 0 }} → animate={{ opacity: 1 }} → exit={{ opacity: 0 }}

// Panel
initial={{ opacity: 0, y: 24, scale: 0.97 }} → animate={{ opacity: 1, y: 0, scale: 1 }}
```

#### Profile — Indicador de pestaña activa
```tsx
// Barra/fondo indicador viaja fluidamente con:
layoutId="activeTabIndicator"
```

#### AccountOptionsSheet — Bottom sheet en móvil
```
CSS Tailwind: animate-in slide-in-from-bottom duration-300
```

---

## 8. Patrones de Interacción

### Botón CTA Primario
```tsx
// Estilo estándar para botones de acción principal
className="bg-gradient-to-r from-[#2f55f6] to-[#ba4ef8]
           hover:brightness-110
           active:scale-95
           transition-all duration-300
           shadow-[0_4px_14px_rgba(47,85,246,0.25)]
           hover:shadow-[0_6px_20px_rgba(186,78,248,0.35)]
           rounded-full text-white font-bold"
```

### Chips / Pills de filtro (estado activo)
```tsx
// Activo
`${TW_UTOPP_GRADIENT_R} text-white border-transparent shadow-sm`

// Inactivo
"bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
```

### Hover en tarjetas
```
hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)]
hover:-translate-y-[1px]
transition-all duration-300
```

### Post Destacado (Pinned)
```
border-amber-200/75
shadow-[0_4px_24px_rgba(245,158,11,0.04)]
ring-1 ring-amber-100/30
```

### Estados de Post Badge
| Estado | Estilo |
|---|---|
| `published` | `bg-green-100 text-green-700` |
| `draft` | `bg-yellow-100 text-yellow-700` |
| `archived` | `bg-gray-100 text-gray-500` |

---

## 9. Formularios y Auth

### Pantalla de Autenticación
- **Layout:** Dos columnas en escritorio (formulario | imagen campus), una columna en móvil
- **Overlay:** Gradiente semitransparente sobre la foto del campus
- **Inputs:** `focus:border-[#9333EA] focus:ring-[#C026D3]/20`
- **Links legales:** `text-[#9333EA] underline underline-offset-2 hover:text-[#C026D3]`
- **Headings:** `text-[#9333EA]` (violeta)

### Carrera y Facultades disponibles

**Facultad de Negocios:** Administración y Negocios Digitales, Business Analytics

**Facultad de Computación:** Ciberseguridad, Ciencia de Datos e IA, Ciencia de la Computación, Sistemas de Información

**Facultad de Ingeniería:** Bioingeniería, Ambiental, Civil, Energía, Electrónica, Industrial, Mecatrónica, Mecánica, Química

### Disponibilidad (opciones de onboarding)
| ID | Label | Horas/semana |
|---|---|---|
| 0 | ☕ Poco tiempo | 1–3 hrs |
| 1 | ⚖️ Moderado | 4–6 hrs |
| 2 | ⚡ Disponible | 7–10 hrs |
| 3 | 🚀 Muy flexible | 11–15 hrs |
| 4 | 🌟 Máxima disponibilidad | 15+ hrs |

---

## 10. Convenciones de Código

### Constantes de marca centralizadas
Todas las clases Tailwind relacionadas con la marca se importan desde:
```ts
import { TW_UTOPP_GRADIENT_BR, TW_UTOPP_GRADIENT_R, TW_UTOPP_GRADIENT_TEXT } from '../shared/constants/brand'
```
**Nunca** escribir los colores de marca (`#2f55f6`, `#ba4ef8`) directamente en componentes sin antes buscar si existe una constante.

### `no-scrollbar`
Clase utilitaria definida en `index.css` para ocultar barras de scroll en carruseles y sidebars sin afectar la funcionalidad de scroll.

### `SyntheticBadge`
Siempre usar `<SyntheticBadge />` en widgets o secciones con datos hardcodeados (no reales de la API) para diferenciarlo visualmente del equipo.

### Componentes de motion
- Preferir `motion.div` sobre wrappers extra innecesarios
- Siempre usar `AnimatePresence` cuando el componente pueda desmontarse
- Las transiciones de `layout` (pestañas, tabs) usan `layoutId` compartido

---

## 11. Dependencias de Diseño

| Librería | Versión | Uso |
|---|---|---|
| `tailwindcss` | Config estándar | Sistema de estilos |
| `framer-motion` | Instalada | Animaciones declarativas |
| `lucide-react` | Instalada | Iconografía consistente |
| `@radix-ui/react-slot` | Instalada | Composición en `Button` |
| `class-variance-authority` | Instalada | Variantes de componentes |
| `react-router-dom` | Instalada | Enrutamiento SPA |

---

*Última actualización: Mayo 2026 — Generado automáticamente desde análisis de código fuente.*
