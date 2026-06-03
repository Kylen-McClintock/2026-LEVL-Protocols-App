# LEVL Protocols App MVP — Product, UI, and Architecture Brief

## 1. Purpose

This document defines the MVP for the LEVL Protocols App.

It should be used together with:

```txt
/docs/LEVL_UNIVERSAL_MODALITY_PRIMITIVE.md
```

The Universal Modality Primitive defines what a LEVL-compatible modality is.  
This document defines what to build first: the MVP app experience, screen structure, basic data model, ranking logic, UI direction, seed modalities, and implementation boundaries.

The MVP should help users become more intentional about the practices, foods, supplements, and routines they bring into their life.

Core outcome:

> Users should be able to discover longevity-supporting modalities, save them to a bench, follow a daily protocol stack, check off completed modalities, track relevant outcomes, and understand why a modality is worth trying.

---

## 2. Product Vision

LEVL is a longevity protocol engine.

The app helps users:

- Build a daily longevity protocol.
- Track how modalities affect their functional outcomes.
- Understand the likely longevity impact of each modality.
- Compare modalities by personalized next-best-action ranking.
- Save promising modalities to a bench.
- Try protocols from a global library.
- Prepare for future AI-guided protocol optimization.
- Prepare for future bloodwork, biomarker, wearable, and knowledge graph integrations.

The primary interface is not a calendar.

The primary interface is:

> A vertical stack of modality cards for Today.

---

## 3. MVP Principle

Build a simple, beautiful, useful MVP first.

The MVP should support the future architecture, but should not attempt to build the full future platform.

### Build now

```txt
Today view
Weekly protocols view
Bench
Global Library / Explore
Modality cards
Protocol cards
Relevant outcome sliders
Daily well-being check-in
Geek Mode
Seed modality data
Basic personalized ranking
Stub AI buttons
Pulsed/cyclical modality support in data model
Modality relationship warnings in data model and Geek Mode
```

### Do not build yet

```txt
Authentication
Supabase auth
Manual protocol builder
Full AI chat interface
Real LLM integration
API key UI
Bloodwork upload
Wearable integrations
Calendar integrations
Knowledge graph integration
Applet marketplace
LongevityReviews.org public site
Social/community features
Clinical dashboard
Full n-of-1 experiment engine
Full modality extraction tool
```

Leave clean extension points for these later.

---

## 4. Technical Stack

Use:

```txt
Next.js App Router
TypeScript
Tailwind CSS
PWA-ready structure
Vercel-ready deployment
Supabase-ready data architecture
Local seed data for MVP
```

### Important MVP decision

Do **not** include authentication at the start.

For MVP, use a local/demo user profile.

The app should be architected so Supabase auth can be added later, but do not block the MVP on login, signup, email magic links, or user account management.

Recommended approach:

```txt
MVP: local demo user + local state / seed JSON / simple persistence
Later: Supabase auth + real user_profiles table
```

---

## 5. Recommended Project Structure

```txt
/app
  /today
  /weekly
  /bench
  /explore
  /settings
  /onboarding
  /modalities/[id]
  /protocols/[id]

/components
  /layout
  /cards
  /sliders
  /geek-mode
  /navigation
  /score
  /protocols
  /modalities

/lib
  /data
  /ranking
  /outcomes
  /modality
  /protocols
  /storage

/services
  /ai
    coachStub.ts
    modalityQuestionStub.ts
  /longevity
    longevityScoreStub.ts
  /experiments
    experimentationStub.ts
  /wearables
    wearableStub.ts
  /bloodwork
    bloodworkStub.ts

/data
  /seed-modalities
  /seed-protocols
  /seed-outcomes

/docs
  LEVL_UNIVERSAL_MODALITY_PRIMITIVE.md
  PRD_LEVL_PROTOCOLS_APP_MVP.md
  FEATURE_ROADMAP.md
  UI_UX_DIRECTION.md
  DATA_MODEL_OVERVIEW.md
```

If the project already has a better convention, follow the existing convention while preserving this separation:

```txt
/app = routes and pages
/components = reusable UI
/lib = domain logic
/services = future external integrations and stubs
/data = seed data
/docs = product and architecture specs
```

---

## 6. Core User Flow

### 6.1 First use

