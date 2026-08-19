# LEVL Universal Modality Primitive

## 1. Purpose

The LEVL Universal Modality Primitive is the canonical standard for representing any wellness, performance, health, or longevity intervention inside LEVL.

It allows LEVL to turn papers, YouTube videos, blog posts, expert protocols, supplements, applets, user feedback, and scientific claims into structured, sourced, trackable, recommendable modalities.

A LEVL-compatible modality should be:

- Understandable to users
- Implementable in real life
- Comparable to other modalities
- Connected to evidence
- Connected to functional outcomes
- Connected to safety rules
- Compatible with protocols and stacks
- Compatible with pulsed or cyclical scheduling
- Compatible with modalities that depend on or interact with other modalities
- Compatible with future biomarker and wearable integrations
- Compatible with future third-party wellness applets
- Compatible with future longevity knowledge graphs

This document is the source of truth for the LEVL modality structure. It is not the full AI extraction prompt, but AI extraction prompts should follow this standard.

---

## 2. Core Concepts

### Modality

A **modality** is a single intervention, behavior, exposure, supplement, diagnostic action, or therapy that can be recommended, implemented, tracked, and evaluated.

Examples:

- Morning light exposure
- Sauna
- Cold plunge
- Creatine
- Glycine before bed
- Zone 2 cardio
- Resistance training
- Meditation
- Fasting
- Protein-first meal
- Blue-light reduction
- Magnesium glycinate
- Post-meal walk

### Modality Variation

A **modality variation** is a specific implementation of a base modality.

A variation may differ by:

- Dose
- Duration
- Intensity
- Timing
- Frequency
- Source or expert framing
- Equipment
- Protocol context
- User personalization

Examples:

Base modality:

- Morning light exposure

Variations:

- 10 minutes outdoor sunlight within 30 minutes of waking
- 20 minutes outdoor light on cloudy mornings
- Huberman-style morning sunlight walk
- Light therapy box protocol
- AI-adjusted morning light protocol for delayed sleep timing

AI should usually create a modality variation before creating a new canonical modality.

### Protocol

A **protocol** is a sequence, routine, or bundle of modalities designed around an outcome.

Examples:

- Morning routine
- Deep sleep protocol
- Metabolic reset protocol
- Recovery protocol
- Longevity foundation stack

### Stack

A **stack** is a user’s active set of modalities and protocols.

Examples:

- Daily Stack
- Sleep Stack
- Energy Stack
- Recovery Stack
- Biomarker Improvement Stack

### Modality Bench

The **Modality Bench** is the user’s saved or candidate set of modalities and variations.

The bench allows LEVL and the AI coach to:

- Save modalities for later
- Try different variations
- Promote modalities into the daily stack
- Retire low-performing modalities
- Compare similar modalities
- Run simple n-of-1 experiments

### Claim

A **claim** is a specific source-linked assertion about a modality.

Examples:

- Sauna may support cardiovascular health.
- Morning light exposure may support circadian rhythm.
- Glycine may improve subjective sleep quality.
- Creatine may improve strength and power output.
- Cold exposure may increase alertness acutely.

Claims should be attached to sources whenever possible.

### Source

A **source** is the origin of a claim or modality detail.

Examples:

- Scientific paper
- YouTube video
- Podcast
- Blog post
- X post
- Expert protocol
- Product label
- Supplement page
- Clinic instructions
- User-uploaded document
- Applet submission

### Functional Outcome

A **functional outcome** is a subjective or functional state the user can track.

Examples:

- Energy
- Mood
- Focus
- Sleep Quality
- Soreness
- Libido
- Skin Clarity

### Biomarker or Wearable Signal

A **biomarker or wearable signal** is an objective or semi-objective measurement that may be affected by a modality.

Examples:

- HRV
- resting heart rate
- sleep latency
- fasting glucose
- ApoB
- hs-CRP
- VO2 max
- testosterone
- biological age estimate

---

## 3. Core Modality Fields

Every LEVL-compatible modality can include the following field groups.

Not every field is required for MVP.

### 3.1 Identity

```txt
id
slug
name
shortName
modalityType
category
status
version
createdAt
updatedAt
lastReviewedAt
reviewStatus
```

Recommended `modalityType` values:

