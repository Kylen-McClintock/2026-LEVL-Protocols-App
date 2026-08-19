# LEVL Protocols: Scientific & Technical Architecture

*This document serves as a living whitepaper detailing the design thinking, mathematical models, and technical architecture of the LEVL Protocols application.*

---

## 1. The Next Best Action (NBA) Algorithm

### 1.1 Purpose
The NBA algorithm ranks the universe of available health modalities (supplements, habits, therapies) and identifies the optimal interventions for an individual user based on their unique biological profile, constraints, and goals.

### 1.2 Scoring Components (100-Point Scale)

1. **Foundational Longevity Impact (Up to 25 Points):** 
   - Based on clinical evidence for all-cause mortality reduction.
   - Scaled by the user's personal `longevity_personalization_coefficient`.

2. **Functional Outcome Synergy (Up to 50 Points):** 
   - Cross-references the modality's impact scores (e.g., L-Theanine -> Focus = 8/10) with the user's subjective preference scores (e.g., User Priority for Focus = 10/10).
   - Generates a multiplier effect to surface modalities that directly solve the user's most painful problems.

3. **Heuristic & Biomarker Adjustments:**
   - **Constraint Penalties:** Heavy point deductions for modalities that exceed the user's financial budget (`weekly_spend_budget_usd`), time budget, or discipline level.
   - **Biological Filters:** Modalities are penalized or boosted based on body fat percentage, biological sex, age, and baseline sleep quality (e.g., Acarbose penalized if body fat < 15%).
   - **Risk vs. Openness:** Penalties applied if a modality's safety/evidence profile conflicts with the user's stated experimental openness or risk tolerance.

---

## 2. N-of-1 Correlation Engine

### 2.1 Purpose
Clinical trials are based on population averages, but individual biology varies wildly. The N-of-1 engine analyzes the user's actual adherence data against their subjective outcomes to discover how *their* body specifically reacts to a modality.

### 2.2 Data Capture (Micro-Signals)
The application captures two forms of subjective data:
- **Macro-Signals:** Time-aware daily check-ins (Morning vs Nightly) that evaluate baseline mood, energy, stress, and sleep.
- **Micro-Signals:** Task-specific "Before and After" tracking. When a user completes a modality that targets a specific outcome (e.g., Coffee -> Focus), the UI captures their Focus score immediately before and after the event.

### 2.3 Mathematical Model
The engine operates on a rolling 30-90 day window. For every modality on the user's protocol:
1. **Cohort Splitting:** Days are divided into a **Treatment Cohort** (modality completed) and a **Control Cohort** (modality skipped).
2. **Delta Calculation:** The engine averages the outcome scores across both cohorts, prioritizing direct Before/After micro-signals, and falling back to daily Macro-Signals if needed.
3. **Insight Generation:**
   - **Hyper-Responder:** `(Treatment Avg - Control Avg) >= +1.5`
   - **Negative Correlation:** `(Treatment Avg - Control Avg) <= -1.0`
   - **Non-Responder:** `-0.5 < Delta < +0.5` (Requires N >= 14 days of adherence).
4. **Overrides:** High-confidence insights (based on sample size) are saved to the database as `user_modality_overrides`, effectively rewriting the global Next Best Action scoring logic to favor the user's localized biological data.

---

---

## 3. Modality Similarity & Comparison Engine

### 3.1 Purpose
To prevent protocol redundancy and enable friction-free intervention swaps, the library view dynamically identifies when a user is exploring a modality that is functionally equivalent or directly comparable to one already in their active **Today** timeline or **Bench**.

