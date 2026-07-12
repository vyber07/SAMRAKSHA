# SAMRAKSHA Design System v3 (Sentinel Prime - Dark Glass)

## Design Philosophy
Engineered for high-security environments, institutional oversight, and mission-critical data visualization. The brand personality is authoritative, stoic, and uncompromisingly professional. 

Leverages **Glassmorphism** within a **Corporate/Modern** framework, utilizing translucent layers to create depth without vibrant 'emotional' colors. It evokes a "digital vault" security—heavy, stable, and transparent.

## Layout & Spacing
- Fixed Grid model for desktop (12-column, 24px gutter).
- Rhythm: 8px base unit.
- Fluid layout for mobile.

## Elevation & Depth
Depth is communicated through **Translucent Layers** and **Subtle Outlines**:
1. **Base Layer:** Solid Deep Dark Slate (#0F172A).
2. **Surface Layer:** 5% White Glass (`rgba(255,255,255,0.05)`) with 16px backdrop-blur. Used for cards, sidebars.
3. **Elevated Layer:** 10% White Glass for active/hover states.
All glass surfaces have a `1px rgba(255, 255, 255, 0.1)` border.

## Colors
- **Background:** Deep Dark Slate (#0F172A)
- **Primary Accent:** Police Blue (#0B66D2)
- **Status (Success):** Desaturated Green (#10B981)
- **Status (Error):** Desaturated Red (#EF4444)

## Typography
- **Metrics/Headers:** Hanken Grotesk (Pure White #FFFFFF)
- **Body:** Inter (Slate Grays #94A3B8)
- **Labels:** JetBrains Mono for metadata/timestamps.

## Shapes
- Standard UI (inputs, buttons): 8px radius (`rounded-sm`).
- Structural Containers (cards, glass sections): 24px radius (`rounded-xl`).
- fully-curved pill shapes for floating headers.

## Components
- **Buttons:** Solid Police Blue (#0B66D2) or translucent glass.
- **Cards:** 24px rounded glass surface, 16px blur, 1px border. No drop shadows.
- **Inputs:** Darker tint (#020617) with 1px border.
