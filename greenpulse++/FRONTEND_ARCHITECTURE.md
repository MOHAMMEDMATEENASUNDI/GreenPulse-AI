# GreenPulse AI — Master Frontend Architecture Document

**Track 03 — Sustainability & Green Technologies**
**Companion Document to:** PRD v1.0, SSD v1.0, UI/UX Architecture v1.0, Design System v1.0
**Target Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4, Framer Motion 12, React Three Fiber / Drei, Recharts / Chart.js, Lucide Icons, Firestore Client SDK.
**Target Hardware:** Mid-range laptop (Integrated GPU, 8GB RAM, 4-core CPU).

---

## 1. Frontend Vision
GreenPulse AI's frontend architecture is engineered to deliver an enterprise-grade, high-performance, real-time operating system experience for enterprise carbon intelligence. The visual language blends spatial depth (Wormhole, 3D rotating Earth, Aurora Weave) with dense operational instrumentation (Green Score, Live AI Feed, Carbon/Energy/ESG metrics).

The architecture prioritizes:
- **Instant visual feedback**: Perceived zero-latency data interactions with optimistic updates and shimmer loading states.
- **Strict performance budgeting**: Hard limits on GPU memory, WebGL scenes, frame rates, and DOM element counts to guarantee 60 FPS on mid-range laptops.
- **Architectural modularity**: Strict separation of concerns adhering to Atomic Design, feature-based modules, domain boundary interfaces, and clean state distribution.
- **Hackathon-to-Production trajectory**: A clean codebase scaffold that allows rapid 24-hour hackathon execution without technical debt that would prevent scaling to enterprise pilots.

---

## 2. Architecture Principles

1. **Feature-First Domain Isolation**: Code is organized around business capabilities (`features/carbon`, `features/esg`, `features/energy`) rather than technical file types (`components`, `containers`, `reducers`).
2. **Single WebGL & GPU Boundary**: Exactly one WebGL canvas canvas is mounted in the DOM at any time. 3D scenes are completely unmounted when routing away from the landing page.
3. **Decoupled Data Ingestion & State Engine**: Data ingestion (CSV parsing, schema validation) is decoupled from rendering through web workers and background async streaming via Firestore `onSnapshot`.
4. **Declarative Motion & Token Consistency**: Animations rely exclusively on system motion tokens defined in Framer Motion configurations (`motion.ease.entrance`, `motion.duration.base`). No ad-hoc animation physics or inline transition strings.
5. **Progressive Enhancement & Fail-Safe Fallbacks**: If WebGL, Web Workers, or network sockets fail, the application gracefully degrades to static SVG canvas visuals, main-thread parsing, and periodic HTTP polling without breaking core functionality.
6. **Accessibility by Default**: High contrast ratios (WCAG 2.1 AA), dual visual encoding (color + icon + text), keyboard traps prevention, and native OS `prefers-reduced-motion` integration.

---

## 3. Complete Folder Structure