```txt
supplement
sleep_protocol
exercise
nutrition
fasting
heat_exposure
cold_exposure
light_exposure
breathwork
meditation
diagnostic_test
behavioral_protocol
prescription_supported
clinical_therapy
environmental_intervention
skincare
recovery
cognitive_training
social_behavior
```

Recommended `status` values:

```txt
draft
active
needs_review
experimental
deprecated
retired
```

Recommended `reviewStatus` values:

```txt
unreviewed
ai_drafted
editor_reviewed
expert_reviewed
clinician_reviewed
needs_update
deprecated
```

---

## 4. User-Facing Display Fields

These fields power the visible modality card in the app.

```txt
displayName
standardizedImage
briefDescription
expandedWhy
headlineBenefit
primaryOutcome
secondaryOutcomes
longevityScore
personalFitScore
timingSummary
implementationSummary
functionalOutcomesToTrack
safetySummary
mediaAssets
```

### Media Assets

Media is optional.

Use one flexible field rather than many separate media-specific fields.

`mediaAssets` may include:

```txt
image
video
implementationDemo
mechanisticPathwayGraph
audioGuide
externalEmbed
appletPreview
```

Media should enhance understanding, but a modality should not require media to be valid.

---

## 5. Implementation Fields

These fields define what the user actually does.

```txt
instructions
doseOrExposure
humanEffectiveDoseRange
frequency
timing
duration
setupRequired
equipmentRequired
requiresDevice
requiresLabTest
requiresClinician
costTier
effortLevel
difficulty
adherenceBurden
timeToBenefit
fastingCompatibility
bioavailabilityAndAbsorptionClass
bioavailabilityEnhancers
```

Recommended `costTier` values:

```txt
free
low
medium
high
premium
```

Recommended `effortLevel` values:

```txt
very_low
low
medium
high
very_high
```

Recommended `difficulty` values:

```txt
very_easy
easy
moderate
hard
advanced
```

Recommended `timeToBenefit` values:

```txt
same_day
days
weeks
months
years
unknown
```

Recommended `fastingCompatibility` values:

```txt
fasting_compatible
breaks_fast
possibly_breaks_fast
context_dependent
not_applicable
unknown
```

---

## 6. Scheduling, Pulsing, and Cycling

LEVL must support modalities that are continuous, recurring, pulsed, cyclical, seasonal, or tied to recovery windows.

### 6.1 Scheduling Fields

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

Recommended `schedulePattern` values:

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

### 6.2 Examples

Daily modality:

```txt
Modality: Creatine
schedulePattern: daily
frequency: once daily
```

Recurring modality:

```txt
Modality: Sauna
schedulePattern: recurring
frequency: 3–5x/week
minimumInterval: 12–24 hours
```

Pulsed modality:

```txt
Modality: 24-hour fast
schedulePattern: pulsed
frequency: once weekly
pulseReason: metabolic stress / fasting benefits without chronic energy restriction
```

Cyclical modality:

```txt
Modality: Intensive deload week
schedulePattern: cyclical
cyclePattern: 1 week every 4–8 weeks
pulseReason: recovery and adaptation
```

Biomarker-triggered modality:

```txt
Modality: Vitamin D supplementation adjustment
schedulePattern: biomarker_triggered
trigger: low vitamin D lab result
```

Wearable-triggered modality:

```txt
Modality: Recovery day
schedulePattern: wearable_triggered
trigger: low HRV / low recovery score / elevated resting heart rate
```

### 6.3 Pulsing Rules

Pulsed modalities should specify:

```txt
why the modality is pulsed
how often it should occur
minimum time between sessions
maximum safe frequency
whether it should be paired with recovery
whether it should be avoided near conflicting modalities
which outcomes should be tracked acutely
which outcomes should be tracked chronically
```

---

## 7. Modality Relationships

Some modalities depend on, enhance, conflict with, or should be timed around other modalities.

### 7.1 Relationship Fields

```txt
requires
pairsWellWith
avoidCombiningWith
before
after
sameDayAs
notSameDayAs
cyclingRelationship
synergyNotes
antagonismNotes
relationshipConfidence
```

### 7.2 Relationship Types

Recommended relationship types:

```txt
requires
supports
enhances
synergizes_with
conflicts_with
avoid_before
avoid_after
take_before
take_after
same_day_as
not_same_day_as
requires_recovery_after
requires_fed_state
requires_fasted_state
requires_hydration
requires_electrolytes
```

