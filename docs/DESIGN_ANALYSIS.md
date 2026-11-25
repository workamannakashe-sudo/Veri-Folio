# VeriFolio Design Analysis: Reference UI Translation

## 1. Executive Summary & Source of Truth
This document details the visual and structural dissection of the reference UI (`docs/design/reference/dashboard-reference.png`).
The goal is to translate this design into a modular, production-ready design system (`packages/ui` and tokens) and migrate every page across VeriFolio to match its look and feel:
- **Style identity**: Soft periwinkle/lavender backdrop, charcoal pill shell, crisp rounded white content sheet, high-contrast expressive bento cards (lavender hero, peach KPI tiles, orange pill-chart analytics card, dark feature card).
- **Brand integrity**: Original VeriFolio branding, educational icons, avatar initials and badges, authentic student portfolio data.
- **Strict constraints**: WCAG 2.1 AA accessible contrast ratios, mobile-first responsiveness (360px to 1920px), zero hardcoded colors outside design tokens, zero changes to business logic or cryptographic seals.

---

## 2. Spatial & Layout Anatomy

| Element | Measured Value | Implementation Token | Notes |
| :--- | :--- | :--- | :--- |
| **Page Backdrop** | Linear gradient: `#B9B5F9` to `#9D98F2` | `--bg-backdrop` | Soft periwinkle backdrop visible on viewports $\ge 1280\text{px}$. |
| **App Shell Frame** | Charcoal `#191A23` / `#2A2D33` | `--bg-frame` | Radius `48px` (`--r-frame`), dark outer housing. |
| **Top Navigation Bar** | Height $\approx 80\text{--}88\text{px}$, centered pill nav | `--h-topbar` | Left brand mark, center floating pill nav, right user profile + status. |
| **Content Sheet** | Pure White `#FFFFFF` | `--bg-sheet` | Radius `40px` (`--r-2xl`), inner padding `24px`. |
| **Bento Grid Columns** | 3 columns on desktop ($\ge 1280\text{px}$) | CSS Grid `grid-cols-12` | Left col (3.2 cols), Center col (5.3 cols), Right col (3.5 cols). |
| **Card Gap** | `20px` / `24px` | `--s-5`, `--s-6` | Consistent flex/grid gaps throughout. |

---

## 3. Pixel-Level Color Palette & Contrast Validation

### 3.1 Color Palette
- **Brand Purples / Periwinkle**:
  - `purple-50`: `#F1F0FE` (tinted card surfaces)
  - `purple-100`: `#E3E1FB`
  - `purple-200`: `#CFCBF8`
  - `purple-300`: `#B5B0F4` (focus rings & accents)
  - `purple-500`: `#8F8AF0`
  - `purple-600`: `#7E7AE6` (hero card background)
  - `purple-700`: `#625CCB`
  - `purple-900`: `#2F2B73`
- **Accents (Orange / Peach / Yellow)**:
  - `orange-50`: `#FFF4EC`
  - `orange-100`: `#FDE3D0`
  - `orange-200`: `#FFA172` (accent analytics card)
  - `orange-500`: `#F99B5C`
  - `orange-600`: `#EC8442`
  - `brown-700`: `#5C3B2B` (dark pill bar elements)
  - `yellow-400`: `#FEF3C7` (highlight badges)
- **Neutrals**:
  - `ink-950`: `#0E0F11` (primary text)
  - `ink-900`: `#191A23` (dark card fill)
  - `charcoal-800`: `#2A2D33` (frame fill)
  - `gray-500`: `#6B6F76` (secondary text)
  - `gray-200`: `#E7E8EB` (dividers and borders)
  - `gray-100`: `#F4F5FB` (neutral chip fill)
  - `white`: `#FFFFFF`

### 3.2 WCAG 2.1 AA Contrast Strategy
1. **Orange / Yellow Surfaces**:
   - `orange-200` (`#FFA172`) with White text has a contrast ratio of $\sim 2.2:1$ (FAILS).
   - *Rule*: On orange and yellow cards, typography is strictly `ink-900` (`#191A23`), achieving **$\ge 7.8:1$ (AAA)**.
2. **Hero Purple Card**:
   - `purple-600` (`#7E7AE6`) with White text achieves **$4.6:1$ (AA Pass)** for large headings, with high-contrast text on accents.
3. **Pill Chart Value Indicators**:
   - Value tags over dark brown capsules (`#3A241A`) use pure white text $\ge 11:1$ (AAA).

---

## 4. Signature Component Anatomy & Spec

1. **Hero/Promo Card**:
   - Fill: `purple-600` (`#7E7AE6`).
   - Title: Bold display typography with orange highlight word.
   - Action: Circular dark button with ring accent (`CircleArrowButton`).
   - Decorative: Subtle SVG backdrop curve / trophy badge.
2. **KPI Tile**:
   - Fill: Light peach (`#FFF4EC`) or lavender (`#F1F0FE`), with tinted 2px border.
   - Corner tab: Rounded square badge holding an icon at top-left.
   - Typography: Label in secondary gray (`13px`), value in large bold tabular numerals (`40px`).
3. **Filter Chips**:
   - Full pill radius (`9999px`), light gray fill (`#F4F5FB`), icon tile + label.
4. **Feature Card (Dark and Lavender variants)**:
   - Fill: Dark `#191A23` or soft lavender `#E3E1FB`.
   - Header: Small icon badge (top-left) + square rounded external link button (top-right).
   - Eyebrow: Uppercase orange tracking label.
   - Footer: Overlapped avatar stack with `+X` counter, circular arrow CTA bottom-right.
5. **Accent Analytics Card (Orange Bento Centerpiece)**:
   - Fill: Rich peach/orange (`#FFA172`).
   - Header: Bar chart icon badge + segmented pill toggle (`Weekly` | `Month`).
   - Metrics: Big numbers (`48 lessons`, `12 hours`) with subtle divider.
   - Capsule Bar Chart: Vertical pill bars (Mon to Fri), numeric badges on top, Wednesday with diagonal hatch stripe pattern.
6. **Ranking Strip**:
   - Full-radius pill container (`#F4F5FB`), round gold medal icon, title + subtitle, overlapped avatar stack on right.
7. **Week Strip**:
   - 5 tall pill columns: day acronym (Mon-Fri), bold date number (20-24), status indicator dot/icon (green/red).
8. **App Frame & TopBar**:
   - Desktop: Charcoal curved container (`radius: 48px`), centered pill navigation containing icon + label for active item.
   - Mobile: Fluid full-bleed adaptation, bottom navigation bar with 4 quick links + more modal.

---

## 5. Density Modes & Page Adaptation
- **Expressive Mode**: Used on Student & Mentor Dashboards, Home Overview, and Check page. Features full-size bento cards, generous padding (`20-24px`), large radii (`32-40px`), and animated pill charts.
- **Compact Mode**: Used for Admin Rosters, Data Tables, Entry Forms, and Audit Ledgers. Same color palette and typography, but radius reduced to `16-24px`, padding `12-16px`, and compact table rows (`44px` height).
