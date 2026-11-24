# VeriFolio Design System (Glassmorphism v2)

## Visual Concept
Deep navy-to-indigo mesh with three soft colour glows drifting slowly; frosted panels floating above it; cyan and violet accents; calm and professional. Glass is used sparingly (nav, modals, sheets, floating cards). Anything holding body text sits on a more opaque panel to maintain WCAG AA 4.5:1 contrast.

## Design Tokens

| Token | Dark value | Light value |
|---|---|---|
| Background | linear-gradient(135deg,#0B1030,#1B1650 55%,#0E2A4A) | linear-gradient(135deg,#EEF2FF,#E0F2FE 55%,#F5F3FF) |
| Glass surface | rgba(255,255,255,.08), blur 16px, saturate 140%, border rgba(255,255,255,.18) | rgba(255,255,255,.65), same blur, border rgba(15,23,42,.12) |
| Text panel | rgba(14,18,40,.72) | rgba(255,255,255,.88) |
| Text / muted | #F4F6FF / #B6BCD6 | #0F172A / #475569 |
| Accents | cyan #5EEAD4, violet #A78BFA | cyan #0E7490, violet #6D28D9 |
| Verified | #34D399 | #047857 |
| Changed / Revoked | #F87171 | #B91C1C |
| Pending | #FBBF24 | #92400E |
| Unverified | #94A3B8 | #475569 |

### Typography
- Headings: Space Grotesk 600
- Body: Inter 400/500, base 16px, line height 1.55

### Motion & Performance
- Orbs: built from pre-blurred `radial-gradient` layers on `position: fixed` elements and animate only `transform` (`40s ease-in-out`). No large `filter: blur()` on moving elements. On phones, drop to two orbs.
- Cards lift 4px on hover.
- Seal badge draws in over 600ms.
- All animations disabled under `prefers-reduced-motion: reduce`.
- `prefers-reduced-transparency: reduce` swaps glass for solid panel color.
- Focus ring: 2px cyan focus ring; 44px minimum touch targets.

## Reference CSS Tokens (`apps/web/styles/tokens.css`)

```css
:root {
  --bg1: #0B1030;
  --bg2: #1B1650;
  --bg3: #0E2A4A;
  --glass: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.18);
  --panel: rgba(14, 18, 40, 0.72);
  --text: #F4F6FF;
  --muted: #B6BCD6;
  --cyan: #5EEAD4;
  --violet: #A78BFA;
  --ok: #34D399;
  --bad: #F87171;
  --warn: #FBBF24;
  --slate: #94A3B8;
  --radius: 20px;
  --blur: 16px;
}

:root[data-theme="light"] {
  --bg1: #EEF2FF;
  --bg2: #E0F2FE;
  --bg3: #F5F3FF;
  --glass: rgba(255, 255, 255, 0.65);
  --glass-border: rgba(15, 23, 42, 0.12);
  --panel: rgba(255, 255, 255, 0.88);
  --text: #0F172A;
  --muted: #475569;
  --cyan: #0E7490;
  --violet: #6D28D9;
  --ok: #047857;
  --bad: #B91C1C;
  --warn: #92400E;
  --slate: #475569;
}

.glass {
  background: var(--panel); /* opaque fallback */
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

@supports (backdrop-filter: blur(1px)) {
  .glass {
    background: var(--glass);
    -webkit-backdrop-filter: blur(var(--blur)) saturate(140%);
    backdrop-filter: blur(var(--blur)) saturate(140%);
  }
  .glass-panel {
    background: var(--panel);
    -webkit-backdrop-filter: blur(var(--blur));
    backdrop-filter: blur(var(--blur));
  }
}

@media (prefers-reduced-transparency: reduce) {
  .glass,
  .glass-panel {
    background: var(--panel);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .orb {
    animation: none;
  }
}
```

## Component Inventory
- `GlassCard`
- `GlassNav` (sidebar on desktop, bottom tab bar on mobile)
- `StatusBadge` (with icon and text label)
- `SkillChip` (level dots, source icon)
- `LevelPicker` (with 3-line rubric tooltip: Beginner, Intermediate, Advanced)
- `EvidenceTile`
- `Timeline`
- `SealBadge` (animated shield, green/red/slate)
- `BottomSheet`
- `Stepper`
- `DataTable`
- `EmptyState`
- `Toast`
- `Skeleton`
