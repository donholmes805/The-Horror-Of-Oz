---
name: The Horror of Oz
colors:
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2b2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c7'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c9c6c5'
  primary: '#c9c6c5'
  on-primary: '#313030'
  primary-container: '#0a0a0a'
  on-primary-container: '#7b7979'
  inverse-primary: '#5f5e5e'
  secondary: '#c8c6c5'
  on-secondary: '#303030'
  secondary-container: '#474747'
  on-secondary-container: '#b6b5b4'
  tertiary: '#cac6c3'
  on-tertiary: '#32302f'
  tertiary-container: '#0b0a09'
  on-tertiary-container: '#7c7977'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c9c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#e6e1df'
  tertiary-fixed-dim: '#cac6c3'
  on-tertiary-fixed: '#1d1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#141313'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Newsreader
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
spacing:
  unit: 8px
  gutter: 24px
  margin: 32px
  container-max: 1200px
---

## Brand & Style
This design system establishes a visual language of "decaying prestige." It captures the juxtaposition of the once-vibrant Land of Oz with a creeping, visceral Gothic horror. The brand personality is enigmatic, authoritative, and unsettling, targeting an audience that appreciates high-fidelity narrative experiences and atmospheric world-building.

The aesthetic utilizes a blend of **Tactile Skeuomorphism** and **Cinematic Minimalism**. It relies on physical metaphors—such as heavy brass, weathered stone, and velvet shadows—layered over a clean, professional structural grid. The emotional goal is to evoke a sense of "dreadful wonder," where every interaction feels like turning the page of a cursed grimoire or unlocking a heavy iron gate in a fog-laden forest.

## Colors
The palette is rooted in absolute darkness to provide a cinematic foundation for the high-contrast accents.

- **Primary & Secondary:** Deep Black and Ash Gray form the "void" of the interface, used for backgrounds and structural containers to ensure the UI recedes into the atmosphere.
- **Blood Red:** Reserved strictly for high-intensity actions, alerts, and critical health-related data. It should feel visceral and sudden.
- **Antique Gold:** Used for "Prestige" elements—headers, crests, and decorative borders—to signify the dying remnants of the Wizard’s former glory.
- **Scorched Yellow:** Represents the Yellow Brick Road. It is used for navigational cues, active states, and "pathfinding" elements within the UI. Unlike the gold, this color should feel weathered and slightly sickly.

## Typography
The typography strategy prioritizes a literary, authoritative feel. This design system uses **Newsreader** for both headlines and body text to create a cohesive "dark fairytale" reading experience. 

Headlines should utilize high-contrast serifs with tight tracking to feel monumental. Body text is set with generous line height to maintain readability amidst dark, textured backgrounds. **Inter** is introduced as a functional secondary typeface for metadata, buttons, and labels, providing a clean, utilitarian contrast to the ornate serif styles.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for desktop to maintain a cinematic aspect ratio, while transitioning to a fluid model for mobile responsiveness. 

Spacing is intentionally generous to facilitate a "breathless" atmosphere; density is avoided to prevent the UI from feeling cluttered. Alignment should be strictly centered for narrative beats and left-aligned for functional data. Elements should be grouped within "Gothic Panels"—containers that use the grid to establish clear, rhythmic hierarchies. Use a 12-column grid for desktop with wide gutters to allow the background "fog" and textures to permeate the layout.

## Elevation & Depth
Depth in this design system is not achieved through light, but through **Shadow and Fog**. 

- **Tonal Layers:** Surfaces further back are pure `#0a0a0a`, while interactive surfaces (cards/panels) are `#2c2c2c` with subtle inner glows.
- **Atmospheric Overlays:** Use CSS radial gradients to create a "vignette" effect on the screen edges, focusing the user's eye on the central content.
- **Heavy Cinematic Shadows:** Use multi-layered, low-blur shadows with a slight red or gold tint to make elements feel like they are floating in a thick atmosphere. 
- **Glowing Effects:** Interactive elements should emit a soft, pulsing outer glow (`#b8860b` for knowledge/gold or `#8b0000` for danger) to simulate bioluminescence or magical influence.

## Shapes
The shape language is **Sharp (0)**. 

To maintain the Gothic, architectural integrity, all UI elements—buttons, cards, and input fields—must have 90-degree corners. Rounded corners are perceived as friendly or modern, which contradicts the harsh, unforgiving nature of this world. Decorative "notched" corners or diamond-shaped accents may be used for secondary buttons or status indicators to mimic classic stonework or jewelry cutting.

## Components
Consistent component styling reinforces the "unmaking" of the world:

- **Buttons:** Primary buttons use a solid Antique Gold fill with black text. Secondary buttons are "Ghost" style with a 1px Blood Red border. Hover states should trigger a subtle "cracked" texture overlay.
- **Cards:** Defined by "Gothic Paneling"—a 1px Scorched Yellow border with a heavy inner shadow. The background should have a subtle grain or "cracked brick" texture.
- **Inputs:** Underlined rather than boxed, using a Scorched Yellow line that glows when focused.
- **Iconography:** All icons must be rendered in a "Brass Key" style—highly detailed, thin-stroke metallic vectors. Use locked door icons for gated content and lantern icons for navigation.
- **Progress Bars:** Designed to look like the "Yellow Path," where the progress is indicated by a glowing yellow trail that looks like illuminated masonry against a dark background.
- **Modals:** Use a heavy backdrop blur (20px) to simulate thick fog, isolating the modal content from the rest of the world.