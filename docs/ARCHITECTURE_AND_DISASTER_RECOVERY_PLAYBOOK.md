# LEVL Protocols App: Architecture, Engine Specifications & Disaster Recovery Playbook

> **Last Updated:** August 2026  
> **Purpose:** Comprehensive source-of-truth document detailing the full system architecture, database schema, mathematical recommendation heuristics, and step-by-step disaster recovery runbook.

---

## 1. System Overview & Technology Stack

| Layer | Technology | Key Responsibility |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16.2+ (App Router, React 19, Turbopack) | Dynamic SPA routing, server-rendered API routes, rich PWA client state |
| **Styling & Design System** | Tailwind CSS + Glassmorphism Tokens | Dark mode high-contrast longevity aesthetic, responsive mobile-first UI |
| **Backend & Remote DB** | Supabase (Remote Cloud PostgreSQL instance) | Relational protocol graphs, time-series tasks, biometric observation logs |
| **AI Longevity Intelligence** | Google Gemini 2.5 Pro Multimodal API | Nutritional plate scanning, lab PDF OCR/normalization, circadian coach |
| **Local User State** | UUID-based `local_user_id` in localStorage | Zero-friction local-first authentication syncing with remote Supabase |

---

## 2. The 1–5 Effort & Friction Matrix

Every modality in the LEVL library (198+ items) is rated on an explicit **1–5 Effort Scale** representing total friction:
$$\text{Friction Score} = f(\text{Time Prep}, \text{Physical Discomfort}, \text{Gear Dependency}, \text{Cognitive Load})$$

```
Level 1: Frictionless ──> Level 2: Routine ──> Level 3: Moderate ──> Level 4: High Hormesis ──> Level 5: Intensive
(0-2 min, Anywhere)       (2-10 min, Stacked)   (15-45 min Block)     (20-60 min Discomfort)    (Multi-Day / Clinical)
```

### Detailed Rubric & Live Distribution across 198 Library Modalities:

| Level | Name | Time & Location Constraints | Biological / Practical Examples | Count in DB |
| :--- | :--- | :--- | :--- | :--- |
| **Level 1** | **Frictionless** | 0–2 min, zero prep, anywhere | Single oral pills/capsules (K2, Sulforaphane, Glycine, Magnesium, Apigenin, Creatine, Taurine, D3, TMG), morning sun, water + electrolytes, 10m post-meal walk | **108** |
| **Level 2** | **Routine** | 2–10 min, habit stacked onto meals | Morning multi-supplement protocol box, 16:8 fasting window, 30g prebiotic fiber, box breathing, 4-7-8 breathwork | **51** |
| **Level 3** | **Moderate** | 15–45 min, dedicated time block | Zone 2 cardio, 20m Finnish sauna (174°F+), red light therapy panel, joint mobility routine, 20:4 fasting | **16** |
| **Level 4** | **High Hormesis** | 20–60 min, intense discomfort/gear | 3-min cold plunge (48°F), heavy resistance lifting, Norwegian 4x4 VO2 Max, CGM sensor application | **13** |
| **Level 5** | **Intensive** | Multi-day restriction or clinical setup | 48h / 72h prolonged water fasts, 5-day Fasting-Mimicking Diet (Longo FMD), subcutaneous peptide cycles, senolytic blasts, HBOT | **10** |

### Verified Cost Tiers:
- **Free ($0/day):** Sunlight, Hydration, Fasting (16:8, 20:4, 72h), Post-Meal Walks, Breathwork, Sleep Environment.
- **Low (<$1/day):** Single vitamins & minerals (D3+K2, Glycine, Magnesium, Creatine, Taurine, Zinc, Melatonin).
- **Moderate ($1–$3/day):** NMN, Resveratrol, Spermidine, Sulforaphane, Curcumin, Berberine, Quercetin, Apigenin, CoQ10.
- **High ($3–$10/day):** Urolithin A (Mitopure), CGM continuous sensors, Ca-AKG, NAD+ injections.
- **Premium ($10+/day):** Peptides (BPC-157, Epithalon, MOTS-c), HBOT chambers, Whole-body cryotherapy, Plasmapheresis.