1. User opens app.
2. User completes lightweight onboarding.
3. User chooses goals and outcomes they care about.
4. App creates a default local profile.
5. User lands on Today view.
6. User sees a default protocol stack made from seed modalities.
7. User can open modalities, track outcomes, add notes, save modalities to Bench, or explore more.

### 6.2 Daily use

1. User opens Today.
2. User sees vertical stack of modality cards.
3. User completes or skips modalities.
4. Relevant outcome sliders appear when useful.
5. User can do a daily well-being check-in.
6. User can expand Geek Mode.
7. User can open Bench or Explore to adjust what they may want to try next.

### 6.3 Discovery use

1. User opens Explore.
2. User sees Next Best Actions ranked for them.
3. User browses global modalities and protocols.
4. User saves modalities to Bench.
5. User adds a protocol from the library to their Bench.
6. Full manual protocol creation waits until later AI integration.

---

## 7. Onboarding

No auth.

Create a lightweight onboarding flow that populates a local demo user profile.

### 7.1 Onboarding questions

Ask:

```txt
Primary goals
Functional outcomes that matter most
Health conditions or risk concerns
Current medications or treatments
Discipline level
Experimental openness
Weekly time budget
Weekly spend budget
Chronotype
```

### 7.2 Primary goals

Multi-select examples:

```txt
Live longer
Lower pace of aging
Improve sleep
Improve energy
Improve focus
Gain muscle
Lose fat
Improve endurance
Improve recovery
Improve metabolic health
Optimize hormones
Improve mood
Reduce stress
Improve skin
Improve libido
Prevent injuries
Support cardiovascular health
Support cognitive health
```

### 7.3 Functional outcome preferences

Let the user rate each important functional outcome from 0–10.

0 means neutral / not currently a priority.

These preference scores should feed into Next Best Action ranking.

### 7.4 User profile fields for MVP

```txt
demoUserId
displayName
primaryGoals
outcomePreferenceScores
healthConditionsText
medicationsAndTreatmentsText
disciplineLevel_0_99
experimentalOpenness_0_99
weeklyTimeBudgetHours
weeklySpendBudgetUsd
chronotype
riskTolerance
createdAt
updatedAt
```

---

## 8. Functional Outcomes

The app should support default well-being tracking and modality-specific outcome tracking.

### 8.1 Daily well-being tracking

The app should include a simple daily well-being check-in.

Default well-being dimensions:

```txt
Mood — higher is better
Energy — higher is better
Stress — lower is better
```

This daily check-in is separate from modality-specific sliders.

### 8.2 Modality-specific outcome tracking

Do not force Mood, Energy, and Stress onto every modality card.

Each modality should show only relevant sliders.

Use the functional outcome ontology from the Universal Modality Primitive.

Core outcomes:

```txt
Mood — higher is better
Energy — higher is better
Stress — lower is better
Alertness — higher is better
Focus — higher is better
Soreness — lower is better
Pain — lower is better
Strength — higher is better
Creativity — higher is better
Satiety — higher is better
Digestive Comfort — higher is better
Brain Fog — lower is better
Motivation — higher is better
Productivity — higher is better
Calmness — higher is better
Social Connection — higher is better
Libido — higher is better
Skin Clarity — higher is better
Sleep Quality — higher is better
Waking Restedness — higher is better
Sleep Latency — lower is better
Endurance — higher is better
Joint Comfort — higher is better
Memory — higher is better
Emotional Resilience — higher is better
Immune Resilience — higher is better
```

### 8.3 Slider behavior

Each modality card can show relevant outcome sliders.

Rules:

```txt
Primary sliders: 2–4 max
Geek Mode extra sliders: additional relevant sliders
Pre phase: optional before-state tracking
Post phase: optional after-state tracking
If user does not move a slider, do not record data
Default visual value can show neutral 5, but no data is saved unless changed
```

### 8.4 Slider selection logic

Create a domain function later:

```txt
getSlidersForSession(userProfile, userGoals, modality, sessionContext)
```

It should return:

```txt
primary: most relevant 2–4 outcomes
geekModeExtra: additional relevant outcomes
```

Priority order:

```txt
1. Outcomes explicitly mapped to the modality
2. Outcomes aligned with user goals
3. Outcomes the user rated highly in onboarding
4. Outcomes inferred from modality tags
5. Default well-being outcomes only when relevant
```

---

## 9. Screen Views

