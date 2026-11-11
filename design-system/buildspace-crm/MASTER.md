# BUILDSPACE CRM

Design system for the five-unit renovation workspace. Generated direction comes from ui-ux-pro-max (`renovation operations CRM dashboard kanban productivity`, variance 5, motion 3, density 7). Typography is overridden because Plus Jakarta Sans does not cover Thai.

## Style

Flat, light, typography-led. No heavy shadows. Hover is a color shift of 150–200ms. Respect `prefers-reduced-motion`.

## Color

| Role | Hex | Use |
| --- | --- | --- |
| Brand | `#1D4ED8` | Links, focus, primary buttons. White text passes on this blue. |
| Background | `#F8FAFC` | Page |
| Foreground | `#0F172A` | Body text |
| Card | `#FFFFFF` | Panels |
| Muted text | `#475569` | Secondary copy on white |
| Sidebar | `#0F172A` | Navigation, slate-200/300 labels |

Unit identity (white text on the solid chip, dark text on the tint):

| Unit | Solid | Tint |
| --- | --- | --- |
| งานออกแบบ | `#4338CA` | indigo-50 |
| งานก่อสร้าง | `#C2410C` | orange-50 |
| งานขาย | `#047857` | emerald-50 |
| งานบริการหลังการขาย | `#0F766E` | teal-50 |
| สต็อกวัสดุและจัดซื้อ | `#6D28D9` | violet-50 |

Color is never the only status signal. Late and blocked states also use text.

## Typography

IBM Plex Sans Thai (Thai + Latin), weights 400–700, applied once on `body` via `next/font`.

## Interaction

- Touch targets at least 44px on primary controls.
- Visible `:focus-visible` ring.
- Kanban columns scroll sideways on small screens and keep an empty message when a column has no houses.
- Icons are Lucide, decorative ones are `aria-hidden`.
