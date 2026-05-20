

## Plan: Upgrade to CONAFSync Premium Design

The user shared a significantly improved design reference. Here are the key changes to implement across all components:

### 1. Sidebar (`Sidebar.tsx`) — Dark slate-900 theme
- Dark background (`bg-slate-900`) instead of white
- Brand: "CONAF**Sync**" with emerald icon badge and "Motor Automático" subtitle
- Nav items with `shadow-[inset_4px_0_0_0_#34d399]` active indicator instead of green dot
- Renamed labels: "Resumen Ejecutivo", "Procesador SIGFE", "Análisis Histórico"
- User avatar with emerald gradient circle, Settings icon, "René H." instead of "Amparo Donoso"
- Remove office selector dropdown (not in new design)

### 2. Header (in `Index.tsx`)
- Add search bar with rounded-full input and Search icon
- Add Bell notification icon with red dot badge
- Period badge with pulsing green dot indicator
- Subtitle "Gestión Presupuestaria Consolidada" under view title
- Backdrop blur (`bg-white/90 backdrop-blur-md`)

### 3. Dashboard (`Dashboard.tsx`)
- KPI cards with decorative circle bg element (`absolute -right-6 -top-6 w-24 h-24 rounded-full`), hover shadow transition
- Larger text (3xl), colored icon badges per card (blue, emerald, indigo, amber)
- Progress bars: taller (h-3), with border, different colors per program (emerald, blue, amber, red)
- "Ver matriz completa" link button
- Alerts: left color bar indicator (`w-1.5 bg-red-500`), shadow-sm, refined text sizing
- Remove pie/donut chart and bar chart from dashboard — replace with progress bars + alerts only

### 4. Upload (`UploadView.tsx`)
- Animated progress bar with striped gradient pattern instead of step list
- Percentage display during processing
- Custom SVG spinner with FileSpreadsheet icon overlay
- "Importar Datos" button (dark slate-900) instead of green
- "¡Consolidación Exitosa!" with inline stat badge
- "Ver Cuadro Consolidado" with ChevronRight icon

### 5. Balance Table (`BalanceTable.tsx`) — Accordion rows
- Replace flat table with expandable accordion rows (parent program → sub-items: ByS + Viáticos)
- ChevronDown/Right toggle icons in bordered boxes
- Simplified columns: Programa, Presupuesto Vigente, Compromiso, Saldo, % Avance
- Sub-rows with dot bullet, indented, lighter styling
- Tab bar with `shadow-inner` pill style
- Export button dark (`bg-slate-900`) with emerald Download icon

### 6. Histórico (`HistoricoView.tsx`)
- Replace line chart with ComposedChart: Bar (presupuesto as grey bg bars) + Line (ejecución as emerald line)
- Full year data (Jan–Nov) instead of 5 months
- Taller chart (450px), cleaner tooltips with shadow
- Remove summary cards — single chart card only

### 7. Data updates (`budgetData.ts`)
- Add full-year `historyData` array (Jan–Nov with presupuesto=1924 constant, ejecución growing)
- Add per-office balance data structure with nested items for accordion

### 8. Styling (`index.css`)
- No major changes needed, existing tokens work

### Files modified
- `src/components/conaf/Sidebar.tsx` — dark theme, new branding
- `src/components/conaf/Dashboard.tsx` — redesigned KPIs, progress bars, alerts
- `src/components/conaf/UploadView.tsx` — progress bar animation, new styling
- `src/components/conaf/BalanceTable.tsx` — accordion rows with expandable sub-items
- `src/components/conaf/HistoricoView.tsx` — ComposedChart (bar+line)
- `src/pages/Index.tsx` — header with search, bell, backdrop blur
- `src/data/budgetData.ts` — full-year history data, per-office nested balance data