## 9.1 Today View

Today is the default screen.

It shows a vertical stack of modality cards for the current day.

### Card order

Cards should be ordered by relative daily rhythm, not a rigid clock calendar.

Example archetypes:

```txt
waking
sunrise
morning
midday
afternoon
post_workout
post_meal
evening
sunset
pre_bed
as_needed
```

### Card summary view

Each card should show:

```txt
Modality name
Dosage / exposure summary
Time of day / rhythm archetype
Schedule pattern badge
Overall Longevity Benefit
Personal Longevity Impact
Completion state
Outcome tracking button
```

### Card interactions

```txt
Tap card body → expand modality details
Tap outcome button → open outcome slider overlay
Swipe right → mark complete
Swipe left → skip today
Tap Geek Mode → reveal advanced details
Tap Why ranked for me → call AI stub
Tap Ask / Adjust → show placeholder for future AI chat
```

### Opened Current Modality

Expanded card should show:

```txt
Description of effects and benefits
Implementation instructions
Optional image/graphic
Outcome tracking button
Safety summary
Relationship warnings
Pulsed/cyclical schedule notes if relevant
```

### Geek Mode

Geek Mode should be inside the expanded modality card.

It should show:

```txt
Hallmarks of Aging impacted
Functional outcome tags
Effect size
Level of evidence
Safety margin
Cost
Effort
Synergistic interactions
Negative interactions
Mechanism of action
Onset profile
Half-life profile, if relevant
Ideal cohort
Contraindicating cohort
Why this was included for you button
Additional relevant sliders
Ask / Adjust button
```

The Ask / Adjust button should exist in MVP but use a stub or placeholder. Do not implement real AI API logic yet.

---

## 9.2 Weekly Protocols View

The Weekly view should let users see protocols across the week.

MVP behavior:

```txt
Horizontal scroll by day
Selected day shows a vertical stack
Responsive desktop view can show week at a glance
Mobile remains the priority
```

Do not build a complex calendar grid.

The week-at-a-glance view can be lightweight.

---

## 9.3 Bench View

The Bench shows modalities the user has saved or pulled from Explore.

Bench purpose:

```txt
Candidate modalities
Saved modalities
Variations to test
Modalities from global protocols
Potential next additions
```

Sort options:

```txt
Next Best Action
Personal Longevity Impact
Overall Longevity Benefit
Lowest friction
Highest goal alignment
Recently added
```

Bench card actions:

```txt
Open details
Move to Today / Daily Stack
Keep benched
Retire / not interested
Compare variations later
```

---

## 9.4 Global Library / Explore View

Explore should contain the seed modality and protocol library.

It should leave room for LongevityReviews.org later, but should not build LongevityReviews.org now.

Sections:

```txt
Next Best Actions for You
Browse All Modalities
Featured Protocols
Influencer / Expert Protocols placeholder
Popular Protocols placeholder
```

### Explore rules

```txt
Selecting a modality adds it to Bench
Selecting a protocol adds the protocol to Bench or clones it locally
Manual protocol creation is not part of MVP
Full reviews, community, public rankings, and LongevityReviews.org-specific features are later
```

---

## 9.5 Settings View

Settings should be minimal.

Include:

```txt
Edit local profile
Edit goals
Edit functional outcome priorities
Reset demo data
Toggle Geek Mode default
Export local data placeholder
```

No account settings because there is no auth in MVP.

---

## 10. Modality Card Fields

Basic card:

```txt
Modality
Dosage / exposure
Time of day
Frequency
Schedule pattern
Overall Longevity Benefit
Personal Longevity Impact
Completion status
Outcome Tracking button
```

Expanded card:

```txt
Description of effects and benefits
Implementation instructions
Optional graphic
Safety summary
Outcome Tracking button
Relationship warnings
Pulsing/cycling details
```

Geek Mode:

```txt
Hallmarks of Aging impacted
Functional outcomes
Effect size
Level of evidence
Safety margin
Cost
Effort
Synergistic interactions
Negative interactions
Mechanism of action
Onset profile
Half-life profile
Ideal cohort
Contraindicating cohort
Why included for you
Additional relevant sliders
Ask / Adjust
```

---

## 11. Personalized Ranking Logic

The MVP should include simple heuristic ranking.

Do not overbuild AI ranking yet.

### 11.1 Internal-only personalization coefficient