### 7.3 Examples

```txt
Protein + resistance training:
pairsWellWith: resistance_training
timing: after or near training
```

```txt
Caffeine:
avoidCombiningWith: late_day_sleep_protocol
timingConstraint: avoid after user-specific caffeine cutoff
```

```txt
Cold plunge:
avoidCombiningWith: immediately_after_hypertrophy_training
antagonismNotes: may blunt some hypertrophy signaling if used immediately after training
```

```txt
Sauna:
pairsWellWith: hydration, electrolytes
requires: heat tolerance
avoidCombiningWith: dehydration, acute illness
```

```txt
Fasting:
avoidCombiningWith: calorie-containing supplements
requires: user safety screen
```

---

## 8. Evidence, Claims, and Sources

### 8.1 Evidence Fields

```txt
evidenceQuality
humanEvidenceLevel
effectSizeEstimate
doseResponseKnown
evidenceSummary
claimList
keySources
sourceQuality
lastEvidenceReview
evidenceConfidence
```

Important distinction:

- `evidenceQuality` = how strong the evidence is
- `effectSizeEstimate` = how large the effect appears to be
- `evidenceConfidence` = how confident LEVL is in the interpretation
- `claimList` = specific source-linked claims

### 8.2 Evidence Quality Scale

```txt
1 = Mechanistic, speculative, or traditional-use only
2 = Animal, cell, or weak observational evidence
3 = Moderate human evidence or multiple small human studies
4 = Strong human evidence with relevant outcomes
5 = Strong replicated human evidence, meta-analysis, or guideline-level support
```

### 8.3 Effect Size Estimate

```txt
1 = Minimal expected effect
2 = Small but plausible effect
3 = Moderate effect for relevant users
4 = Strong effect for relevant users
5 = Large, reliable, clinically or functionally meaningful effect
```

### 8.4 Claim Fields

```txt
claimId
modalityId
variationId
claimText
claimType
targetOutcome
evidenceQuality
effectSizeEstimate
sourceIds
confidence
reviewStatus
createdBy
createdAt
updatedAt
```

Recommended `claimType` values:

```txt
functional_outcome
biomarker_outcome
wearable_signal
mechanism
safety
contraindication
synergy
antagonism
dose_response
timing
longevity
hallmark
```

### 8.5 Source-to-Modality AI Rule

When AI processes a paper, video, blog post, or other source, it should not create a separate extraction schema.

It should use the existing LEVL objects:

```txt
Source
Claim
Modality
Modality Variation
Protocol
```

AI should follow this order:

1. Identify claims.
2. Match claims to existing modalities.
3. Match implementation details to existing modality variations.
4. Add source-linked claims where useful.
5. Create a new modality variation if the implementation is distinct.
6. Create a new canonical modality only if no close modality exists.
7. Mark uncertain or AI-generated content as needing review.

AI should default to updating an existing modality or creating a source-linked claim before creating a new modality.

---

## 9. Safety Fields

```txt
safetyLevel
safetyMargin
upperLimit
contraindications
interactionRisks
adverseEventProfile
riskModifiers
whoShouldAvoid
clinicianRequired
uncertaintyFlags
medicalDisclaimer
```

Recommended `safetyLevel` values:

```txt
low_risk
moderate_risk
high_risk
clinician_required
experimental
unknown
```

Safety should consider:

```txt
adverse event profile
contraindications
drug interactions
supplement interactions
dose sensitivity
frequency sensitivity
user-specific risk modifiers
pregnancy or fertility concerns
medical conditions
need for clinician supervision
```

---

## 10. Functional Outcomes

Functional outcomes are user-facing states or capabilities that can be tracked before and/or after modalities.

### 10.1 Functional Outcome Structure

```txt
outcomeId
name
category
directionality
inputType
scaleMin
scaleMax
unit
isDefault
isContextual
isUserDefined
relevantModalityTypes
trackingPrompt
defaultTrackingWindow
```

Recommended `directionality` values:

```txt
higher_is_better
lower_is_better
range_bound
context_dependent
```

Recommended `inputType` values:

```txt
slider
number
yes_no
multiple_choice
text
timer
wearable_import
lab_value
test_result
```

### 10.2 Default Base Outcomes

