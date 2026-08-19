# LEVL Protocols App — Implementation & Architecture Blueprint

This document tracks all implemented core systems, mathematical engines, and architectural components.

---

## Completed Phases

### Phase 1: Foundation & Data Architecture
- Next.js 16+ App Router, Tailwind CSS, TypeScript, and Turbopack.
- Supabase remote PostgreSQL database client with local-first `local_user_id` device persistence.
- Complete data access layer in `/lib/data/` supporting protocols, modalities, tasks, wellbeing check-ins, and biometric observations.

### Phase 2: Core Protocols & Modality Catalog (198+ Items)
- 100+ clinical protocols (Blueprint 2026, Peter Attia Decathlon, Valter Longo FMD, Sinclair Epigenetic Stack, Walker Sleep Architecture).
- 198+ verified modalities with scientific dossiers, cellular mechanisms, PubMed URLs, dosage spectrum sliders, and secondary vehicle synergies.

### Phase 3: Circadian Today Timeline & Execution Engine
- Dynamic circadian time slots (Morning Sun, Morning Stack, Midday Meal, Afternoon Training, Evening Recovery, Bedtime).
- Multi-day view modes (Single-Day, 3-Day Rolling Split, 7-Day Week View, Month Matrix).
- Precision Complete execution logging (thermal temps, heart rate zones, watts, loads, wavelengths).
- Pre/Post acute outcome tracking (-75% stress delta, +200% alertness) vs Intra-session physical performance (strength load, endurance watts, waking sleep quality).

### Phase 4: Quick-Log Hotkeys & AI Nutrition Engine
- 1-Tap Habit Hotkeys with left vertical gradient progress bars filling up to 100% of daily goals.
- Custom Hotkey Builder (custom habits, icons, units, increments, daily goals, active days).
- Google Gemini 2.5 Pro Vision AI plate scanner with macro breakdown, 30+ plant diversity score, and interactive constituent ingredient manager.

### Phase 5: Fasting & Schedule Hub (`/schedule`)
- Interactive headline KPI cards for Fasting Window (16:8, 18:6, OMAD, custom), Target Fast Break, and Fast Cutoff.
- Precision Macro & Nutrient targets (Calories, Protein g, Net Carbs g, Prebiotic Fiber g, Healthy Fats g).
- Smart Reschedule Grid for drag-and-drop or rolling over missed protocol days.

### Phase 6: Bloodwork Lab Panels & PhenoAge Biological Age (`/physiological-age`)
- Multimodal PDF & photo lab OCR with automatic biomarker extraction (ApoB, hs-CRP, Albumin, Glucose, HbA1c, Vitamin D).
- Morgan Levine / Klemera-Doubal 9-biomarker PhenoAge algorithm with biological age gap tracking and longevity optimal ranges.

### Phase 7: The 1–5 Effort & Friction Matrix
- Standardized `effort` / `effort_level` across all 198 database modalities:
  - **Level 1 (108 items):** Frictionless micro-habits (0–2 min, zero prep, anywhere).
  - **Level 2 (51 items):** Low-friction routines (2–10 min, habit stacked).
  - **Level 3 (16 items):** Moderate effort (15–45 min, dedicated time block, light gear).
  - **Level 4 (13 items):** High hormesis & prep (20–60 min, intense physical discomfort, gym/thermal setup).
  - **Level 5 (10 items):** Intensive / multi-day (5-day FMD, peptide reconstitution cycles, senolytic blasts).

### Phase 8: Dynamic Adaptive Recommendation Engines
- **Next Best Action (Progression Engine):** Triggered when adherence $\ge 75\%$; recommends highest Action ROI un-enrolled modalities with 1-click addition to Today.
- **80/20 Simplification (De-escalation Engine):** Triggered when adherence $< 60\%$; identifies high-effort bottleneck modalities and offers 1-click 14-day benching while protecting 80/20 core anchors.
- **Multi-Dimensional Longevity Impact Formula:** Integrates Base Benefit, Evidence Quality (1–5), Effect Size (1–5), Safety Level (1–5), and Daily Cost Tier (0–4).

### Phase 9: Visual Feature Guide & Interactive Playbook (`/guide`)
- 10 comprehensive chapters covering the entire app curriculum with verified deep links and clinical illustrations.

---

## Disaster Recovery & Runbook
Refer to [`docs/ARCHITECTURE_AND_DISASTER_RECOVERY_PLAYBOOK.md`](file:///Users/kylenmcclintock/Documents/AntiGravity%20Projects/New%20LEVL%20Protocols%20App/docs/ARCHITECTURE_AND_DISASTER_RECOVERY_PLAYBOOK.md) for step-by-step restoration instructions.