Use an internal value:

```txt
LongevityPersonalizationCoefficient
```

Rules:

```txt
Starts at 1.0
Changes later based on cohort type, biomarkers, bloodwork, wearable baselines, and user response
Not shown directly to users
```

Users should see:

```txt
Personal Longevity Impact
Why this is ranked for you
Next Best Action
```

They should not see:

```txt
LongevityPersonalizationCoefficient
```

### 11.2 Personal Longevity Impact

```txt
PersonalLongevityImpact =
  OverallLongevityBenefit * LongevityPersonalizationCoefficient
```

For MVP:

```txt
LongevityPersonalizationCoefficient = 1.0
```

Later it can be adjusted by:

```txt
age cohort
sex
training status
risk profile
bloodwork
wearable data
baseline outcomes
modality response history
```

### 11.3 Next Best Action Score

Friction should lower the ranking.

Use this conceptual formula:

```txt
NextBestActionScore =
  PersonalLongevityImpact
  + GoalAlignmentBonus
  + FunctionalOutcomePreferenceBonus
  + AdherenceFitBonus
  - CostPenalty
  - EffortPenalty
  - TimePenalty
  - SideEffectRiskPenalty
  - ContraindicationPenalty
```

Where:

```txt
CostPenalty = costScore * individualWeightOfCost
EffortPenalty = effortScore * individualWeightOfEffort
TimePenalty = timeRequiredScore * individualWeightOfTime
SideEffectRiskPenalty = sideEffectRiskScore * individualWeightOfSideEffectRisk
```

### 11.4 Goal alignment

Goal alignment should include:

```txt
user selected goals
user 0–10 preference scores for functional outcomes
modality mapped functional outcomes
eventually before/after outcome response data
```

### 11.5 MVP ranking explanation

Each ranked modality should be able to show:

```txt
High expected longevity benefit
Matches your selected goal: improve sleep
Low cost
Low effort
Relevant to your priority outcome: Energy
Potential downside: may not fit your evening schedule
```

---

## 12. Risk-Factor Outcomes and Biomarkers

Do not make bloodwork or biomarker tracking a core MVP feature.

Only include risk-factor outcomes on a modality when they are clearly relevant for safety or serious risk disclosure.

Examples of risk-factor outcomes:

```txt
blood pressure
ApoB
LDL-C
triglycerides
HbA1c
fasting glucose
hs-CRP
VO2 max proxy
resting heart rate
HRV
waist circumference
```

### MVP rule

Most modalities should not show bloodwork/risk-factor fields.

Show risk-factor warnings only when relevant to safety.

Examples:

```txt
Caffeine may be relevant to blood pressure, sleep, anxiety/calmness, resting heart rate.
Sauna may be relevant to blood pressure, dehydration risk, resting heart rate, HRV.
Fasting may be relevant to glucose, medications, eating disorder history, pregnancy, training load.
Cold exposure may be relevant to blood pressure, cardiovascular risk, panic/anxiety response.
```

### Disease endpoint evidence

Disease endpoint evidence can be stored internally later, but should not be surfaced in MVP UI except as cautious evidence language.

Potential internal fields for later:

```txt
endpoint_type: incidence | mortality | hospitalization | surrogate_only
endpoint_domain: cardiovascular | cancer | diabetes | dementia | metabolic | musculoskeletal | mental_health | other
effect_summary: text
evidence_grade
confidence
citations
internal_only: true
```

For MVP, do not build a full endpoint evidence UI.

---

## 13. Pulsed, Cyclical, and Tied Modalities

The MVP should support these in the data model and lightly in the UI.

Do not build a full advanced scheduler yet.

### 13.1 Scheduling fields

Use the fields from the Universal Modality Primitive:

```txt
schedulePattern
frequency
cyclePattern
onDays
offDays
minimumInterval
maximumFrequency
pulseReason
seasonality
recoveryWindow
timingConstraints
```

### 13.2 Schedule pattern values

```txt
one_time
daily
recurring
pulsed
cyclical
seasonal
as_needed
event_based
biomarker_triggered
wearable_triggered
```

### 13.3 UI support

Cards should show a small schedule badge:

```txt
Daily
3x/week
Pulsed
Cyclical
As needed
Biomarker-triggered
```

Expanded card should show:

