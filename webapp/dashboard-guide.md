# Dashboard Snippet (Apps Script Ready)

This snippet bundles the dashboard layout, styling tokens, component states, and example markup into a single HTML include for Apps Script or other templating systems.

## What this delivers
- Self-contained grid layout, KPI cards, tables, buttons, forms, badges, toasts, and loading overlays.
- Brand variables for colors, spacing, radii, and shadows to keep cross-section consistency.
- Accessible defaults: focus styles, aria labels, and clear disabled/loading states for user feedback.

## Installation / use
1. **Include in your index**
   - Copy `webapp/dashboard.html` into your Apps Script project.
   - In `index.html`, insert `<?!= include('dashboard'); ?>` (or your templating equivalent) where you want the dashboard to render.
2. **Load fonts (optional)**
   - The snippet uses the `Inter` font with system fallbacks. To ensure exact matching, add:
     ```html
     <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" />
     ```
3. **Attach data**
   - Replace the sample KPI values, table rows, and form options with live data in your Apps Script templates or client-side script.
   - Toggle the `.loading-overlay` visibility (remove or add it) while awaiting server responses.
4. **Hook up actions**
   - Bind buttons (`Refresh Data`, `New Request`, `Submit`) to your Apps Script functions via `google.script.run` or fetch calls.
   - Update toast contents dynamically to show success/warning/error outcomes.

## Expectations and presets
- **Color tokens**: If other sections rely on different palettes, keep the `:root` variables aligned or map them through your global theme before including this snippet.
- **Spacing + radii**: The layout uses the shared spacing scale (`--space-*`) and radius sizes; keep these consistent to avoid visual drift across pages.
- **ARIA labeling**: Sections and controls include `aria-label`/`role` values; maintain them when modifying markup to preserve accessibility.
- **Loading/disabled states**: Use the existing `.spinner` classes and `disabled` attributes during async operations to avoid double submissions.

## Making it production-ready
- **Minify for delivery** if you inline into Apps Script: reduce whitespace or use HTMLService minification to optimize payload size.
- **Cache static assets** (fonts, icons) through CDN links or Apps Script `HtmlService.createHtmlOutputFromFile` caching patterns.
- **Lint templates** with your preferred HTML formatter to keep diffs readable and enforce accessibility checks.
- **Local testing**: render `dashboard.html` in a browser (double-click or host locally) to confirm spacing and responsiveness before deploying.