Default base outcomes may be suggested when relevant, but should not be forced onto irrelevant modalities.

```txt
Mood — higher is better
Energy — higher is better
Stress — lower is better
```

### 10.3 Contextual Functional Outcomes

```txt
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

### 10.4 Outcome Assignment Rules

1. A modality should only trigger relevant outcome tracking.
2. Do not blindly apply mood, energy, and stress to every modality.
3. If a modality does not have mapped outcomes, AI may infer relevant outcomes.
4. AI-inferred outcomes should be reviewable.
5. Users may add custom outcomes.
6. Outcomes should include directionality.
7. Some outcomes are acute, while others require days, weeks, or months.

---

## 11. Tracking Fields

```txt
primaryFunctionalOutcomes
secondaryFunctionalOutcomes
requiredOutcomeTrackers
optionalOutcomeTrackers
objectiveSignals
subjectiveSignals
biomarkerSignals
wearableSignals
baselineRequired
beforeAfterTracking
trackingWindow
minimumTrackingPlan
expectedSignalWindow
acuteOutcomes
chronicOutcomes
```

### 11.1 Tracking Window Examples

```txt
Caffeine:
acuteOutcomes: alertness, focus, anxiety/calmness
trackingWindow: same_day
secondaryWindow: sleep that night
```

```txt
Glycine before bed:
acuteOutcomes: sleep quality, waking restedness
trackingWindow: next_morning
```

```txt
Creatine:
chronicOutcomes: strength, power, lean mass
trackingWindow: weeks
```

```txt
Skin protocol:
chronicOutcomes: skin clarity
trackingWindow: weeks_to_months
```

---

## 12. Biomarker and Wearable Compatibility

The MVP does not need full integrations, but modalities should be compatible with future biomarker and wearable tracking.

### 12.1 Signal Mapping Fields

```txt
signalId
signalName
signalType
sourceType
unit
directionality
expectedEffect
expectedSignalWindow
trackingFrequency
evidenceConfidence
```

Recommended `signalType` values:

```txt
functional_outcome
wearable_signal
lab_biomarker
performance_test
cognitive_test
body_measurement
image_based_signal
```

Recommended `sourceType` values:

```txt
manual
apple_health
health_connect
oura
whoop
garmin
fitbit
eight_sleep
cgm
lab_upload
quest
labcorp
function_health
inside_tracker
superpower
trudiagnostic
other
```

### 12.2 Example Wearable Signals

```txt
HRV
resting heart rate
sleep duration
sleep efficiency
sleep latency
deep sleep
REM sleep
respiratory rate
skin temperature
activity level
steps
VO2 max
training load
recovery score
readiness score
glucose
time in range
```

### 12.3 Example Biomarkers

```txt
ApoB
LDL-C
HDL-C
triglycerides
fasting glucose
fasting insulin
HbA1c
hs-CRP
homocysteine
vitamin D
ferritin
testosterone
free testosterone
SHBG
cortisol
IGF-1
ALT
AST
creatinine
eGFR
uric acid
omega-3 index
biological age estimate
pace of aging estimate
```

---

## 13. Longevity and Hallmarks of Aging Mapping

The primitive should support mapping modalities to the Hallmarks of Aging.

### 13.1 Hallmark Impact Fields

```txt
hallmarkName
impactDirection
impactScore
evidenceQuality
mechanismSummary
sourceIds
confidence
```

Recommended `impactDirection` values:

```txt
improves
worsens
mixed
unknown
not_applicable
```

Recommended `impactScore`:

```txt
0–99
```

The score estimates possible positive impact on the hallmark, not certainty.

### 13.2 Primary Hallmarks

```txt
Genomic Instability
Telomere Attrition
Epigenetic Alterations
Loss of Proteostasis
Disabled Macroautophagy
```

### 13.3 Antagonistic Hallmarks

```txt
Deregulated Nutrient Sensing
Mitochondrial Dysfunction
Cellular Senescence
```

### 13.4 Integrative Hallmarks

```txt
Stem Cell Exhaustion
Altered Intercellular Communication
Chronic Inflammation / Inflammaging
Dysbiosis
```

---

## 14. Mechanism and Knowledge Graph Fields

```txt
mechanismOfAction
mechanismSummary
mechanismConfidence
pathwayLinks
targets
biologicalProcesses
biomarkersAffected
wearableSignalsAffected
hallmarksOfAgingImpact
paceOfAgingRelevance
biologicalAgeRelevance
synergyPotential
antagonismRisk
```

`pathwayLinks` may eventually include:

```txt
GO
KEGG
Reactome
UniProt
PubMed
OpenTargets
DrugBank
Human Phenotype Ontology
Monarch Initiative
HALD or other longevity knowledge graphs
```

MVP modalities do not need complete pathway mapping.

---

## 15. Scoring Model

The primitive should preserve raw attributes and support composite scores.

### 15.1 Raw Attributes

```txt
Overall Longevity Impact
Level of Evidence
Cost
Effort
Risk / Safety
Evidence Quality
Effect Size on Target Outcomes
Safety Margin
Fasting Compatibility
Human Effective Dose Range
Synergy Potential
Contraindications and Interaction Risk
Mechanism-of-Action Pathway Links
Hallmarks of Aging Impact Vector
Antagonism Risk
Adverse Event Profile
Timing / Circadian Sensitivity
Bioavailability and Absorption Class
Bioavailability Enhancers
Dose–Response
Mechanism-of-Action and Targets
Relevant Functional Outcomes
Relevant Biomarkers
Relevant Wearable Signals
Tracking Window
Implementation Instructions
Media Assets
Source-Linked Claims
Modality Variations
Personalization Rules
Protocol Compatibility
Applet Compatibility
Commercial Relationship
Review Status
Versioning
```

### 15.2 Composite Scores

```txt
longevityScore
personalFitScore
safetyScore
implementationScore
confidenceScore
```

Composite scores are ranking and display tools. They are not medical truth.

### 15.3 Longevity Score

The Longevity Score may combine:

```txt
Level of evidence
Effect size
Safety
Hallmarks of Aging impact
Mechanistic plausibility
Relevance to pace of aging
Relevance to user goals
Personal fit modifier
Confidence modifier
```

The formula may evolve.

The score may be displayed directly or visually as a color gradient.

---

## 16. Modality Variation Fields

A modality variation is a specific implementation of a base modality.

```txt
variationId
baseModalityId
variationName
sourceLabel
implementationDifferences
doseOrExposure
timing
frequency
duration
schedulePattern
cyclePattern
equipmentRequired
contextOfUse
targetUserProfile
personalizationReason
parentVariationId
isUserSpecific
evidenceInheritance
variationEvidenceNotes
safetyDifferences
trackingDifferences
status
createdBy
createdAt
updatedAt
```

Recommended `evidenceInheritance` values:

```txt
inherits_base_evidence
partially_inherits_base_evidence
requires_separate_evidence
unknown
```

Recommended `createdBy` values:

```txt
LEVL
AI
user
expert
clinician
applet
source_ingestion
```

---

## 17. Protocol Rules

A protocol is a bundle or sequence of modalities.

### 17.1 Protocol Fields

```txt
protocolId
name
goal
description
modalitiesIncluded
sequence
timingRules
completionLogic
allowPartialCompletion
protocolLevelOutcomes
modalityLevelOutcomes
evidenceSummary
safetySummary
createdBy
reviewStatus
version
```

### 17.2 Protocol Completion Behavior

Checking off an entire protocol should check off all included modalities by default.

The user should be able to open the completed protocol and unselect modalities they did not complete.

### 17.3 Outcome Tracking Behavior

After a modality or protocol is checked off, relevant outcome trackers should appear.

Before-state trackers may also be filled in when the modality or protocol card is opened before completion.

### 17.4 Notes

Users should be able to add notes to:

```txt
A modality
A modality variation
A protocol
A completion event
An outcome observation
An experiment
```

---

## 18. User Modality State

Adherence, streaks, preferences, and retirement decisions should not live on the modality itself.

They belong to the user-modality relationship.

### 18.1 User Modality State Fields

```txt
userId
modalityId
variationId
status
addedAt
lastCompletedAt
retiredAt
adherenceRate
currentStreak
longestStreak
completionCount
skipCount
userPerceivedBenefit
userPerceivedBurden
userPreference
sideEffectsReported
notes
activeExperimentId
lastAIReviewAt
```

Recommended `status` values:

```txt
active
benched
testing
paused
retired
completed
recommended
not_interested
contraindicated
```

### 18.2 AI Coach State Rules

The AI coach may suggest:

```txt
Promote from bench to daily stack
Move from daily stack to bench
Retire modality
Try a different variation
Reduce frequency
Change timing
Add tracking
Stop due to side effects
Start n-of-1 experiment
```

The AI should consider:

```txt
Adherence
Streaks
User-reported benefit
User-reported burden
Outcome changes
Side effects
Goal relevance
Safety
User preference
Evidence quality
```

---

## 19. Completion Events

A completion event records that a user completed a modality, variation, or protocol.

```txt
completionEventId
userId
modalityId
variationId
protocolId
completedAt
scheduledFor
completionSource
completionConfidence
notes
associatedOutcomeObservationIds
associatedExperimentId
```

Recommended `completionSource` values:

```txt
manual
protocol_checkoff
applet
wearable_inferred
ai_assisted
imported
```

---

## 20. Outcome Observations

Outcome observations record subjective, functional, wearable, biomarker, or performance data.

```txt
observationId
userId
outcomeId
modalityId
variationId
protocolId
value
unit
directionality
observedAt
observationTiming
sourceType
confidence
notes
associatedCompletionEventId
associatedExperimentId
```

Recommended `observationTiming` values:

```txt
before
immediately_after
same_day
next_morning
after_days
after_weeks
after_months
baseline
follow_up
```

---

## 21. N-of-1 Experiment Compatibility

The MVP does not need advanced n-of-1 experiments, but the primitive should support them later.

### 21.1 Experiment Fields

```txt
experimentId
userId
modalityId
variationIds
protocolId
hypothesis
targetOutcomes
baselineWindow
interventionWindow
washoutWindow
comparisonType
successCriteria
status
createdAt
completedAt
```

Recommended `comparisonType` values:

```txt
before_after
variation_a_b
on_off
dose_comparison
timing_comparison
frequency_comparison
protocol_comparison
```

### 21.2 Experiment Rule

A modality defines what is reasonable to track.

The experiment object defines the actual test design for a specific user.

---

## 22. AI Coach Rules

### 22.1 AI Can

```txt
Recommend existing modalities
Recommend existing protocols
Recommend modality variations
Modify a user's stack
Move modalities between bench and daily stack
Explain why something is recommended
Summarize evidence
Suggest outcome trackers
Generate draft modality variations from sources
Generate draft modalities only when no close match exists
Flag safety concerns
Compare modalities
Suggest retirement or replacement based on adherence and outcomes
Suggest pulsed or cyclical timing when appropriate
Suggest modality relationship warnings
```

### 22.2 AI Cannot

```txt
Invent citations
Create medical claims without sources
Ignore contraindications
Recommend high-risk modalities without warning
Create duplicate modalities when a close match exists
Treat weak evidence as strong evidence
Rank LEVL products higher because LEVL sells them
Override safety rules
Diagnose disease
Promise treatment or cure
```

### 22.3 AI-Created Content

AI-created modalities, variations, claims, and recommendations should include:

```txt
createdBy = AI
confidence
reviewStatus
sourceIds where available
```

AI-generated content should be reviewable before becoming canonical.

---

## 23. Applet Compatibility Contract

The LEVL primitive should enable an economy of compatible wellness applets.

### 23.1 Applets May Read

```txt
Public modality data
Public variation data
Protocol structure
Allowed outcome trackers
User-selected goals, with permission
User active stack, with permission
Relevant tracking history, with permission
Scheduled modalities, with permission
```

### 23.2 Applets May Write

```txt
Completion events
Outcome observations
Notes
Suggested protocol adjustments
Suggested modality variations
Source links
User preferences
```

### 23.3 Applet Permission Levels

```txt
read_public_modality_data
read_user_stack
read_user_tracking_history
write_completion_event
write_outcome_observation
write_note
suggest_protocol_change
suggest_modality_variation
suggest_new_modality
request_sensitive_health_data
```

### 23.4 Applet Rules

1. Applets must map to existing modality IDs where possible.
2. Applets may suggest new modality variations.
3. Applets should not silently create canonical modalities.
4. Applets must preserve source provenance where applicable.
5. Applets cannot override safety rules.
6. Applets must use LEVL's outcome ontology or clearly define custom outcomes.
7. Applets must label content as user-generated, applet-generated, AI-generated, expert-reviewed, or clinician-reviewed.

---

## 24. Commerce and Conflict Rules

LEVL products may be included as modalities.

```txt
commercialRelationship
soldByLEVL
affiliateRelationship
sponsored
expertPaidRelationship
clinicianReviewed
conflictDisclosure
```

Rules:

1. LEVL products must follow the same evidence, safety, and scoring rules as non-LEVL modalities.
2. Commercial relationship should be disclosed.
3. Commercial interest must not override safety or evidence ranking.
4. If LEVL sells a recommended modality, the UI should disclose it.
5. Relevant non-commercial or lower-cost alternatives should be shown when appropriate.
6. Paid applets, sponsored protocols, or affiliate-linked modalities must be labeled.

---

## 25. MVP Required Fields

For MVP, every modality should include:

```txt
id
slug
name
modalityType
status
briefDescription
expandedWhy
primaryOutcome
secondaryOutcomes
implementationSummary
instructions
timingSummary
frequency
schedulePattern
difficulty
costTier
effortLevel
timeToBenefit
evidenceQuality
evidenceSummary
safetyLevel
safetySummary
contraindications
functionalOutcomesToTrack
minimumTrackingPlan
keySources
reviewStatus
version
```

Every MVP modality does not need:

```txt
Full pathway links
Full biomarker mapping
Full wearable mapping
Full Hallmarks of Aging scoring
Full dose-response modeling
Full synergy graph
Full applet integration
Full n-of-1 experiment support
```

Those can be optional and expanded over time.

---

## 26. Naming Conventions

Use clear camelCase field names in code.

Use human-readable labels in the UI.

Avoid multiple fields that mean the same thing.

Prefer:

```txt
evidenceQuality over LoE
effectSizeEstimate over effectSizeStd
safetyMargin over UL_NOAEL_ratio
fastingCompatibility over breaksFast
mechanismOfAction over moa
pathwayLinks over GO_KEGG_Reactome_links
hallmarksOfAgingImpact over hallmarkVector
costTier over cost
effortLevel over effort
timeToBenefit over benefitTiming
schedulePattern over frequencyType
modalityVariation over duplicate modality names
```

Abbreviations can appear in descriptions, but not as primary field names unless they are widely understood by users or developers.

---

## 27. Recommendation Rules

The app should not recommend a modality purely because it is popular.

Recommendation logic should consider:

```txt
User goal fit
Evidence quality
Expected effect size
Safety profile
Contraindications
User constraints
Cost
Effort
Difficulty
Time to benefit
Interaction risk
Tracking feasibility
Adherence history
User preference
Prior outcome response
Schedule compatibility
Relationship to other active modalities
```

### 27.1 Recommendation Outputs

AI or system recommendations should explain:

```txt
Why this is recommended
What outcome it targets
How strong the evidence is
How quickly the user might notice an effect
What to track
What risks or caveats exist
Whether this is a canonical modality or a variation
Whether the modality is continuous, recurring, pulsed, cyclical, or event-based
Whether it should be paired with or separated from other modalities
```

---

## 28. Governance and Versioning

This document is the canonical source of truth for the LEVL Universal Modality Primitive.

Any schema change should update:

```txt
This Markdown file
TypeScript types
Zod validation schemas
Supabase schema or migrations
Seed modality data
Affected UI components
AI prompts that generate or edit modalities
Applet compatibility documentation
```

### 28.1 Versioning Rules

1. New optional fields may be added without breaking existing modalities.
2. Required fields should change rarely.
3. Deprecated fields should remain readable until migration is complete.
4. AI should not invent new canonical fields without explicit approval.
5. Modality variations should be preferred over duplicate modalities.
6. Source-linked claims should be preferred over unsourced field changes.
7. Human or expert review should be required before AI-generated draft content becomes canonical.

---

## 29. Example Modality

```txt
name: Morning Light Exposure
modalityType: light_exposure
schedulePattern: daily
primaryOutcome: Sleep Quality
secondaryOutcomes:
  - Alertness
  - Mood
  - Energy
  - Circadian Alignment