```txt
Why it is pulsed
Minimum interval
Maximum frequency
Recovery window
Timing constraints
```

Only when relevant.

### 13.4 Modality relationships

Support relationships in data and Geek Mode.

Fields:

```txt
requires
pairsWellWith
avoidCombiningWith
before
after
sameDayAs
notSameDayAs
synergyNotes
antagonismNotes
relationshipConfidence
```

UI should show relationship warnings when relevant:

```txt
Pairs well with: hydration
Avoid same day as: intense training, if under-recovered
Do not take after: your caffeine cutoff
May interfere with: immediate post-hypertrophy cold exposure
```

---

## 14. Longevity Score

The app may show an Overall Longevity Score, but it should be clearly a placeholder in MVP.

### MVP behavior

```txt
Show an Overall Longevity Score at the top of Today
Use simple stub logic
Label gently as estimate / prototype if needed
Do not imply clinical validity
```

Suggested display names:

```txt
LEVL Score
Protocol Strength
Longevity Stack Score
```

Avoid overclaiming that it truly measures pace of aging in MVP.

### Future behavior

Later, the score may incorporate:

```txt
modality evidence
modality adherence
bloodwork
wearables
risk factor improvements
pace-of-aging models
knowledge graph reasoning
biological age estimates
```

---

## 15. AI Integration Stubs

Include AI-facing buttons but do not implement real AI yet.

Buttons:

```txt
Why was this included for you?
Ask / Adjust
Suggest next best action
Explain Geek Mode
```

MVP behavior:

```txt
Show placeholder response
Use service stubs
Do not require API keys
Do not create API key UI
Do not call external LLM APIs
```

Recommended service stubs:

```txt
/services/ai/coachStub.ts
/services/ai/modalityQuestionStub.ts
/services/ai/protocolAdjustmentStub.ts
```

Later these can connect to environment variables:

```txt
LLM_PROVIDER
LLM_API_KEY
```

Keys are developer-configured, not user-configured.

---

## 16. Data Model Overview

This is the MVP data model. Keep it simpler than the full Universal Modality Primitive.

### 16.1 Local demo user profile

```txt
DemoUserProfile
- demoUserId
- displayName
- primaryGoals
- outcomePreferenceScores
- healthConditionsText
- medicationsAndTreatmentsText
- disciplineLevel_0_99
- experimentalOpenness_0_99
- weeklyTimeBudgetHours
- weeklySpendBudgetUsd
- chronotype
- riskTolerance
```

### 16.2 OutcomeDimension

```txt
OutcomeDimension
- id
- name
- description
- directionality
- inputType
- isDefaultWellbeing
- isContextual
- relevantModalityTypes
- goalKeys
```

### 16.3 Modality

```txt
Modality
- id
- slug
- name
- modalityType
- category
- status
- displayName
- briefDescription
- expandedWhy
- headlineBenefit
- primaryOutcome
- secondaryOutcomes
- overallLongevityBenefit
- implementationSummary
- instructions
- doseOrExposure
- timingSummary
- frequency
- schedulePattern
- difficulty
- costTier
- effortLevel
- timeToBenefit
- evidenceQuality
- effectSizeEstimate
- evidenceSummary
- safetyLevel
- safetySummary
- contraindications
- functionalOutcomesToTrack
- hallmarksOfAgingImpact
- mechanismOfAction
- onsetProfile
- halfLifeProfile
- idealCohort
- contraindicatingCohort
- relationships
- mediaAssets
- reviewStatus
- version
```

### 16.4 ModalityVariation

```txt
ModalityVariation
- variationId
- baseModalityId
- variationName
- sourceLabel
- implementationDifferences
- doseOrExposure
- timing
- frequency
- duration
- schedulePattern
- cyclePattern
- contextOfUse
- evidenceInheritance
- safetyDifferences
- trackingDifferences
- status
- createdBy
```

### 16.5 Protocol

```txt
Protocol
- protocolId
- name
- goal
- description
- modalitiesIncluded
- sequence
- timingRules
- completionLogic
- allowPartialCompletion
- protocolLevelOutcomes
- modalityLevelOutcomes
- visibility
- sourceLabel
- popularityPlaceholder
- reviewStatus
```

### 16.6 UserBenchItem

```txt
UserBenchItem
- demoUserId
- modalityId
- variationId
- protocolId
- source
- pinned
- status
- addedAt
- personalNotes
```