```
/src
├── app/                        # Application core setup & shell
│   ├── providers/              # Global React Context providers (Query, Auth, Theme, Motion)
│   ├── routes/                 # Router declarations, lazy route definitions, guard wrappers
│   ├── App.tsx                 # Root application entry component
│   └── main.tsx                # DOM mount & polyfill setup
├── assets/                     # Static media & textures
│   ├── textures/               # 3D Earth textures (diffuse, bump - WebP/KTX2)
│   ├── icons/                  # Custom domain SVGs (Lucide extension)
│   └── branding/               # Logo marks, favicon variants
├── components/                 # Shared UI component library (Atomic Design)
│   ├── ui/                     # Atoms & simple molecules (Button, Input, Badge, GlassPanel)
│   ├── feedback/               # Loaders, skeletons, toast containers, error boundaries
│   ├── layout/                 # Shell, Header, Sidebar, TopNav, GridSystem, Container
│   └── motion/                 # Motion wrappers (WormholeContainer, AuroraBackground, FadeIn)
├── config/                     # Environment, API, & feature flags configuration
│   ├── constants.ts            # Fixed system limits (max glass blur, upload sizes)
│   ├── env.ts                  # Type-safe environment variable parser
│   └── theme.ts                # Tailwind design token mappings
├── features/                   # Feature-based domain modules
│   ├── landing/                # Public landing page, Wormhole, 3D Earth, Hero
│   ├── onboarding/             # Company setup wizard, target config, file dropzone
│   ├── dashboard/              # Main mission control, summary strip, score gauge
│   ├── carbon/                 # Carbon footprint tracker, Scope 1/2/3 breakdown, flow diagram
│   ├── energy/                 # Energy monitor, hourly heatmap, anomaly detector
│   ├── esg/                    # ESG compliance engine, BRSR/GRI gap checklist, report wizard
│   ├── waste/                  # Waste stream analytics, reduction opportunity map
│   ├── copilot/                # AI Copilot chat drawer, prompt suggestions, citation cards
│   ├── reports/                # Audit-ready PDF previewer, history log, versioning
│   └── settings/               # Department config, user roles, integration settings
├── hooks/                      # Global cross-cutting React hooks
│   ├── use-auth.ts             # Auth session state hook
│   ├── use-device-caps.ts      # Hardware detection (GPU, CPU, battery, bandwidth)
│   ├── use-firestore-stream.ts # Real-time Firestore sync hook
│   ├── use-media-query.ts      # Responsive breakpoint observer
│   └── use-reduced-motion.ts   # OS motion preference observer
├── lib/                        # Core utilities, API clients, math engines
│   ├── api-client.ts           # Fetch wrapper with interceptors & error mapping
│   ├── csv-parser.ts           # Web-worker backed CSV parsing helper
│   ├── firestore.ts            # Firebase app initialization & listener helpers
│   ├── metrics-calculator.ts   # Client-side deterministic fallback math
│   └── utils.ts                # Tailwind cn() utility & formatting functions
├── styles/                     # Global styles & token imports
│   └── index.css               # Tailwind CSS imports & custom utility layers
└── types/                      # Global TypeScript definitions
    ├── api.ts                  # Backend API request/response payloads
    ├── domain.ts               # Core entity types (Company, Metric, Report, Anomaly)
    ├── enums.ts                # System enumerations (ScopeType, RecommendationStatus)
    └── theme.ts                # Design system token interfaces
```

---

## 4. Routing Architecture

GreenPulse AI uses a declarative, client-side React Router architecture powered by lazy-loaded dynamic imports (`React.lazy`).

### Router Configuration Pattern:
- **Root Layout (`/`)**: Evaluates auth status, mounts global notifications and theme providers.
- **Public Routes (`/`, `/demo`, `/login`, `/signup`)**: Accessible without credentials. Loading landing components asynchronously.
- **Protected App Routes (`/app/*`)**: Wrapped in `<ProtectedRoute>` guard. Renders the persistent `<DashboardShell>`.
- **Onboarding Route (`/onboarding`)**: Isolated layout preventing navigation away until setup completes.

### Dynamic Import Boundaries:
- `LandingPage`: Lazy loaded (`Chunk: landing`)
- `DashboardHome`: Lazy loaded (`Chunk: dashboard`)
- `CarbonView`: Lazy loaded (`Chunk: carbon`)
- `EnergyView`: Lazy loaded (`Chunk: energy`)
- `ESGView`: Lazy loaded (`Chunk: esg`)
- `WasteView`: Lazy loaded (`Chunk: waste`)
- `ReportsView`: Lazy loaded (`Chunk: reports`)

---

## 5. Layout Architecture

The application layout is structured around a non-remounting, persistent layout shell (`DashboardShell`) for authenticated routes, eliminating unnecessary DOM node recreations during page navigation.

```
+-----------------------------------------------------------------------------------+
| Top Navigation Bar (56px) [Logo | Green Score Badge | Search | Notifications | Profile] |
+------------------+------------------------------------------------+---------------+
| Left Rail Nav    | Main Workspace Area (Fluid Canvas)              | Live AI Feed  |
| (240px / 64px)   |                                                | (320px Drawer)|
|                  |  +------------------------------------------+  |               |
|  - Dashboard     |  | Summary Metric Strip (4 Columns)          |  |  - Timestamp  |
|  - Carbon        |  +------------------------------------------+  |  - Anomaly    |
|  - Energy        |  | Primary Interactive Chart / Map / Gauge   |  |  - AI Action  |
|  - ESG           |  +------------------------------------------+  |  - Report Log |
|  - Waste         |  | Detail Data Table / Breakdown            |  |               |
|  - Copilot       |  +------------------------------------------+  |               |
|  - Reports       |  | Floating AI Recommendation Cards          |  |               |
|  - Settings      |  +------------------------------------------+  |               |
+------------------+------------------------------------------------+---------------+
```

