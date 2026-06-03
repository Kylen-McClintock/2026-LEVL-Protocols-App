# LEVL Protocols App — Implementation Plan

This document outlines the step-by-step strategy for building the MVP.

## Phase 0: Project Documentation (Complete)
- Generate core architecture and UX documents referencing the PRD and Universal Modality Primitive.

## Phase 1: Project Foundation
- Initialize Next.js App Router (TypeScript, Tailwind, ESLint).
- Establish folder structure: `/app`, `/components`, `/lib`, `/services`, `/supabase`.

## Phase 2: Supabase Client & Local User Setup
- Configure Supabase client in `/lib/supabase/client.ts`.
- Implement `getLocalUserId.ts` to manage the local user identity (`localStorage`) and bypass Supabase Auth.

## Phase 3: Supabase Schema & Seed Data
- Write migration `0001_initial_levl_protocols_schema.sql` encompassing all core tables.
- Implement `seed.sql` populated with base outcomes (Mood, Energy, etc.), seed modalities (Sauna, Cold Exposure, etc.), and protocols.

## Phase 4: Data Access Layer
- Create repository-style functions in `/lib/data/` to interact with Supabase (e.g. `getModalities()`, `createDailySession()`).

## Phase 5: Domain Logic & Ranking
- Define TypeScript types mapped to the Supabase schema.
- Build `NextBestAction` ranking heuristics in `/lib/ranking/nextBestAction.ts`.
- Build slider resolution logic in `/lib/outcomes/getSlidersForSession.ts`.

## Phase 6: UI Foundation
- Configure Tailwind theme (colors, fonts, glassmorphism utilities).
- Build the main app layout and mobile bottom navigation.

## Phase 7: Onboarding Flow
- Build the multi-step onboarding wizard capturing user context.
- Create user profile in Supabase using the local UUID.

## Phase 8: Today View & Modality Cards
- Build the vertical stack layout.
- Implement swipe gestures and expanding card mechanics.

## Phase 9: Outcome Tracking
- Build slider components for daily wellbeing and modality-specific check-ins.
- Hook up data mutation functions.

## Phase 10: Geek Mode
- Add the detailed view inside expanded cards parsing complex modality fields (hallmarks, relationships, interactions).

## Phase 11: Bench View
- Build the bench interface to list and manage saved interventions.

## Phase 12 & 13: Explore & Weekly Views
- Build Explore to list the global library and next best actions.
- Build Weekly for horizontal day-by-day navigation.

## Phase 14: Future Service Stubs
- Scaffold files in `/services` (AI, wearbles, bloodwork) returning mocked/placeholder responses to prep for V1/V2.