### 16.7 DailySession

```txt
DailySession
- sessionId
- demoUserId
- date
- modalityId
- variationId
- protocolId
- relativeTimeArchetype
- status
- completedAt
- skippedAt
- notes
```

### 16.8 OutcomeObservation

```txt
OutcomeObservation
- observationId
- demoUserId
- sessionId
- outcomeId
- phase
- value_0_10
- recordedAt
- sourceType
- notes
```

### 16.9 DailyWellbeingCheckin

```txt
DailyWellbeingCheckin
- checkinId
- demoUserId
- date
- mood_0_10
- energy_0_10
- stress_0_10
- notes
```

---

## 17. Seed Modalities

Create seed JSON files for at least these modalities:

```txt
/data/seed-modalities/morning-light-exposure.json
/data/seed-modalities/glycine-before-bed.json
/data/seed-modalities/creatine.json
/data/seed-modalities/sauna.json
/data/seed-modalities/cold-exposure.json
/data/seed-modalities/zone-2-cardio.json
/data/seed-modalities/resistance-training.json
/data/seed-modalities/post-meal-walk.json
/data/seed-modalities/protein-first-meal.json
/data/seed-modalities/blue-light-reduction.json
/data/seed-modalities/nsdr-yoga-nidra.json
```

Each seed modality should include:

```txt
name
modalityType
briefDescription
expandedWhy
primaryOutcome
secondaryOutcomes
implementationSummary
instructions
doseOrExposure
timingSummary
frequency
schedulePattern
difficulty
costTier
effortLevel
timeToBenefit
evidenceQuality
effectSizeEstimate
evidenceSummary
safetyLevel
safetySummary
contraindications
functionalOutcomesToTrack
hallmarksOfAgingImpact
mechanismOfAction
relationships
overallLongevityBenefit
reviewStatus
version
```

Use cautious, non-medical wording.

Do not overstate longevity claims.

---

## 18. Seed Protocols

Create seed protocols such as:

```txt
Morning Circadian Activation Protocol
Deep Sleep Foundation Protocol
Metabolic Health Starter Protocol
Recovery Day Protocol
Foundational Longevity Stack
```

### 18.1 Morning Circadian Activation Protocol

Includes:

```txt
Hydration placeholder
Morning Light Exposure
Light Movement placeholder
Delayed Caffeine placeholder
```

### 18.2 Deep Sleep Foundation Protocol

Includes:

```txt
Blue-Light Reduction
Glycine Before Bed
NSDR / Yoga Nidra
Consistent bedtime placeholder
```

### 18.3 Metabolic Health Starter Protocol

Includes:

```txt
Protein-First Meal
Post-Meal Walk
Zone 2 Cardio
```

### 18.4 Recovery Day Protocol

Includes:

```txt
Sauna
NSDR / Yoga Nidra
Light walk placeholder
Mobility placeholder
```

### 18.5 Foundational Longevity Stack

Includes:

```txt
Morning Light Exposure
Creatine
Zone 2 Cardio
Resistance Training
Protein-First Meal
Blue-Light Reduction
```

---

## 19. UI Direction

### 19.1 Overall feel

The app should feel:

```txt
Premium
Calm
Futuristic
Longevity-focused
Trustworthy
Dark
Clean
Mobile-first
Slightly glassy
Not medical
Not cheesy biohacker
Not generic SaaS
```

### 19.2 Visual style

Use:

```txt
Dark blue-purple / near-black background
Subtle gradients
Glassmorphism cards
Soft borders
Subtle glow for active/completed states
White text with muted secondary text
Deep green for longevity-positive indicators
Purple/blue accents
Minimal icons
Large touch targets
```

### 19.3 Card style

Cards should feel like protocol tiles.

Each card:

```txt
Rounded corners
Semi-transparent glass
Clear hierarchy
Small badges
Expandable content
Swipeable actions
Outcome overlay
Geek Mode drawer/panel
```

### 19.4 Navigation

Use simple bottom navigation on mobile:

```txt
Today
Weekly
Bench
Explore
Settings
```

Desktop can use side navigation or responsive top/bottom layout.

### 19.5 Accessibility

Use readable contrast and touch-friendly controls.

Sliders must be easy to use on mobile.

---

## 20. Future Roadmap Boundaries