---

## 6. Component Architecture

Components follow strict single-responsibility guidelines:
- **Pure Presentational Components**: Receive data via typed props, render UI elements, emit callbacks. Zero direct side effects or API calls.
- **Container / Smart Components**: Connect presentational UI with domain custom hooks, query subscriptions, and state managers.
- **Compound Components**: Used for complex multi-part components like `<DataUploadZone>`, `<CopilotChatWindow>`, and `<ReportWizard>`.

---

## 7. Atomic Design Mapping

| Atomic Level | GreenPulse AI Component Examples | Structural Characteristics |
|---|---|---|
| **Atoms** | `Button`, `Badge`, `Input`, `ScoreGaugeArc`, `GlassPanel`, `StatNumber` | Primitive HTML wrappers, fully styled via Tailwind design tokens. |
| **Molecules** | `MetricCard`, `FeedItem`, `RecommendationCard`, `NavItem`, `ScoreBadge` | Composition of 2-4 atoms. Handles micro-interactions and internal hover states. |
| **Organisms** | `SummaryStrip`, `LiveFeedPanel`, `TrendChart`, `ComplianceChecklist`, `DataUploadZone` | Complex UI blocks with isolated data binding and sub-state logic. |
| **Templates** | `DashboardShell`, `OnboardingShell`, `PublicPageLayout` | Grid/Flex skeleton wrappers defining layout slots and drawer boundaries. |
| **Pages** | `DashboardPage`, `CarbonPage`, `ESGPage`, `EnergyPage` | Top-level route containers binding page params to queries and templates. |

---

## 8. State Management Strategy

To ensure optimal performance and avoid monolithic state trees, state is segregated into four distinct layers:

1. **Server / Cache State (TanStack Query / SWR Pattern)**:
   - Manages API data fetching, asynchronous mutation statuses, background refetching, and response caching.
   - Cache keys follow hierarchical tuples: `['emissions', companyId, scope, dateRange]`.
2. **Real-Time Stream State (Firestore Engine)**:
   - Synchronizes live event items into the `LiveFeedPanel` via `onSnapshot`.
   - Stores raw incoming events in a lightweight ring-buffer (max 50 events) in memory.
3. **Global Client State (Zustand Store)**:
   - Holds persistent UI states: user active session, sidebar collapsed state (`isSidebarCollapsed`), active active theme (`dark` | `light`), active company context.
4. **Local Component State (React `useState` / `useReducer`)**:
   - Manages UI ephemeral states: form field values, modal visibility, hover tooltips, dropzone file selection.

---

## 9. API Integration Layer

The API integration layer acts as a typed bridge between the React frontend and the FastAPI backend gateway.

### Architectural Blueprint:
- **HTTP Client**: Customized native `fetch` client with request/response interceptors.
- **Header Injection**: Automatically injects JWT Bearer tokens and active `X-Company-ID` headers.
- **Response Schema Verification**: Enforces contract shape through TypeScript type assertions.
- **Error Interception**: Standardizes HTTP error codes (401, 403, 422, 500) into typed domain errors (`ApiError`).

---

## 10. Authentication Flow (Frontend)

1. **Credentials Submission**: User submits login/signup details on `/login` or `/signup`.
2. **Token Reception**: Backend returns JWT Access Token (short-lived, 15m) and Refresh Token (HTTP-Only Secure Cookie).
3. **Session Store**: JWT Access Token stored in memory (Zustand Session Slice), never in `localStorage` (XSS protection).
4. **User Context Hydration**: Client fetches user profile and permissions payload via `/auth/me`.
5. **Route Redirection**: Router updates state and transitions user to `/app/dashboard` or `/onboarding`.
6. **Token Silent Refresh**: Background timer initiates token refresh 2 minutes prior to expiration via `/auth/refresh`.

---

## 11. Protected Routes

Access to restricted routes is enforced via a structural `<ProtectedRoute>` wrapper component.