### 3.2 Active Status Detection & Visual Hierarchy
- **Active Today**: Modalities currently scheduled in the user's daily tasks render an emerald glow border (`border-emerald-500/40`) with a top badge (`✓ In Today's Plan`).
- **Saved on Bench**: Modalities on the user's bench render a cyan glow border (`border-cyan-500/40`) with a top badge (`📌 Saved on Bench`).

### 3.3 Strict Similarity Matching Rules
To prevent false-positive comparisons between interventions with opposing biological mechanisms (e.g., calming adaptogens like Ashwagandha vs energizing NAD+ boosters like NMN), similarity matching enforces two strict tiers:

1. **Explicit Modality Family Keyword Matching:**
   - **Cold Exposure:** `cold plunge`, `ice bath`, `cold shower`, `cryotherapy`
   - **Heat Exposure:** `sauna`, `steam room`, `infrared sauna`, `heat exposure`
   - **Mindfulness & Breathwork:** `box breathing`, `wim hof`, `physiological sigh`, `4-7-8`, `breathwork`, `holotropic`, `coherent breathing`, `meditation`
   - **Strength & Resistance Training:** `strength`, `resistance`, `weightlifting`, `hypertrophy`, `calisthenics`, `powerlifting`, `lifting`, `muscle building`
   - **Cardio Zones:** `zone 2`, `aerobic base`, `incline walk`, `steady state cardio` vs `vo2 max`, `sprint interval`, `hiit`, `zone 5`
   - **Fasting:** `fasting`, `time-restricted feeding`, `water fast`, `intermittent fast`
   - **Light / PBM:** `red light`, `photobiomodulation`, `pbm`, `light therapy`
   - **Specific Supplement Ingredient Clusters:** `creatine`, `magnesium` (glycinate, L-threonate, citrate), `omega-3`, `vitamin d3`, `nmn`/`nr`/`nad+`, `ashwagandha`/`rhodiola`, `l-theanine`.

2. **Strict Non-Generic Outcome Matching:**
   - Generic categories (`supplement`, `nutrition`, `other`, `general`) are **strictly excluded** from broad outcome matching to prevent false positives between distinct chemical compounds.
   - For non-supplement modalities, exact category match requires $\ge 2$ shared high-impact functional outcomes with individual scores $\ge 8/10$.

### 3.4 Side-by-Side Comparison Matrix (`ModalityCompareModal`)
When a similar modality is detected, a `[ Compare ⚖️ ]` action allows the user to open a 2-column side-by-side evaluation matrix comparing:
- Category & Dosing/Exposure
- Timing & Cadence
- Effort & Cost Tier
- Evidence Quality & Safety Profile
- High-impact functional outcome scores (Sleep, HRV, Focus, Energy, Recovery)
### 3.5 Direct Keyword Relevance Sort & Visual Health Conflict Warnings
- **Direct Keyword Relevance Sort (`sortMode = 'relevance'`):**
  - Evaluates direct title, category, and description match scores to the user's typed search query, completely unpenalized by personal profile scoring.
  - Allows users to find any item in the global library purely by keyword query while keeping personalized NBA ranking as an optional toggle (`🔤 Direct Relevance` vs `★ Recommended (NBA)`).
- **Visual Health & Profile Conflict Warnings (`ExploreCard`):**
  - When a modality has an explicit contraindication, budget/discipline constraint, or risk tolerance mismatch, it is marked with a prominent red badge: `⚠️ Profile Conflict`.
  - An inline red warning banner details the exact conflict reasons (e.g. `⚠️ Health & Profile Conflict: Lacks the proven evidence you prefer • Exceeds your weekly budget`), keeping the item searchable while making any conflict visually obvious.

### 3.6 Snoozed Modalities Accordion & Non-Daily Auto-Rollover Engine
- **Snoozed Modalities Section (`Snoozed Modalities`):**
  - Snoozed tasks are moved out of the active timeline into a dedicated **Snoozed Modalities** section (styled with a light amber/yellow border `border-amber-500/30`, amber background `bg-amber-950/20`, and a Clock icon).
  - Tapping **`⏰ Show Inline`** allows users to toggle snoozed items back into their timeline blocks if desired.
  - Minimalist card header for snoozed items features a 1-tap **`Undo`** button to revert any snoozed modality back to pending.
- **Non-Daily Auto-Rollover (`processSnoozedTasksRollover`):**
  - Uncompleted or snoozed non-daily modalities (such as Workouts, Resistance Training, Sauna, Cold Plunges, 24h/36h/72h Fasts, DEXA Scans) automatically roll over to the next day's schedule.
  - **Deduplication Safeguard:** Queries existing tasks on the destination day to ensure a non-daily modality is **never duplicated** if already present in the next day's schedule.

- **Unified Dynamic Color Engine (`getOutcomeColorConfig` & `getNeutralOutcomeColorConfig`):**
  - Integrated directionality-aware color engine across `DailyWellbeingCheckin` and `ProtocolTaskCard`.
  - **Neutral Grey Prior to Logging:** Untouched sliders start in clean **neutral grey** (`getNeutralOutcomeColorConfig()`, `#6B7280`) until moved/touched by the user, at which point they smoothly activate into their full dynamic color scheme (*Green/Cyan/Amber/Red*).