### V0 / MVP

```txt
No auth
Seed data
Local demo profile
Today view
Weekly view
Bench
Explore
Outcome sliders
Daily well-being check-in
Geek Mode
Basic ranking heuristic
Seed protocols
AI buttons as stubs
Pulsed/tied modality support in data model
```

### V1

```txt
Supabase persistence
Auth
User accounts
Save real user profiles
More robust protocol editing
AI coach API integration
Modality variation testing
Better ranking logic
```

### V2

```txt
Bloodwork upload
Wearable integrations
N-of-1 experiments
Modality extraction tool
Richer biomarker/risk-factor tracking
```

### V3+

```txt
LongevityReviews.org
Public protocol reviews
Influencer/expert protocol marketplace
Third-party applets
Knowledge graph integration
Pace-of-aging models
Clinic dashboard
Developer API
```

---

## 21. Implementation Phases

### Phase 1 — Project foundation

Create:

```txt
Next.js App Router project
TypeScript
Tailwind CSS
PWA-ready structure
Seed data folders
Basic layout
Mobile bottom nav
```

Do not add auth.

### Phase 2 — Data and domain model

Create:

```txt
Outcome dimensions
Seed modalities
Seed protocols
Demo user profile
Ranking utilities
Slider selection utilities
```

### Phase 3 — Onboarding

Create lightweight local onboarding:

```txt
goals
outcome priorities
constraints
chronotype
discipline
experimental openness
budget
time
```

### Phase 4 — Today view

Create:

```txt
vertical modality stack
modality cards
completion and skip states
outcome overlay
daily well-being check-in
expanded card
Geek Mode
AI stub buttons
```

### Phase 5 — Weekly, Bench, Explore

Create:

```txt
weekly horizontal day scroll
bench list
explore library
next best action ranking
add to bench
add protocol to bench
```

### Phase 6 — Scoring and personalization stubs

Create:

```txt
Personal Longevity Impact
Next Best Action Score
internal LongevityPersonalizationCoefficient
stub LEVL Score
ranking explanation text
```

### Phase 7 — Future integration stubs

Create stubs only:

```txt
AI coach
Ask / Adjust
Longevity score
Bloodwork
Wearables
Experiments
Calendar
```

Do not wire real APIs yet.

---

## 22. Explicit Build Instructions for Antigravity

When building from this document:

1. Use `LEVL_UNIVERSAL_MODALITY_PRIMITIVE.md` as the canonical modality standard.
2. Implement only the MVP subset described here.
3. Do not build auth.
4. Do not build a full AI chat interface.
5. Do not build Supabase auth.
6. Do not build manual protocol creation yet.
7. Do not build full bloodwork or wearable integrations.
8. Do not build LongevityReviews.org yet.
9. Do create seed modalities and seed protocols.
10. Do create clean service stubs for future AI, biomarkers, wearables, experiments, and longevity scoring.
11. Do support pulsed/cyclical modalities in the data model and light UI.
12. Do support modality relationships in the data model and Geek Mode.
13. Do make the app mobile-first and responsive for desktop.
14. Do make the UI premium, dark, calm, and glassmorphic.
15. Do keep the app useful with local demo data before persistence/auth.

---

## 23. MVP Success Criteria

The MVP is successful if a user can:

```txt
Complete onboarding without signing in
View today's protocol stack
Open modality cards
Understand why a modality matters
See basic longevity benefit and personal ranking
Track daily well-being
Track relevant modality-specific outcomes
Check off or skip modalities
Open Geek Mode
Save modalities to Bench
Browse Explore
Add seed protocols/modalities to Bench
See pulsed and relationship notes when relevant
Use the app on mobile and desktop
```

The MVP is not required to:

```txt
Persist across real accounts
Run real AI
Analyze bloodwork
Sync wearables
Generate protocols from papers
Run sophisticated experiments
Publicly review protocols
Support third-party applets
```

---

## 24. Final Product Direction

Build LEVL as:

> A beautiful, mobile-first longevity protocol operating system that helps users intentionally choose, track, and improve the practices that shape their healthspan.

Do not build a generic habit tracker.

Do not build a medical dashboard.

Do not build a supplement funnel.

Build the first version of a protocol engine that can eventually support AI-guided personalization, biomarker-driven recommendations, applet ecosystems, and longevity knowledge graph integration.