```
Incoming Request -> Is Authenticated? 
  |-- No  --> Redirect to /login with returnUrl parameter
  +-- Yes --> Is Onboarding Completed?
                |-- No  --> Redirect to /onboarding
                +-- Yes --> Has Required Role (Admin/Facility/Auditor)?
                              |-- No  --> Render 403 Access Denied View
                              +-- Yes --> Render Target Route Component
```

---

## 12. Data Fetching & Caching Strategy

- **Stale-While-Revalidate (SWR)**: Render cached data instantly, refetch in background.
- **Optimistic UI Updates**: Actioning AI recommendations updates local state instantly; rolls back automatically if server mutation fails.
- **Polling Fallback**: If Firestore WebSocket connection drops, system gracefully falls back to REST polling every 10 seconds.
- **Deduplication**: Simultaneous identical component query mounts execute a single network request.

---

## 13. Error Handling

A multi-tiered error resilience pattern prevents application crashes and preserves user data:

1. **Global React Error Boundary**: Catches unhandled render errors, logging diagnostic telemetry and presenting a friendly fallback UI with a "Reload Workspace" action.
2. **Feature-Level Error Boundaries**: Isolates failures within specific widgets (e.g., if `<TrendChart>` crashes, only the chart displays an error card while the rest of the dashboard remains operational).
3. **API Mutation Error Interception**: Displays actionable toast notifications with explicit fix instructions for user-correctable errors.

---

## 14. Loading Strategy

To eliminate jarring layout shifts (CLS), GreenPulse AI enforces a strict skeleton loading pattern:

- **Skeleton Mirroring**: Skeleton components match the precise CSS layout, border radius, and dimensions of resolved components.
- **Unified Shimmer Animation**: All skeletons share a synchronized left-to-right linear CSS gradient sweep (`1.5s` cycle).
- **Progressive Data Hydration**: High-priority text and hero metrics render first, followed by heavy chart visualizations.

---

## 15. Form Architecture

Forms (Onboarding, Company Settings, Target Configuration) use React Hook Form integrated with Zod schema validation:

- **Type Safety**: Automatic type inference from Zod schemas to form fields.
- **Validation Timing**: Validates fields `onBlur` to avoid annoying users while typing.
- **Field Micro-Feedback**: Error messages render directly beneath input controls with icon prefixes and clear correction guidance.

---

## 16. Dashboard Architecture

The Mission Control Dashboard serves as the central operational hub:

```
+-----------------------------------------------------------------------------------+
| Green Score Hero Gauge (0-100)  |  Carbon Status  |  Energy Usage  |  BRSR ESG    |
+-----------------------------------------------------------------------------------+
| Historical Footprint Trend Line / Stacked Area Chart (Recharts)                   |
+-----------------------------------------------------------------------------------+
| Live Anomaly Heatmap Grid        |  Department Breakdown Table                     |
+-----------------------------------------------------------------------------------+
| AI Recommendation Queue (Interactive Floating Cards with Instant Approval)        |
+-----------------------------------------------------------------------------------+
```

---

## 17. Landing Page Architecture

The landing experience is built for narrative impact and immediate user acquisition:

- **Wormhole Sequence**: Framer Motion container playing an entry transition, saving state in `sessionStorage`.
- **3D Earth Canvas**: Low-poly interactive Three.js sphere with custom WebP atmospheric texture and aurora lighting.
- **Interactive Product Sandbox**: Live embedded demonstration component allowing prospective users to test the interface prior to signup.

---

## 18. AI Copilot Frontend Flow

The AI Copilot drawer enables natural language intelligence querying over company ESG data:

1. **Drawer Activation**: User clicks floating action button or shortcut (`Cmd+K`).
2. **Suggested Prompt Chips**: Surfaces contextually relevant prompts ("Why did Floor 3 spike?").
3. **User Query Submission**: Messages stream to backend proxy API `/api/copilot/chat`.
4. **Streaming Response Handling**: Reads Server-Sent Events (SSE) stream, rendering token by token.
5. **Interactive Data Citations**: Formats inline citations as clickable pills that highlight relevant dashboard components.

---

## 19. Carbon Dashboard Components

- `ScopeToggleSegment`: Segmented control switching between Scope 1, 2, 3, and Total views.
- `CarbonFlowNetwork`: SVG animated node system visualizing carbon transfer between departments.
- `EmissionsTable`: Tabular view of monthly CO₂e output with CSV export functionality.

---

## 20. ESG Dashboard Components