- **Baseline Pre-Fill & Dual-Point Before ➔ After Range Slider Visualizer:**
  - **Baseline Pre-Fill**: When a pre-modality baseline is logged, the post-completion outcome sliders pre-fill to the recorded baseline value with a prominent `⚡ Baseline: X/10` badge.
  - **Dual-Point Range Slider Visualizer**: When expanding a completed card in the Completed Modalities Section where both a Before (Baseline) and After (Post) rating exist, it renders a unified dual-marker track:
    - **Before Marker** (`Before 4`) in purple badge & dot.
    - **After Marker** (`After 8`) in emerald badge & dot.
    - **Connecting Highlighted Range Band** bridging the two points.
    - **Shift Indicator Badge** (`Before 4 ➔ After 8 (+4 Shift)`).
  - **Post-Completion Outcome Rating Editing**: Tapping `[ ⚡ Edit Observations ]` on an expanded completed card opens an inline editor allowing users to modify both their **Before (Baseline)** and **After (Post-Modality)** numerical 0-10 ratings at any time, immediately persisting changes to the database and re-rendering the visualizer.
  - **Skipped & Satisfied Modalities Section & Reason Banners**: When a modality is skipped or satisfied by flexible protocol schedule (e.g. Leg Day completed day prior), it flows into a dedicated **`SKIPPED & SATISFIED MODALITIES`** glassmorphism section (matching `COMPLETED` and `SNOOZED` UI). When expanded, cards display a prominent Reason Banner highlighting either **User Submitted Reason** (e.g. `💬 Reason: "Felt fatigued today"`) or **AI Coach Derived Reason** (e.g. `🤖 Coach Reason: "Flexible weekly target satisfied"`).
  - **Smart Outcome Fallback Resolution & Peak Effect Window Guidance**: Replaced arbitrary 3-slider fallback with category/name-aware bio-signal resolution (e.g., *Oral Hyaluronic Acid* maps to `Skin Clarity` & `Joint Comfort`). Long-term cumulative modalities (*Vitamin D3*, *Omega-3*, *Collagen*, *DEXA*) default to `[]` empty outcomes, bypassing unnecessary acute daily outcome prompts upon completion. Acute modalities feature ultra-concise peak window badges (e.g., `⏱️ Peak effect window: ~30–45m`).
  - **Dedicated Morning Sleep & Recovery Section & Acute Sleep Filtering**: All sleep-related outcome dimensions (*Sleep Quality*, *Sleep Latency*, *Night Waking*, *Restorative Sleep*, *Objective Sleep Score*) are consolidated into a dedicated top section **`🌙 SLEEP & RECOVERY OBSERVATIONS`** inside the Morning Check-In (`DailyWellbeingCheckin`). Sleep outcomes are **100% excluded** from acute post-session outcome prompts on individual modalities (e.g. Magnesium L-Threonate, Mouth Taping, Blue-Light Glasses), preventing premature acute sleep rating prompts before sleep occurs.
  - **Strict Null Baseline Tracking & Untouched Slider Safeguards**: Eliminated all artificial `5` defaulting for unrecorded pre-modality baselines across `OutcomeSliderOverlay` and `ProtocolTaskCard`. Untouched pre-modality baselines display as `Unset (No Baseline)` in neutral grey (`#6B7280`), and un-touched baseline values are strictly omitted from database writes to prevent phantom baseline records.
  - **Expandable Live Fast Widget & Uncompleted Modalities Placement**: Re-positioned the `ActiveFastWidget` in `/today` to sit directly at the top of the uncompleted active modalities timeline (below Category Pills, rather than at the top of the entire page). Added expandable card details support to `ActiveFastWidget` (`Modality Details` toggle button and header click), exposing headline benefits, physiological mechanisms, targeted bio-signal outcomes, implementation guidelines, and Geek Mode.
  - **Fasting Modalities Outcome Tracking & Parity Engine**: Integrated full outcome tracking onto live fasting modalities (`ActiveFastWidget`), including `Log Baseline (Before)` pre-fast logging, inline `"How Do You Feel?"` post-fast sliders upon breaking fast, untouched neutral-grey slider states, `CustomizeModalityOutcomesModal` support (`Edit Tracked Outcomes`), and database observation persistence. Created the `mental_clarity` dimension in Supabase `outcome_dimensions` table and mapped all fasting modalities exclusively to valid user-subjective database dimensions (`Mental Clarity`, `Focus`, `Energy`, `Satiety`, `Digestive Comfort`, `Brain Fog`), moving non-subjective physiological mechanisms (*Autophagy*, *Fat Oxidation*, *Insulin Sensitivity*) into Geek Mode.
  - **Fasting Modalities Science Data & PubMed Citations Audit**: Populated all existing and future fasting modalities in the database and reference registry ([references.ts](file:///Users/kylenmcclintock/Documents/AntiGravity%20Projects/New%20LEVL%20Protocols%20App/lib/data/references.ts)) with complete **Geek Mode** science content (Evidence Quality, Effect Size, Safety Level, Mechanism of Action, Known Synergies, Antagonism Warnings, Hallmarks of Aging Impact, and direct PubMed citations with clickable links).

### 3.8 Smart Modality Timing Resolver Engine (`resolveOptimalTimingSlot`)
- **Guaranteed Optimal Time Block Assignment:**
  - Prevents modalities from defaulting to `anytime` by analyzing explicit protocol step slots, modality default slots, and semantic keyword signatures (`resolveOptimalTimingSlot`).
  - **Morning Modalities** (e.g. *Morning Sunlight Exposure*, *Morning Light Exposure*, *Caffeine*, *Cold Plunge*, *Vitamin D3+K2*, *Alpha-GPC*) automatically map to the `morning` timeline block.
  - **Bedtime & Evening Modalities** (e.g. *Evening Screen Time Reduction*, *Blue Light Blocking Glasses*, *Sleep Mouth Taping*, *Magnesium L-Threonate*, *Apigenin*, *GABA*) automatically map to `bedtime` or `evening`.
  - **Fitness & Thermal Modalities** (e.g. *Strength Training*, *BFR Training*, *Zone 2 Cardio*, *Sauna*) automatically map to `afternoon` or `evening`.
- **Database Modality Timing Audit (`updateModalityOptimalTimings.js`):**
  - Audited all 94 database modalities and updated `default_timing_slot`, `timing_summary`, and active protocol step records to enforce optimal circadian timing.

---

## 4. Rich Multi-Modal Execution Loggers

### 4.1 Non-Negative Bounds & Data Integrity
All numeric inputs across execution loggers (reps, sets, weight, duration, rounds, breath hold, temperature, distance, heart rate, watts, ketones, glucose, water oz) enforce strict non-negative sanitization (`min="0"` and `Math.max(0, ...)`).

### 4.2 Mindfulness & Breathwork Logger (`BreathworkExecutionLog`)
- Includes an explicit **"Include Breathwork Protocol? (Yes / No)"** toggle.
- When **No**: Collects clean mindfulness meditation metrics (Duration, Subjective Depth 1-10, Post HRV ms).
- When **Yes**: Opens up the specific cadence selector (Box Breathing, Wim Hof, 4-7-8, Resonant, etc.) and Max Breath Hold (sec) tracker.

### 4.3 Multi-Round Thermal & Contrast Therapy (`ThermalExecutionLog`)
- Supports custom per-round contrast exposure tracking.
- **Quick Preset Cloning:** Buttons for `2x Rounds`, `3x Rounds`, and `4x Rounds` automatically clone exposure rounds.
- Each round row independently specifies **Exposure Type** (Sauna, Cold Plunge, Ice Bath, Steam Room), **Temperature (°F/°C)**, and **Duration (mins)**.
- Default custom round type automatically inherits the selected exposure type (e.g. Sauna @ 180°F, 15m).
- Total duration and round counts recalculate automatically.

### 4.4 Precision Fasting & Live Autophagy Engine (`ActiveFastWidget` & `FastingExecutionLog`)
- **Live Active Fast Progress Widget (`ActiveFastWidget`):**
  - Renders a prominent live progress card at the top of the Today view whenever a fast is active.
  - Computes live elapsed time, target hours, percentage complete, and real-time metabolic zone mapping:
    - `0–12h`: Insulin Normalization & Digestion (🩸)
    - `12–18h`: Glycogen Depletion & Fat Oxidation (⚡)
    - `18–24h`: Cellular Autophagy & MToR Inhibition (🧬)
    - `24–48h`: Peak Autophagy & HGH Surge (🛡️)
    - `48h+`: Immune System Regeneration & Stem Cell Activation (🔄)
  - Provides 1-tap quick actions: `[ Break Fast & Complete ]`, `[ + 500mg Sodium ]`, `[ + 16oz Water ]`, `[ + 2h Goal ]`.
- **Glucose-Ketone Index (GKI) Calculator:**
  - Computes $\text{GKI} = \frac{\text{Glucose (mg/dL)}}{18 \times \text{Ketones (mmol/L)}}$.
  - Badges: Highest Therapeutic Autophagy ($\text{GKI} < 1.0$), Deep Ketosis ($1.0–3.0$), Moderate ($3.0–6.0$), Light ($> 6.0$).
- **Refeeding Meal & GI Recovery Logger:**
  - Tracks post-fast break meal types (Bone Broth, Healthy Protein + Fats, Low-Carb) and stomach GI Comfort (1–10).
- **Default vs. Advanced UI Hierarchy:**
  - **Default View:** Displays Autophagy Stage Banner, Started Fast & Ended Fast Time Pickers, and Fast Protocol Dropdown.
  - **Expandable `[ 📊 Detailed Tracking ]` Toggle:** Houses technical metrics (Glucose, Ketones, GKI, Refeeding Meal, GI Comfort, Hydration Toggles) to keep the primary execution interface uncluttered.
- **Seeded Fasting Modality Suite:**
  1. `Time-Restricted Eating (18:6)`
  2. `Warrior Diet Fasting (20:4)`
  3. `OMAD (One Meal A Day Fasting)`
  4. `24-Hour Water Fast (Dinner-to-Dinner)`
  5. `36-Hour Monk Fast (Alternate Day Fasting)`
  6. `48-Hour Extended Fasting`
  7. `72-Hour Prolonged Autophagy Fast`
  8. `Bone Broth Fasting`
  9. `Fat Fasting (Keto Mimicking)`

