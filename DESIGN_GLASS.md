# SAMRAKSHA Design System v2 (Material Glass)

## Design Philosophy
Google Material Design 3 combined with modern Glassmorphism.
Focus on extreme depth, fully curved corners (pill shapes), translucent surfaces with background blur, and vibrant, layered colors. 
The UI should feel tactile, modern, and fluid.

## Color Palette (Material You Vibrant)
- Primary: #4285F4 (Google Blue)
- Secondary: #34A853 (Google Green)
- Tertiary: #EA4335 (Google Red)
- Background: A vibrant, abstract gradient mesh (e.g. soft blues and purples) to show off the glassmorphism.
- Surface Glass: rgba(255, 255, 255, 0.6) with backdrop-filter: blur(16px).
- Surface Solid: #FFFFFF
- Text-Primary: #1A1A1A
- Text-Secondary: #5F6368

## Typography
- Font Family: Google Sans, Roboto, system-ui
- H1: 36px, medium
- H2: 28px, medium
- Body Large: 16px, regular
- Label/Button: 14px, medium

## Component Tokens
- Border Radius: xl: 24px (cards, sections), full: 9999px (buttons, chips, fully curved).
- Shadows: Soft, diffused drop shadows to emphasize floating glass layers. (e.g. 0 8px 32px rgba(31, 38, 135, 0.15))
- Borders: 1px solid rgba(255, 255, 255, 0.4) for the glass reflection effect.

## Components
- Buttons: Fully curved (pill-shaped). Solid primary color or glass effect. 
- Cards: Glassmorphism effect. Translucent white, heavy background blur, fully curved corners (24px).
- Inputs: Fully curved, soft inner shadows, clear floating labels.
- Badges/Chips: Fully rounded pill shapes, soft pastel backgrounds.

## Interaction
- Micro-animations: Fluid, elastic animations. 300ms easing. Hover states make the glass slightly more opaque.