- `BRSRGaugeArc`: Semi-circular progress gauge indicating compliance percentage against SEBI BRSR standards.
- `GapAnalysisChecklist`: Collapsible list of mandatory disclosure items highlighting missing inputs.
- `ReportGeneratorWizard`: Step-by-step modal configuring custom PDF report parameters.

---

## 21. Green Score Components

- `GreenScoreHero`: Large format display widget featuring animated numeric count-up and circular gradient arc.
- `GreenScoreBadge`: Compact version of the score gauge rendered persistently in the top navigation bar.
- `ScoreFactorBreakdown`: Radar/bar chart breaking down the sub-weights contributing to the score.

---

## 22. Report Components

- `PdfPreviewCanvas`: Rendered document preview allowing inline inspection prior to downloading.
- `ReportHistoryTable`: Historical log of all generated compliance PDFs with timestamped audit hashes.
- `ReportShareModal`: Generates time-restricted, read-only external auditor verification links.

---

## 23. File Upload Architecture

- **Drag-and-Drop Zone**: Custom dropzone built on HTML5 Drag and Drop API with visual state feedback.
- **In-Browser Schema Preview**: Parses CSV headers locally using PapaParse prior to upload transmission.
- **Worker-Based Validation**: Offloads large file validation routines to a Web Worker to preserve main thread smoothness.

---

## 24. Chart Architecture

- **Primary Library**: Recharts (built on SVG) for optimal responsive scaling and crisp text rendering.
- **Theme Binding**: Chart axes, gridlines, and series colors bind directly to CSS custom properties.
- **Numeral Standard**: All numeric labels render in JetBrains Mono tabular figures to prevent jitter.

---

## 25. 3D Architecture (React Three Fiber)

- **Canvas Isolation**: Rendered inside a single isolated `<Canvas>` component mounted only on the landing page.
- **Asset Optimization**: Low-poly Earth mesh (≤5,000 polygons) with a single 512x512 WebP diffuse map.
- **Render Loop Control**: Uses `frameloop="demand"` or pauses animation when out of the viewport via `IntersectionObserver`.

---

## 26. Framer Motion Architecture

- **Global Config**: `<MotionConfig reducedMotion="user">` wraps the application root.
- **Variants Pattern**: Component animations utilize centralized variants dictionaries rather than inline style objects.
- **Layout Animations**: Shared layout transitions (`layoutId`) enable smooth morphing between elements.

---

## 27. Animation Strategy

- **Micro-interactions**: 100ms - 150ms for button clicks, toggles, and hover state shifts.
- **Content Transitions**: 250ms - 350ms with `cubic-bezier(0.16, 1, 0.3, 1)` easing.
- **GPU Compositing**: Animates strictly `transform` and `opacity` to avoid costly paint/layout cycles.

---

## 28. Responsive Strategy

- **Mobile First Tailwind Breakpoints**: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px).
- **Fluid Layout Containers**: `w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Drawer Adaptability**: Right-side Live AI Feed shifts from persistent sidebar to overlay drawer on viewports < 1024px.

---

## 29. Accessibility Strategy

- **Contrast Ratios**: Strictly maintains minimum 4.5:1 for normal text and 3:1 for large text / UI boundaries.
- **Focus Management**: Focus rings utilize a high-visibility 2px custom outline.
- **Screen Reader Support**: ARIA live regions (`aria-live="polite"`) broadcast real-time incoming AI feed events.

---

## 30. Performance Optimization Strategy

- **FPS Target**: Constant 60 FPS on mid-range hardware.
- **Glassmorphism Limit**: Maximum 4 concurrent `backdrop-filter: blur()` surfaces on screen.
- **Memory Management**: Explicit disposal of Three.js geometries, materials, and textures on component unmount.

---

## 31. Lazy Loading Strategy

- Component-level code splitting using `React.lazy()` and `<Suspense>`.
- Route-based chunk separation preventing unused module execution.
- Image assets utilize native `loading="lazy"` and responsive `srcset`.

---

## 32. Code Splitting Strategy

Vite build configuration configured with custom chunking rules:
- `vendor-react`: `react`, `react-dom`, `react-router-dom`
- `vendor-three`: `three`, `@react-three/fiber`, `@react-three/drei`
- `vendor-charts`: `recharts`, `chart.js`
- `vendor-motion`: `framer-motion`

---

## 33. Image & Asset Optimization

- Raster images converted to WebP and AVIF formats with 80% quality compression.
- SVGs optimized via SVGO to strip unnecessary metadata and comments.
- Iconography consolidated into `lucide-react` tree-shakable imports.

---

## 34. Theme Management

Theme management is driven by Tailwind CSS v4 variables:
- **Dark Theme (Default)**: Deep space navy background (`#0A0E14`), dark surface (`#12161F`).
- **Light Theme (Audit/Print)**: Clean neutral background (`#F7F8FA`), white surface (`#FFFFFF`).
- **System Preference Sync**: Automatically respects user OS preference with manual override toggle.