briefDescription:
  Outdoor light exposure soon after waking to support circadian rhythm, alertness, and sleep timing.

implementationSummary:
  Get outdoor light in your eyes, without looking directly at the sun, soon after waking.

timingSummary:
  Within 30–60 minutes of waking.

frequency:
  Daily or most days.

difficulty:
  easy

costTier:
  free

effortLevel:
  low

timeToBenefit:
  days

evidenceQuality:
  3

safetyLevel:
  low_risk

functionalOutcomesToTrack:
  - Sleep Quality
  - Waking Restedness
  - Alertness
  - Energy
  - Mood

wearableSignals:
  - sleep latency
  - sleep duration
  - sleep efficiency
  - HRV

variations:
  - 10 minutes outdoor sunlight within 30 minutes of waking
  - 20 minutes cloudy-day outdoor light
  - Light therapy box protocol
  - Huberman-style morning sunlight walk
```

---

## 30. Example Pulsed Modality

```txt
name: 24-Hour Fast
modalityType: fasting
schedulePattern: pulsed
frequency: once weekly or as tolerated
cyclePattern: 1 day on, 6+ days off
minimumInterval: 5–7 days
maximumFrequency: context dependent
pulseReason:
  Intended as an intermittent metabolic stressor rather than a daily behavior.