### Canonical 12 Hallmarks of Aging (López-Otín et al., 2023):
Every modality targets 1–3 verified biological hallmarks:
1. `Mitochondrial Dysfunction` • 2. `Cellular Senescence` • 3. `Epigenetic Alterations` • 4. `Loss of Proteostasis` • 5. `Deregulated Nutrient Sensing` • 6. `Chronic Inflammation` • 7. `Disabled Macroautophagy` • 8. `Genomic Instability` • 9. `Telomere Attrition` • 10. `Stem Cell Exhaustion` • 11. `Dysbiosis` • 12. `Altered Intercellular Communication`.

---

## 3. Dynamic Longevity Recommendation Algorithms

### A. Multi-Dimensional Longevity Impact & Action ROI
Every modality is scored across 5 scientific inputs:
1. **Evidence Quality ($E_q \in [1, 5]$)**: Peer-reviewed RCTs and human clinical trials.
2. **Effect Size ($E_s \in [1, 5]$)**: Small, Medium, Large, Substantial biological effect.
3. **Safety Score ($S \in [1, 5]$)**: Risk-stratified (Extremely Safe = 5, Medical Supervision = 1).
4. **Daily Cost Tier ($C \in [0, 4]$)**: Free ($0) = 0, Low = 1, Moderate = 2, High = 3, Premium ($10+/d) = 4.
5. **Effort Level ($L \in [1, 5]$)**: The 5-tier friction matrix.

$$\text{Longevity Impact Score (0–10)} = (\text{BaseBenefit} \times 0.35) + (E_q \times 2 \times 0.30) + (E_s \times 2 \times 0.20) + (S \times 2 \times 0.15)$$

$$\text{Action ROI Index (0–100)} = \frac{\text{Longevity Impact Score} \times (1 + \text{Goal Synergy Bonus})}{L \times (1 + 0.12 \times C)}$$

---

### B. The Dual Dynamic Triggers

#### 1. Next Best Action (Progression Engine)
- **Trigger:** Adherence $\ge 75\%$ or $10+$ day streak on active tasks.
- **Behavior:** Evaluates all un-enrolled modalities with the highest **Action ROI** that synergize with the user's active protocols and lab biomarkers.
- **UI:** Surfaces an emerald/purple progression banner with 1-click **`[+ Add to Today's Routine]`**.

#### 2. 80/20 Simplification (Friction De-Escalation Engine)
- **Trigger:** Adherence $< 60\%$ or $3+$ missed sessions on high-effort items ($L \ge 4$).
- **Behavior:** Identifies the bottleneck culprit modality causing daily resistance.
- **UI:** Surfaces an amber de-escalation banner with 1-click **`[Bench Modality & Reset Stack (14 Days)]`** that moves the bottleneck to **The Bench** while **protecting and highlighting core 80/20 foundational anchors** (Sunlight, Hydration, Morning Stack).

---

## 4. Full Database Schema & Key Tables