---

## 35. Design System Integration

- Clean token system adhering strictly to the GreenPulse AI Design System v1.0 specification.
- Usage of signature "Aurora Weave" gradient reserved strictly for high-impact surfaces.
- Mandatory use of monospaced JetBrains Mono for numeric metrics and tabular data.

---

## 36. Security Best Practices (Frontend)

- **XSS Prevention**: React automatically escapes strings inserted into JSX. No raw `dangerouslySetInnerHTML`.
- **Token Security**: Tokens stored in memory; sensitive credentials never placed in `localStorage`.
- **Content Security Policy (CSP)**: Strict directives governing script, style, and WebSocket connection endpoints.

---

## 37. Testing Strategy

- **Unit Testing (Vitest)**: Testing utility functions, math engines, and custom React hooks.
- **Component Testing (Testing Library)**: Verifying presentational component rendering and user interactions.
- **E2E Testing (Playwright)**: Automated testing of critical user flows (Login -> Upload CSV -> Generate BRSR Report).

---

## 38. Build & Deployment Strategy

- **Build Tooling**: Vite 6 with TypeScript type checking (`tsc --noEmit`).
- **Production Asset Output**: Single bundled application artifacts stored in `dist/`.
- **Target Hosting**: Cloud Run / Containerized Nginx web server configured for SPA fallback routing.

---

## 39. Frontend Development Milestones

- **Milestone 1 (Hours 0-4)**: Base repository setup, router configuration, Tailwind tokens, design system primitives.
- **Milestone 2 (Hours 4-10)**: Landing page, 3D Earth integration, Wormhole transition sequence.
- **Milestone 3 (Hours 10-16)**: Dashboard shell, summary strip, Green Score gauge, Recharts integration.
- **Milestone 4 (Hours 16-20)**: Data upload dropzone, CSV worker parsing, real-time Firestore feed listener.
- **Milestone 5 (Hours 20-24)**: ESG compliance report generator, PDF export, final performance tuning, bug fixing.

---

## 40. Engineering Best Practices

- **Strict TypeScript Mode**: `noImplicitAny`, `strictNullChecks`, `noUnusedLocals` enabled.
- **Clean Imports**: Enforce absolute module paths using `@/` aliases.
- **Linting & Formatting**: ESLint and Prettier integrated into pre-commit hooks.
- **Zero Raw Magic Numbers**: All dimensions, timeouts, and thresholds imported from centralized config files.

---

## 41. Professional Enhancements

| Feature | Rationale | UX Impact | Complexity | Hackathon / Post-Hackathon |
|---|---|---|---|---|
| **Web Worker In-Browser CSV Parsing & Validation** | Prevents UI freezing when parsing 50,000+ line energy usage files. | High: Upload feel remains instant and smooth. | Medium | Hackathon |
| **Offline-First PWA Data Cache** | Allows plant managers in poor connectivity facilities to inspect metrics offline. | High: Zero downtime in low-signal industrial environments. | Medium | Post-Hackathon |
| **Canvas WebGL Fallback Detector** | Detects low-spec GPUs and automatically replaces 3D Earth with a high-res CSS sphere. | Critical: Prevents low-end laptops from crashing during judging. | Low | Hackathon |
| **Automated PDF Layout Engine (Web Worker)** | Renders audit-ready BRSR compliance PDFs in a background worker thread. | High: User can continue working while 30-page PDF renders. | High | Post-Hackathon |
| **Command Palette (`Cmd + K`) Nav** | Enables instant keyboard navigation to any department or metric view. | High: Accelerates power-user navigation for auditors and CFOs. | Low | Hackathon |