primaryOutcome:
  Metabolic Health

secondaryOutcomes:
  - Satiety
  - Energy
  - Mental Clarity
  - Weight Management

fastingCompatibility:
  fasting_compatible

relationships:
  requires:
    - hydration
    - electrolytes if needed
  avoidCombiningWith:
    - intense training if under-recovered
    - calorie-containing supplements
  pairsWellWith:
    - gentle walking
    - sleep-supportive routine

tracking:
  - Energy
  - Mood
  - Hunger / Satiety
  - Sleep Quality
  - HRV
  - resting heart rate
  - glucose if available
```

---

## 31. Example Protocol

```txt
name: Morning Circadian Activation Protocol

goal:
  Improve alertness, mood, energy, and sleep timing.

modalitiesIncluded:
  - Hydration
  - Morning Light Exposure
  - Light Movement
  - Delayed Caffeine

sequence:
  1. Hydration after waking
  2. Outdoor light exposure
  3. Light movement
  4. Delay caffeine 60–90 minutes if tolerated

completionLogic:
  Checking off the protocol checks off all included modalities by default.
  User can unselect modalities not completed.

protocolLevelOutcomes:
  - Energy
  - Alertness
  - Mood
  - Sleep Quality
  - Waking Restedness

notes:
  User may add protocol-level notes or modality-specific notes.
