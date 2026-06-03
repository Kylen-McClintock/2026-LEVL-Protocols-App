# LEVL Protocols App — Feature Roadmap

## V0 / MVP (Current)
- **Local Persistence & Demo Data**: Uses a `local_user_id` stored in `localStorage` mapped to a Supabase database. No authentication required.
- **Onboarding Flow**: Collect goals, outcomes, constraints, and biological data (chronotype, time budget).
- **Today View**: Vertical stack of daily modalities organized by daily rhythm archetypes.
- **Daily Check-In**: Track wellbeing dimensions like Mood, Energy, Stress.
- **Outcome Sliders**: Track modality-specific functional outcomes directly from the Today view.
- **Geek Mode**: Expand modality cards to view detailed mechanisms, hallmarks of aging, synergies, and evidence levels.
- **Bench View**: Save candidate modalities and protocols.
- **Explore View**: Browse the global library of seed modalities and protocols and view personalized "Next Best Actions".
- **Basic Personalization**: Ranking uses heuristics based on user goals, functional outcomes, friction (cost, time, effort), and internal `LongevityPersonalizationCoefficient`.
- **Modality Primitives**: Supports pulsed and cyclical scheduling in data structure.

## V1 (Near Term)
- **Authentication**: Implementation of Supabase Auth to persist user profiles across devices.
- **RLS**: Row-Level Security added to all Supabase tables for data privacy.
- **Manual Protocol Builder**: Allow users to drag-and-drop modalities into custom stacks and set specific schedules.
- **AI Coach Interface**: A functional chat interface replacing the stubs.
- **Biomarker Expansion**: Let users log specific lab values manually.

## V2 (Medium Term)
- **Bloodwork Upload**: Secure extraction and integration of PDF lab results (e.g. from Quest/Labcorp).
- **Wearable Integrations**: Sync with Oura, Apple Health, Whoop, etc., to automate completion and biometric outcomes.
- **Full Modality Extraction Tool**: AI-driven extraction from papers and YouTube videos into Universal Modality Primitives.
- **n-of-1 Experiment Engine**: Structured A/B testing of modalities against biomarker/wearable outcomes.

## V3+ (Long Term)
- **LongevityReviews.org**: Public directory of modalities with community ratings, n-of-1 experiment aggregated results, and expert protocols.
- **Knowledge Graph Integration**: Tie modalities directly to a deep biomedical knowledge graph for pathway modeling.
- **Applet Marketplace**: Let 3rd party developers build specific modality workflows (e.g., custom HRV breathwork timers).
- **Clinical Dashboard**: Interface for clinicians to review patient compliance and biomarker trends.

## Explicit Non-Goals for MVP
- Do not build auth or login walls.
- Do not require API keys for LLMs.
- Do not build a complex calendar view.
- Do not include bloodwork tracking or sensitive data uploads.
- Do not build the public LongevityReviews.org site.
