---
name: Functional Precision
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#424753'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#727785'
  outline-variant: '#c2c6d5'
  surface-tint: '#005bbf'
  primary: '#004ea6'
  on-primary: '#ffffff'
  primary-container: '#0b66d2'
  on-primary-container: '#e3eaff'
  inverse-primary: '#acc7ff'
  secondary: '#006e06'
  on-secondary: '#ffffff'
  secondary-container: '#7ffe6e'
  on-secondary-container: '#007507'
  tertiary: '#813f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#a65200'
  on-tertiary-container: '#ffe5d6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#acc7ff'
  on-primary-fixed: '#001a40'
  on-primary-fixed-variant: '#004492'
  secondary-fixed: '#7ffe6e'
  secondary-fixed-dim: '#63e055'
  on-secondary-fixed: '#002201'
  on-secondary-fixed-variant: '#005303'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311300'
  on-tertiary-fixed-variant: '#723600'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  surface-alt: '#F5F5F5'
  text-primary: '#1A1A1A'
  text-secondary: '#757575'
  border: '#E0E0E0'
  danger: '#D32F2F'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-default:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
---

## Brand & Style
The design system is anchored in the principles of **Uber-Minimalism** and **Institutional Trust**. It is designed for high-stakes environments where clarity, speed of cognition, and functional reliability are paramount. The aesthetic deliberately avoids the "consumer-tech" look—eschewing blurs, gradients, and decorative shadows in favor of a flat, architectural UI.

The emotional response should be one of "calm authority." By utilizing a strict 8px grid and a restrained color palette, the interface stays out of the user's way, ensuring that critical data and actions remain the sole focus. The style is strictly flat, using high-contrast borders and solid fills to define structure.

## Colors
This design system utilizes a high-contrast, utility-first color palette. 

- **Primary (#0B66D2):** Used for primary actions, branding, and active states. It represents authority and stability.
- **Secondary (#1FA51E):** Reserved for "Action Green" success states, positive confirmations, and "Dispatch" triggers.
- **Surface & Neutrals:** The foundation is built on `#FAFAFA`, providing a crisp, paper-like background. Borders use a strict `#E0E0E0` to define containment without adding visual weight.
- **Functional Colors:** Danger (#D32F2F) and Warning (#F57C00) are utilized sparingly but with high saturation to ensure immediate detection of anomalies.

Avoid any use of color for purely decorative purposes. Every hue must signal a specific state or hierarchy.

## Typography
The system uses **Inter** (as the closest high-quality match to the requested system-ui stack) to provide a neutral, systematic, and utilitarian feel. 

Typography is treated as a functional tool. Headings use semi-bold weights with slight negative letter-spacing for a dense, professional appearance. Body text favors legibility and generous line heights to prevent cognitive fatigue during long-form data review. 

All interactive labels and button text use a medium weight (`500`) to differentiate them from static body content.

## Layout & Spacing
The layout is governed by a **fixed-column grid** on desktop (12 columns) and a **fluid grid** on mobile (4 columns). 

- **Spacing Rhythm:** All dimensions, padding, and margins must be increments of the 8px base unit. 
- **Internal Padding:** Small components (inputs/chips) use `sm` (8px). Larger containers (cards/modals) use `md` (16px) or `lg` (24px).
- **Responsive Behavior:** On desktop, the container maintains a maximum width to ensure line lengths remain readable. On mobile, margins reduce to 16px to maximize screen real estate.

## Elevation & Depth
This design system rejects the concept of "physical" depth in favor of **Tonal Layering** and **Flat Borders**. 

1.  **Strict Flatness:** Most surfaces sit on the same Z-plane. Depth is communicated via background color shifts (e.g., `#FAFAFA` to `#F5F5F5`).
2.  **Minimal Elevation:** A singular, low-intensity shadow is permitted only for floating elements like Cards or Modals to provide a subtle "lift" from the background: `0 1px 3px rgba(0,0,0,0.12)`.
3.  **Outlines:** Instead of shadows, use 1px solid borders (`#E0E0E0`) to define the boundaries of UI elements. 
4.  **Focus States:** Depth is also indicated through "active" borders. When a field is focused, it receives a 2px solid Primary border, creating a visual "pop" without using shadows.

## Shapes
The shape language is "Soft" yet disciplined. While the UI is minimalist and professional, 4px corner radii are used on standard components to prevent the interface from appearing overly aggressive or "dated-brutalist."

- **Standard Radius:** 4px for buttons, input fields, and small cards.
- **Large Radius:** 8px for larger containers like modals or dialogue boxes.
- **No Pill Shapes:** Avoid fully rounded/pill-shaped buttons to maintain the rigid, professional structure of the system.

## Components

- **Buttons:** Solid fills with no gradients. The primary button uses `#0B66D2` with white text. Hover states must be a direct 10% darkening of the base color. Secondary buttons use a 1px border of the primary color with no fill.
- **Cards:** White background with a 1px solid border (#E0E0E0). Use the minimal "Elevation 1" shadow only if cards are placed on top of other content.
- **Input Fields:** Outlined style. The border is `#E0E0E0` in rest state, changing to a 2px solid `#0B66D2` on focus. Labels should be small, medium-weight text positioned directly above the field.
- **Badges/Chips:** Strictly flat. Use a light tinted background with high-contrast text (e.g., Success: Light Green background with `#1FA51E` text). No rounded pill shapes—use the standard 4px radius.
- **Lists:** Clean rows separated by 1px dividers (`#E0E0E0`). Use `md` (16px) vertical padding for high touch targets and professional spacing.
- **Interaction:** All transitions (color shifts, focus rings) must be instantaneous or capped at 150ms to maintain the "functional precision" feel.