```

---

## 32. Final Rule

The LEVL Universal Modality Primitive should make every modality:

```txt
Understandable to users
Useful in the app
Comparable to other modalities
Grounded in sources
Safe to recommend
Possible to track
Possible to personalize
Possible to pulse, cycle, or schedule
Possible to relate to other modalities
Possible to combine into protocols
Possible to convert from unstructured content
Possible to connect to biomarkers and wearables
Possible to expose to third-party applets
Possible to integrate into a future longevity knowledge graph
```

The primitive should be powerful, but the MVP should stay lean.

Start with a small number of excellent modalities and expand depth over time.

---

## 33. Protocol-Modality Dosing & Literature Specification Standard

When any modality is linked to an expert or clinical protocol (e.g., Huberman, Attia, Longo, Blueprint, Patrick, Brecka), the following rules MUST be enforced:

1. **Modality-Specific Protocol Notes**:
   Protocol instructions, notes, and execution details MUST be 100% specific to that exact modality. NEVER use generic parent protocol overviews.

2. **Mandatory Execution Parameters**:
   All modality protocol specs MUST include exact physical & chemical parameters:
   - **Temperature**: (e.g. `50°F–55°F / 10°C–13°C` for cold plunge; `174°F+` for sauna)
   - **Exact Dosing / Intake**: (e.g. `20mg/kg Fisetin + 1,000mg Quercetin + 1 tbsp EVOO`)
   - **Duration & Frequency**: (e.g. `2–3 mins per session`, `11 mins total weekly`)
   - **Administration & Synergy Notes**: (e.g. *"Søberg Principle natural warm-up"*, *"Delay caffeine 90-120m"*)

3. **Source Material & PubMed Links**:
   Every protocol modality MUST link directly to its verified PubMed paper or official author protocol documentation URL.

4. **Strict Protocol Attribution**:
   Bryan Johnson 2026 Blueprint presets MUST ONLY be attached to modalities officially present in Bryan Johnson's 2026 stack list.