```sql
-- 1. Modalities Master Catalog
CREATE TABLE modalities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT,
  category TEXT NOT NULL,
  cadence_layer TEXT,
  effort_level TEXT DEFAULT 'level_1', -- 'level_1' to 'level_5'
  cost_tier TEXT DEFAULT 'low',       -- 'free', 'low', 'moderate', 'high', 'premium'
  safety_level TEXT DEFAULT 'safe',   -- 'safe', 'low_risk', 'moderate_risk', 'high_risk', 'medical_supervision'
  evidence_quality NUMERIC DEFAULT 4,
  effect_size_estimate TEXT,
  overall_longevity_benefit NUMERIC DEFAULT 8,
  brief_description TEXT,
  expanded_why TEXT,
  instructions TEXT,
  mechanism_of_action TEXT,
  diagram_url TEXT,
  image_url TEXT,
  functional_impacts JSONB DEFAULT '{}'::jsonb,
  scientific_references JSONB DEFAULT '[]'::jsonb,
  contraindications TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Protocols Master Catalog
CREATE TABLE protocols (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  short_description TEXT,
  scientific_dossier TEXT,
  target_biological_vectors TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Protocol Steps (Modality to Protocol Junction)
CREATE TABLE protocol_steps (
  id TEXT PRIMARY KEY,
  protocol_id TEXT REFERENCES protocols(id) ON DELETE CASCADE,
  modality_id TEXT REFERENCES modalities(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  recommended_timing TEXT,
  dose_spec TEXT,
  specialized_instructions TEXT
);

-- 4. User Profiles & Custom Configurations
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  local_user_id TEXT UNIQUE NOT NULL,
  display_name TEXT DEFAULT 'Protocol Optimizer',
  primary_goals TEXT[] DEFAULT '{}',
  outcome_preference_scores JSONB DEFAULT '{}'::jsonb,
  fasting_schedule TEXT DEFAULT '16:8',
  eating_window_start TEXT DEFAULT '12:00',
  eating_window_end TEXT DEFAULT '20:00',
  enabled_hotkeys JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Daily Protocol Tasks (Time-Series Execution Timeline)
CREATE TABLE daily_protocol_tasks (
  id TEXT PRIMARY KEY,
  local_user_id TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  timing_slot TEXT NOT NULL,
  modality_id TEXT REFERENCES modalities(id),
  protocol_step_id TEXT REFERENCES protocol_steps(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'skipped', 'missed', 'snoozed'
  completed_at TIMESTAMPTZ,
  execution_telemetry JSONB DEFAULT '{}'::jsonb,
  pre_outcome_scores JSONB DEFAULT '{}'::jsonb,
  post_outcome_scores JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. The Bench (Staging & Backlog)
CREATE TABLE user_bench_items (
  id TEXT PRIMARY KEY,
  local_user_id TEXT NOT NULL,
  modality_id TEXT REFERENCES modalities(id),
  protocol_id TEXT REFERENCES protocols(id),
  status TEXT DEFAULT 'benched', -- 'benched', 'eliminated'
  elimination_reasons TEXT[] DEFAULT '{}',
  personal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Physiological Age Biomarkers & Lab Panels
CREATE TABLE bloodwork_lab_panels (
  id TEXT PRIMARY KEY,
  local_user_id TEXT NOT NULL,
  test_date DATE NOT NULL,
  lab_provider TEXT,
  biomarkers JSONB DEFAULT '{}'::jsonb, -- ApoB, hs-CRP, Albumin, Glucose, HbA1c, etc.
  pheno_age_years NUMERIC,
  biological_age_gap NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Disaster Recovery Runbook (Spin Up From Scratch)

If the environment is ever lost or wiped, follow these exact 6 steps to restore full operations within 5 minutes:

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/Kylen-McClintock/2026-LEVL-Protocols-App.git
cd 2026-LEVL-Protocols-App
npm install
```

### Step 2: Configure Environment Variables
Create `.env.local` with your remote Supabase credentials and Gemini API key:
```env
NEXT_PUBLIC_SUPABASE_URL=https://allzcxnbvabahocbgbmt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyBQ9GS4gTZrBC1eQoQ8yzJNrZMyM0QVQMU
```

### Step 3: Run Database Migrations & Seeds (If restoring a fresh DB)
Execute the SQL migration scripts in your Supabase SQL Editor:
1. `docs/SUPABASE_SCHEMA_PLAN.md` (Table structures)
2. `scripts/generate_20_sql.js` (Seeds 20 core clinical stacks)
3. `scripts/seed_2026_supplements.js` (Seeds Bryan Johnson 2026 supplement stack)
4. `scripts/update_modalities_effort_1to5.sql` (Applies the 1–5 Effort Matrix)

### Step 4: Run Data Synchronization Audit
```bash
node scripts/re_evaluate_modalities_effort.js
```

### Step 5: Validate Type Safety & Production Build
```bash
npx tsc --noEmit
npm run build
```

### Step 6: Start Local Development or Deploy to Production
```bash
npm run dev
```
Open `http://localhost:3000` to verify live circadian execution, explore catalog, and adaptive recommendations.
