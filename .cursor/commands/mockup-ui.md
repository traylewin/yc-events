---
description: Generate a self-contained HTML UX mockup for a project or feature
argument-hint: <description of the UI to mockup>
allowed-tools: [Write]
---

# Mockup UI

Generate a **single, self-contained HTML file** UX mockup based on the user's description.

## User's Request

$ARGUMENTS

## Output

Write the mockup to `mockup-ui.html` in the current working directory.

## Instructions

Build a polished, interactive HTML mockup. **Every rule below applies by default unless the user's request explicitly overrides it.**

---

### Core Requirements

- **Single file** — all HTML, CSS, and JS in one `.html` file.
- Load Tailwind via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Load **Inter** font via Google Fonts: `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`
- Apply Inter globally: `font-family: 'Inter', system-ui, -apple-system, sans-serif` with `antialiased` font smoothing.
- Add a `tailwind.config` block to extend the theme with the design system tokens below.
- **Fully responsive** — use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`).
- **Realistic placeholder content** — real-looking names, emails, numbers, data. Never "Lorem ipsum" or "Item 1".
- **Interactive** — all sidebar toggling, popovers, tab switching, and view toggling work with vanilla JS. No `onclick=""` attributes; attach all listeners in `DOMContentLoaded`.
- **Icons over emoji** — always use inline SVG icons (e.g. Lucide-style paths) instead of emoji/emoticons. Icons should be rendered as `<svg>` elements with consistent sizing (`w-4 h-4` or `w-5 h-5`), `stroke="currentColor"`, `stroke-width="2"`, `fill="none"`, and `stroke-linecap="round"` / `stroke-linejoin="round"`. Never use emoji characters (📌, ✕, ☰, ✨, etc.) in the UI.

---

### Design System Defaults

#### Typography Scale

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page hero title | 3xl (mobile), 5xl (tablet), 6xl (desktop) | Bold (700) | Context-dependent |
| Page subtitle / tagline | lg (mobile), xl (tablet), 2xl (desktop) | Normal (400) | `gray-600` |
| Section / card title | xl | Semibold (600) | `gray-900` |
| Body text / descriptions | base | Normal (400) | `gray-600` |
| Header bar title | base | Semibold (600) | `gray-900` |
| Timestamps, metadata | xs | Normal (400) | `gray-500` |
| Sidebar section names | sm | Medium (500) | Default |
| Badge / label text | xs | Medium (500) | Varies by context |
| Modal title | lg | Semibold (600) | `gray-900` |
| Modal body text | sm | Normal (400) | `gray-600` |

#### Color Palette

**Core neutrals** — the app should be predominantly black, white, and gray. Use color sparingly and purposefully.

| Token | Tailwind | Usage |
|-------|----------|-------|
| Primary action | `black` / `gray-900` | Primary buttons, spinners, focus rings |
| Background | `white` | Page backgrounds, cards, modals |
| Text Primary | `gray-900` | Headings, titles |
| Text Secondary | `gray-600` | Body text, descriptions |
| Text Tertiary | `gray-500` | Timestamps, placeholders, hints |
| Text Muted | `gray-400` | Counts, secondary metadata |
| Border | `gray-200` | Dividers, card borders, toolbar borders |
| Surface Hover | `gray-100` | Button hover states, interactive rows |
| Surface Light | `gray-50` | Backgrounds for info cards, hover states |

**Accent colors** — choose ONE warm accent (default: orange/amber) for branding, and ONE cool accent (default: violet/indigo) for interactive features. Override only if context demands it.

| Role | Default Palette | Usage |
|------|----------------|-------|
| Brand / landing | `orange-50` → `amber-50` (gradient), `orange-600` → `amber-600` | Landing page backgrounds, logo, CTA highlights |
| Feature accent | `violet-600` / `indigo-600` | Active states, feature highlights, accent buttons |
| Success | `green-50` bg, `green-200` border, `green-700` text | Confirmations, copy feedback |
| Error | `red-50` bg, `red-200` border, `red-700` text | Error toasts, destructive states |
| Warning / private | `yellow-100` bg, `yellow-700` text | Privacy indicators, caution states |
| Info | `blue-50` bg, `blue-200` border, `blue-800` text | Informational badges, drag targets |

#### Spacing

Follow Tailwind's 4px base unit. Key recurring values:

- **Tight:** `gap-1` (4px), `gap-2` (8px) — between icon buttons, inline elements
- **Standard:** `gap-3` (12px), `gap-4` (16px) — between grouped elements
- **Section padding:** `p-4` (16px) for sidebar sections, `p-6` (24px) for modal padding
- **Page padding:** `px-4` (mobile) → `px-6` (sm) → `px-8` (lg)
- **Vertical rhythm:** `mb-4` between form fields, `mb-6` / `mb-8` between sections

#### Border Radius

| Token | Tailwind | Usage |
|-------|----------|-------|
| Subtle | `rounded` (4px) | Small badges, inline toggles |
| Standard | `rounded-lg` (8px) | Buttons, inputs, cards, controls |
| Large | `rounded-2xl` (16px) | Modals, floating toolbars, hero elements, landing page cards |
| Full | `rounded-full` | Avatars, dots, color swatches, pill badges |

#### Shadows

| Token | Tailwind | Usage |
|-------|----------|-------|
| Subtle | `shadow-sm` | Small controls, inputs |
| Standard | `shadow-lg` | Floating toolbars, dropdowns, toasts |
| Elevated | `shadow-xl` | Modals, popovers |
| Hero | `shadow-2xl` | Landing page hero elements, featured images |

#### Z-Index Layers

| Layer | Z-Index | Elements |
|-------|---------|----------|
| Backdrop | `z-40` | Sidebar mobile overlay backdrop |
| Overlay | `z-50` | Sidebar, floating toolbar, toasts |
| Modal | `z-[60]` | Modals, confirmation dialogs |

#### Transitions & Animations

| Animation | CSS | Usage |
|-----------|-----|-------|
| Color transition | `transition-colors` | All interactive elements (buttons, links, hover states) |
| Layout shift | `transition-all duration-300` | Sidebar margin offset, panel expand/collapse |
| Slide in/out | `transition-transform duration-300 ease-in-out` | Sidebar open/close, drawer panels |
| Loading spinner | `animate-spin` | Processing states, page loading |

---

### Interaction Patterns

#### Button States

| State | Visual |
|-------|--------|
| Default | Background transparent or white |
| Hover | `bg-gray-100` (standard), or contextual color (e.g. `bg-violet-50`) |
| Active/Selected | Solid background (`bg-gray-100`, accent bg) |
| Disabled | `opacity-50 cursor-not-allowed` |
| Focus | `focus:ring-2 focus:ring-black` (forms), accent ring for feature inputs |

#### Primary Actions

Black background with white text:
- `bg-black text-white rounded-lg hover:bg-gray-800 transition-colors`
- `disabled:opacity-50 disabled:cursor-not-allowed`

#### Secondary Actions

Bordered style:
- `border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`

#### Destructive Actions

Appear on hover with red tint:
- `hover:bg-red-100 rounded`, icon `text-red-600`

#### Copy-to-Clipboard Feedback

1. Icon changes to checkmark
2. Background turns `bg-green-100`, icon `text-green-600`
3. Reverts after 2 seconds

#### Toast Notifications

**Position:** Fixed, centered horizontally, `bottom-24`, above any floating toolbar.

- **Error:** `bg-red-50 border border-red-200 rounded-lg px-4 py-3 shadow-lg`, text `text-red-800`
- **Success:** `bg-green-50 border border-green-200 rounded-lg px-4 py-3 shadow-lg`, text `text-green-800`
- Auto-dismiss after 5 seconds

#### Modal Pattern

All modals share:
- **Backdrop:** `fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4`
- **Container:** `bg-white rounded-2xl shadow-xl max-w-md w-full p-6`
- **Header:** Flex row with title (`text-lg font-semibold`) and close button (`p-1 hover:bg-gray-100 rounded`)
- Clicking backdrop closes the modal

---

### Default App Layout (Shell A)

Use this layout unless the request is clearly a public/marketing page:

```
+--[Options Sidebar]-------+---[Main Content]------------------+
|  Options      [pin] [x]  |  [Header Bar]          [Avatar]   |
|                           |                                   |
|  [Option Groups /         |  [Page Content]                   |
|   Nav Links]              |                                   |
|                           |                                   |
|  ───────────────────────  |                                   |
|  [Desktop] [Mobile]       |                                   |
+---------------------------+-----------------------------------+
```

**Options Sidebar (left, fixed width ~240–320px):**
- Default: open on desktop (`lg:`), closed (off-canvas) on mobile.
- Header row: label on left; SVG **pin** icon and SVG **X/close** icon on right.
- **Pin behavior**: pinned → docked, pushes content right; unpinned → overlays content.
- **Auto-close**: when not pinned, clicking outside closes it.
- **Mobile backdrop:** `fixed inset-0 bg-black/20 z-40 md:hidden`
- **Desktop / Mobile view toggle** at the bottom (see spec below).

**Shell B — Public/Marketing Page:**
If the prompt is clearly a landing page, skip the sidebar and use a top nav with mobile hamburger instead. Use the brand gradient (e.g. `from-orange-50 via-white to-amber-50`) as the page background.

---

### Navigation Sidebar (when prompt requests one)

If the user's request mentions a sidebar for navigation:

- Triggered by an SVG **menu/hamburger** icon (three horizontal lines) in the header bar.
- Slides in from left as a drawer.
- Drawer header: app name/logo on left; SVG **pin** icon and SVG **X/close** icon on right.
- **Pin behavior**: pinning docks and shifts content; unpinning returns to overlay.
- **Auto-close**: when not pinned, clicking outside closes it.
- On mobile the drawer always overlays.

---

### Header Bar

Rendered at the top of the main content area:

- **Left**: SVG menu icon (if sidebar) → page title or breadcrumb.
- **Right**: contextual action icons → auth avatar (if applicable).
- Bottom border: `border-b border-gray-200`
- Padding: `px-3 py-2` or `px-4 py-3`
- **Auth avatar** — include only if the prompt mentions login/auth/user:
  - Circular avatar showing user initials, top-right.
  - Click → dropdown popover with: larger avatar, name, email, "Sign out" button.
  - Click outside closes the popover.

---

### Desktop / Mobile View Toggle

Place at the bottom of the Options sidebar (or as a floating pill if no sidebar):

- Two segmented buttons: **Desktop** and **Mobile**.
- **Desktop mode** (default): full-width normal layout.
- **Mobile mode**: main content shrinks to **393px wide**, centered, wrapped in an iPhone 16 Pro frame (393×852pt):
  - Rounded rectangle with 48px corner radius and subtle bezel shadow.
  - Pill-shaped Dynamic Island (120×34px) at top center.
  - Home indicator bar at bottom center.
  - Content scrolls independently inside the frame.

---

### Floating Toolbar (Excalidraw-style)

If the request mentions a **toolbar** or **tool palette**:

**Position:** Horizontally centered, fixed at `bottom: 24px`.

**Visual design:**
- Pill-shaped: `bg-white border border-gray-200 rounded-2xl shadow-lg px-4 py-3`
- Compact icon buttons (~40×40px) with tight horizontal padding.
- Thin vertical dividers (`w-px h-6 bg-gray-200`) to group related tools.
- **Active tool**: filled accent background + white icon.
- **Hover**: light accent tint background.
- All icons as inline SVG — no emoji, no external icon library.

**Behavior:**
- Clicking sets active tool (toggle active class).
- Zoom buttons update a displayed zoom-level label.
- Never scrolls or wraps.

---

### Design Principles

1. **Content-first** — maximize space for primary content. Headers are compact. Toolbars float over content rather than consuming layout space.
2. **Progressive disclosure** — secondary actions appear on hover. Panels are collapsed by default. Sidebar is closed on mobile.
3. **Consistent feedback** — every action has visual feedback: copy confirmations, processing spinners, error toasts, hover highlights.
4. **Minimal color** — predominantly black, white, and gray. Color is used sparingly and purposefully: one warm accent for branding, one cool accent for features, semantic colors for status.
5. **Responsive by default** — all layouts adapt from mobile (320px+) to desktop. Sidebar transitions from overlay (mobile) to pinned push (desktop). Typography and spacing scale at `sm`, `md`, and `lg` breakpoints.

---

### After Writing the File

Tell the user:
> "Mockup written to `mockup-ui.html`. Open it in a browser to preview."

Do **not** print the HTML source in chat.
