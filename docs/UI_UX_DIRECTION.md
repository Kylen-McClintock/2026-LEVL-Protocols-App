# LEVL Protocols App — UI/UX Direction

## Visual Aesthetic
- **Tone**: Premium, calm, futuristic, longevity-focused.
- **Color Palette**: 
  - Dark blue-purple / near-black backgrounds for deep focus.
  - Deep green longevity-positive accents.
  - Purple/blue complementary accents.
  - White text for high contrast readability, muted gray/blue text for secondary information.
- **Materials**: Heavy use of glassmorphism (translucent cards with background blur) to convey a modern, premium feel.
- **Not**: Medical, generic SaaS, or cheesy biohacker.

## Layout & Navigation
- **Mobile-First**: Large touch targets, swipe gestures, and clear typography. Bottom navigation bar for primary routes on mobile.
- **Desktop Accessible**: Responsive scaling. On wider screens, the layout expands to show side navigation and potentially week-at-a-glance.

## Key Screens & Components

### Today View (The Primary Interface)
- Displays a vertical protocol stack rather than a calendar grid.
- Modalities are ordered by "relative daily rhythm" (waking, morning, midday, evening, etc.).
- Interactions: 
  - Swipe right to complete.
  - Swipe left to skip.
  - Tap card body to expand.
  - Tap outcome button to trigger slider overlay.

### Modality Cards & Geek Mode
- **Collapsed Card**: Shows name, dosage/exposure, timing, schedule pattern badge, and personal longevity impact.
- **Expanded Card**: Adds description, instructions, image, safety, and relationship warnings.
- **Geek Mode**: A deep dive toggle inside expanded cards revealing mechanistic data (Hallmarks of aging, evidence level, effect size, interactions, half-life, cohorts, etc.).

### Sliders & Check-ins
- **Daily Wellbeing**: A unified component for Mood, Energy, Stress.
- **Outcome Sliders**: Modality-specific overlays for outcomes (e.g. Focus, Alertness, Satiety). Sliders only save data if the user explicitly moves them.

### Bottom Navigation (Mobile)
- Today
- Weekly
- Bench
- Explore
- Settings
