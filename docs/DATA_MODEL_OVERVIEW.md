# LEVL Protocols App — Data Model Overview

The data model is built on top of Supabase PostgreSQL and is designed around the LEVL Universal Modality Primitive.

## Core Entities

### LocalUserIdentity & UserProfile
- In the MVP, authentication is bypassed. A `local_user_id` (UUID) is generated and stored in `localStorage`.
- **UserProfile**: Stores the user's `local_user_id`, display name, primary goals, functional outcome priorities, constraints (time, spend), chronotype, risk tolerance, and an internal `longevity_personalization_coefficient` used for ranking. Bloodwork and sensitive fields are omitted from MVP.

### OutcomeDimension
- Defines the trackable functional outcomes and well-being dimensions (e.g., Mood, Energy, Sleep Latency, Focus).
- Determines directionality (higher/lower is better) and whether the outcome is a default wellbeing dimension or contextual.

### Modality & ModalityVariation
- **Modality**: The canonical representation of an intervention (e.g., "Sauna", "Creatine"). Contains fields for outcomes, evidence quality, effect size, safety, implementation instructions, scheduling patterns (including pulsed/cyclical), and Geek Mode data (Hallmarks of aging, cohorts).
- **ModalityVariation**: Specific implementations (e.g., "Huberman-style morning sunlight walk"). Inherits base traits but overrides dose, timing, and schedule.

### Protocol & ProtocolStep
- **Protocol**: A bundled sequence of modalities designed around a goal (e.g., "Morning Circadian Activation").
- **ProtocolStep**: Joins a protocol to a modality/variation, defining ordering and required status.

### ModalityRelationship, ModalityClaim, & ModalitySource
- **ModalityRelationship**: Defines synergies and antagonisms between modalities (e.g., Protein pairs well with resistance training).
- **ModalityClaim**: A specific source-linked assertion about a modality's effect on an outcome.
- **ModalitySource**: The origin of a claim (paper, video, podcast).

### User Interaction Entities
- **UserBenchItem**: Modalities or protocols saved by the user for later consideration.
- **DailySession**: Tracks the planned, completed, or skipped state of a modality instance on a given date for a specific user.
- **OutcomeObservation**: Records the user's tracked slider values linked to a session or a standalone check-in.
- **DailyWellbeingCheckin**: Tracks baseline daily dimensions (Mood, Energy, Stress).

## Ranking & Personalization
Ranking uses a `NextBestActionScore` heuristic:
- Combines `OverallLongevityBenefit` with the user's `LongevityPersonalizationCoefficient` (internal, default 1.0).
- Applies bonuses for goal alignment and functional outcome preference.
- Applies penalties for friction (cost, time, effort) and contraindications.
