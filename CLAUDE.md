# Figma MCP and Frontend Integration Rules

Use this guide when translating a Figma design into this repository or updating a design in Figma from the codebase. It describes the repository as of 2026-10-01 (after the Tico e Tica palette and the Figma dashboard landed). Verify the referenced source before assuming a convention has not changed.

## Project Boundaries

There are three separate frontend projects. They do not share a package workspace or a compiled component/token package.

| Surface | Entry point | Stack and role |
| --- | --- | --- |
| Production web app | [frontend/web/App.jsx](frontend/web/App.jsx) | React 18, Vite 4, Tailwind CSS 3, React Router, Redux Toolkit. Desktop-first inventory and administration UI with responsive mobile navigation. |
| Production mobile app | [frontend/mobile/App.js](frontend/mobile/App.js) | React Native 0.73, Metro, React Navigation, React Native Paper, Redux Toolkit. Operational phone app with native screens and offline/sync behavior. |
| Brand/design source | Figma Make file `DfF6IkIpgNuP0Aso5c0z45` ("Logo and Design System", https://www.figma.com/make/DfF6IkIpgNuP0Aso5c0z45/Logo-and-Design-System). A local export may sit in `Logo and Design System/` at the repo root; it is **not versioned** | Separate React 19, TypeScript, Vite 8, Tailwind CSS 4 Figma Make project: a standalone dashboard prototype and the logo/palette source. Not a component library imported by either production app. |

Figma access: the Figma MCP server is declared in [.mcp.json](.mcp.json) (it asks for a Figma login on first use). For a Make file, `get_design_context` returns the file's source resource links; if they cannot be opened, work from the local export.

Do not copy a prototype wholesale into production. First determine the target surface and map its layout, tokens, assets, interactions, loading/error/empty states, and responsive behavior to that surface's existing patterns. A Figma Make preview or generated design is a reference, not proof that dependencies or components exist in the production apps.

## Figma MCP Workflow

### Figma design to code

1. When a Figma URL or node is provided, identify the file key and node ID, then read the design-to-code skill before requesting design context. Treat returned code and screenshots as reference material to adapt, not as code to paste unchanged.
2. Inspect the relevant files in this guide and reuse components, tokens, and assets from the *target app*. Avoid changing a second frontend surface unless the request includes it.
3. Compare Figma variables and styles with the target's local tokens. Translate semantic roles (page background, surface, primary action, warning) rather than mapping colors by visual similarity alone. Keep web and native platform values in their respective token systems.
4. Prefer existing components and app navigation. Preserve business behavior, permissions, API/state integration, accessibility labels, and loading/error states when replacing visual structure.
5. Implement the smallest coherent slice, then validate the target app's build/lint/test and inspect the design at desktop and narrow/mobile widths where applicable. Check reduced-motion behavior for animated work.

### Code to Figma

Before creating or updating a design in Figma, search the target Figma library for existing components, variables, and styles. Capture the implemented page as a reference when a pixel-accurate comparison is needed, then assemble using the matching library assets instead of recreating primitives. Do not create or update Figma files based on this repository guide alone when the target file/library is unspecified.

### Keep design sources distinct

- The planning guide contains an earlier purple/gold palette. It is historical/product-planning context, not the palette implemented in the production web and mobile source.
- The production web and mobile apps use the **Tico e Tica** palette from the Figma Make file: brand green `#239e4b` (primary) and brand pink `#dd6383` (secondary) on a soft green-grey canvas, with a derived dark theme (the Figma file only has the light one). The earlier cream/charcoal/dusty-rose palette is gone; do not reintroduce it.
- The Figma Make project itself uses Google Fonts and Tailwind 4; production keeps DM Sans / Playfair Display / DM Mono (self-hosted) and Tailwind 3. Palette and logo were adopted, the prototype code was not.
- The Figma Make runtime/configuration is not the same thing as the Figma MCP server or the production web build.

## Design Tokens

### Production web

The web palette is split between CSS custom properties in [frontend/web/src/App.css](frontend/web/src/App.css) and Tailwind extensions in [frontend/web/tailwind.config.js](frontend/web/tailwind.config.js). CSS variables own theme-responsive surfaces/text/borders; Tailwind owns utility names and several fixed colors.

```css
:root {
  --color-brand-bg: #f7f9f7;
  --color-surface: #ffffff;
  --color-ink: #17201b;
  --color-muted: #6f7872;
  --color-muted-light: #8b938e;
  --color-border: #e7ebe8;
}
```

Tailwind maps semantic utility names, including `primary` (green `#239e4b`, `dark` `#147a37`, `50` `#eaf7ee`), `secondary` (pink `#dd6383`, `dark` `#ba4566`), `surface`, `ink`, `muted`, `border`, `brand-bg`, `danger`, `success`, and `warning`. `primary` and `secondary` are fixed in both themes. Example usage: `bg-surface text-ink border-border`. Status badges on the pages use fixed pastel pairs (success `#eaf7ee`/`#147a37`, warning `#fdf0d9`/`#8a5a12`, neutral `#eceeed`/`#5f6762`, danger `#fbe3e1`/`#a13f3f`, pink `#fbeef2`/`#ba4566`).

The `:root.dark` block in `App.css` defines dark surfaces and text. Tailwind uses `darkMode: 'class'`; the app's theme provider is [frontend/web/src/contexts/ThemeContext.jsx](frontend/web/src/contexts/ThemeContext.jsx). Keep token changes aligned between CSS custom properties and Tailwind config.

### Production mobile

[frontend/mobile/src/theme/colors.js](frontend/mobile/src/theme/colors.js) exports `lightColors`, `darkColors`, `fonts`, and `tabularNums` as JavaScript objects. The light set mirrors the web palette (green `primary`, pink `secondary`, green screen headers); the dark set lifts the green so it holds on dark surfaces and flips `primaryLight` to a dark ink so text on `primary` stays readable. Components access the selected colors through `useTheme()` and `useThemedStyles()` from `ThemeContext.js`. The root app adapts those values into React Native Paper MD3 and React Navigation themes in [frontend/mobile/App.js](frontend/mobile/App.js).

```js
export const fonts = {
  display: 'PlayfairDisplay-SemiBold',
  displayRegular: 'PlayfairDisplay-Medium',
  sans: 'DMSans-Regular',
  sansMedium: 'DMSans-Medium',
  sansBold: 'DMSans-Bold',
  mono: 'DMMono-Medium',
};

export const tabularNums = { fontVariant: ['tabular-nums'] };
```

Use `useTheme()` for one-off themed values and `useThemedStyles(createStyles)` with module-level `StyleSheet.create` factories for themed style blocks. Apply `tabularNums` to SKUs, EANs, quantities, and other aligned numeric columns.

### Standalone Figma Make project

The Make file's `src/index.css` defines CSS custom properties such as `--brand-green`, `--brand-pink`, `--ink`, `--line`, and `--canvas`; the page uses regular CSS and Tailwind 4 utilities. Production maps these *semantic roles* onto its own tokens (above); it does not import the prototype's CSS.

### Token format and transformation

There is no observed canonical JSON token file, Style Dictionary/Tokens Studio export, code generation, or build-time token transformation. Tokens are manually maintained in CSS, Tailwind configuration, and React Native JavaScript. Spacing, radii, shadows, and many typography sizes are mostly local utility values or component `StyleSheet` values rather than a shared cross-platform scale. If a design change affects both production clients, update and verify each local representation; do not imply that Figma variables automatically synchronize with the code.

## Components and Organization

### Web app

- Route-level screens live under `frontend/web/src/pages/`.
- Shared shell and UI components live under `frontend/web/src/components/`.
- Data fetching hooks, API services, Redux store/slices, contexts, and utilities live in their corresponding `hooks/`, `services/`, `store/`, `contexts/`, and `utils/` directories.
- `frontend/web/App.jsx` owns route composition and lazy-loads most pages with `React.lazy`/`Suspense`.
- Styling is chiefly Tailwind utility classes in JSX with global and animation rules in `src/App.css`; there are no CSS Modules or styled-components in the inspected app.

Example of the current component/style pattern:

```jsx
<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
  <article className="rounded-xl border border-border bg-surface p-5 text-ink">
    ...
  </article>
</section>
```

### Mobile app

- Navigable screens live under `frontend/mobile/src/screens/` and are registered in `src/navigation/AppNavigator.js`.
- Reusable UI lives under `src/components/`; data hooks, API/sync services, Redux state, theme, and domain helpers live in their respective directories.
- Use React Native primitives, `StyleSheet`, React Native Paper, navigation, and the app's theme context. This is not a web DOM or Tailwind surface.
- Preserve safe-area handling, touch/accessibility semantics, navigation behavior, and offline/sync feedback when adapting a Figma screen.

### Design prototype and documentation

The Make file's `src/App.tsx` contains a single dashboard implementation and a local typed SVG `Icon` component. It is not an exported shared component package. The web dashboard ([frontend/web/src/pages/DashboardPage.jsx](frontend/web/src/pages/DashboardPage.jsx)) follows that design with real data: greeting and period select, four metric cards, recent-products table, the Movimentações chart ([MovimentacoesChart.jsx](frontend/web/src/components/MovimentacoesChart.jsx)) and an attention card; [TopBar.jsx](frontend/web/src/components/TopBar.jsx) is the Figma top bar. Figma values with no data source (e.g. "Giro de estoque") were replaced by data the API has. No Storybook package/config or story files were found. The Figma Make Vite config has a story glob for its plugin, but that alone does not mean a Storybook or documented component catalog exists. `FRONTEND_PLANNING_GUIDE.md` documents product flows and earlier design intent; it is not a component API reference.

## Frameworks, Styling, and Build

| Project | UI / styling | Build and key scripts |
| --- | --- | --- |
| `frontend/web` | React 18, React Router 6, Tailwind 3, global CSS; Redux Toolkit and Recharts are also dependencies. | Vite 4. `npm run dev`, `npm run build`, `npm run lint`, `npm test`. |
| `frontend/mobile` | React Native 0.73, React Native Paper, `StyleSheet`, React Navigation 6, Reanimated. | Metro / React Native CLI. `npm start`, `npm run android`, `npm run ios`, `npm run lint`, `npm test`. |
| `Logo and Design System` (local export, not versioned) | React 19 + TypeScript, Tailwind CSS 4 via `@tailwindcss/vite`, global CSS variables. | Vite 8. `npm run dev`, `npm run build`, `npm run preview`, `npm run format`. |

Web responsive behavior combines Tailwind breakpoints (`sm`, `md`, `lg`, `xl`) with explicit CSS media queries in `App.css` at 1080px, 700px, and 430px. The shell changes from sidebar to mobile navigation; tables and forms also change their layout. React Native uses flex layouts, dimensions, safe-area insets, and component-level layout logic instead of CSS breakpoints. Match the intended Figma viewport without breaking these existing transitions.

## Assets and Delivery

- Mobile raster assets are bundled from `frontend/mobile/src/assets/` using static `require()` calls. Login backgrounds are `.webp` frames (light `login-bg-{a,b,c}` and dark `login-bg-dark-{a,b,c}`) generated by `frontend/mobile/scripts/generate-login-background.py`; the script writes lossless WebP and `LoginBackground.js` picks the set by theme. Android launcher icons are under `frontend/mobile/android/app/src/main/res/mipmap-*`.
- Mobile custom font files are bundled under `frontend/mobile/android/app/src/main/assets/fonts/`. Check platform font registration before introducing a font on iOS; do not assume Android font files alone cover both platforms.
- The logo is `logo-tico-e-tica.png` (cropped to its alpha bounds, 480 px wide): `frontend/web/public/` serves it (plus `favicon.png`) and `frontend/mobile/src/assets/` bundles it for the login screen. The launcher icon is a green/pink diagonal split with the logo on a white card (adaptive icon in `mipmap-anydpi-v26` plus legacy PNGs).
- The production web app imports DM Sans, Playfair Display, and DM Mono through `@fontsource` packages in `frontend/web/src/main.jsx`, so those fonts ship with the app rather than requiring a Google Fonts request.
- The web app has `frontend/web/public/` (logo, favicon) but no `src/assets/`, image CDN, or asset transformation pipeline. Vite provides normal bundling/build optimization; do not invent a CDN URL or remote asset convention.
- The Figma Make Vite config supports an optional deployment base path through `FIGMA_PUBLIC_URL`. This applies to that separate project, not automatically to `frontend/web`.

When Figma supplies raster/vector assets, place them in the target app's appropriate asset location and follow that platform's import convention. Prefer optimized, appropriately sized images; avoid embedding large base64 data in JSX or linking unapproved external URLs.

## Icon System

- **Production mobile:** use `MaterialCommunityIcons` from `react-native-vector-icons/MaterialCommunityIcons`, with the library's icon-name strings. Existing imports appear in components such as `frontend/mobile/src/components/BottomTabBar.js`.
- **Production web:** JSX uses Material Design Icons class names such as `mdi mdi-package-variant-closed`; `Sidebar.jsx` maps semantic menu keys to icon-name strings in an `ICONS` object. There is **no icon font**: [frontend/web/src/mdi-subset.css](frontend/web/src/mdi-subset.css) (imported in `main.jsx`) is a generated CSS-mask subset containing only the icons the app uses. After using a new `mdi mdi-<name>` (or `icon="<name>"` prop), run `python scripts/gen-mdi-subset.py` in `frontend/web`, or the icon renders empty. Icons inherit `color` and `font-size`.
- **Figma Make prototype:** `src/App.tsx` implements a small local `IconName` union and inline SVG path map. This is prototype-local and is not a shared production icon system.

There is no single cross-platform icon package or common icon naming adapter. When translating icons, map to the target platform's existing system and preserve button labels/accessibility names. Do not bring the prototype's inline SVG map into React Native.

## Figma Integration Checklist

- Confirm the target: web app, native mobile app, or Figma Make prototype.
- Read the Figma node/context and identify relevant library components, variables, styles, typography, assets, and responsive variants.
- Resolve visual conflicts against the target app's live token source, not the older planning palette or a neighboring prototype.
- Reuse the target app's shell, navigation, component patterns, data/state layer, and platform-native interactions.
- Preserve numeric tabular figures, semantic/accessibility labels, safe areas, reduced motion, and loading/error/empty states where relevant.
- Check any SVG/image/font delivery and icon dependencies instead of assuming they are configured (web icons need `scripts/gen-mdi-subset.py`).
- Validate the touched app's build/lint/test command and inspect at least the Figma's primary viewport plus a narrow viewport for web layouts.
- Keep prototype-only additions in the Figma Make file unless the task explicitly requests production adoption.

## Reference Files

- Earlier product and visual planning: [FRONTEND_PLANNING_GUIDE.md](FRONTEND_PLANNING_GUIDE.md)
- Production web theme and utilities: [frontend/web/src/App.css](frontend/web/src/App.css), [frontend/web/tailwind.config.js](frontend/web/tailwind.config.js)
- Production mobile theme: [frontend/mobile/src/theme/colors.js](frontend/mobile/src/theme/colors.js), [frontend/mobile/src/theme/ThemeContext.js](frontend/mobile/src/theme/ThemeContext.js)
- Web icon subset and its generator: [frontend/web/src/mdi-subset.css](frontend/web/src/mdi-subset.css), [frontend/web/scripts/gen-mdi-subset.py](frontend/web/scripts/gen-mdi-subset.py)
- Web dashboard (Figma-based): [frontend/web/src/pages/DashboardPage.jsx](frontend/web/src/pages/DashboardPage.jsx)
- Figma MCP server config: [.mcp.json](.mcp.json)