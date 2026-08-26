<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:3rd-party-integration-rules -->
# 3rd Party Integrations

Do not assume internal knowledge is up to date when it comes to important integrations with 3rd parties. You MUST research the most recent documentation (e.g. looking in node_modules, official websites, or via web search) before writing code that relies on external SDKs or APIs.
<!-- END:3rd-party-integration-rules -->

<!-- BEGIN:supabase-workflow-rules -->
# Supabase Workflow

This project connects to a **remote, cloud-hosted Supabase instance** (see `.env.local`). 
Do NOT instruct the user to run local Docker-dependent Supabase CLI commands like `npx supabase db reset` or `npx supabase start`.
Always provide SQL scripts that the user can manually copy and paste into their Supabase Dashboard SQL Editor.
<!-- END:supabase-workflow-rules -->

<!-- BEGIN:modality-protocol-dosing-rules -->
# Modality & Protocol Dosing Standards

1. **Modality-Specific Protocol Notes**:
   When attaching any modality to a protocol (or seeding protocol steps/dosage profiles), protocol instructions and notes MUST be 100% specific to that exact modality. NEVER use generic parent protocol overviews.

2. **Mandatory Dosing Parameters**:
   All modality protocol specs MUST include exact parameters:
   - **Temperature**: (e.g. `50°F–55°F / 10°C–13°C` for cold plunge; `174°F+` for sauna)
   - **Exact Dosing**: (e.g. `20mg/kg Fisetin + 1,000mg Quercetin + 1 tbsp EVOO`)
   - **Duration & Frequency**: (e.g. `2–3 mins per session`, `11 mins total weekly`)
   - **Administration & Synergy Notes**: (e.g. *"Søberg Principle natural warm-up"*, *"Delay caffeine 90-120m"*)

3. **Source Material & PubMed Links**:
   Every protocol modality MUST link to its verified PubMed paper or official protocol documentation URL.

4. **Strict Protocol Attribution**:
   Bryan Johnson 2026 Blueprint presets MUST ONLY be attached to modalities officially in Bryan Johnson's 2026 stack list.
<!-- END:modality-protocol-dosing-rules -->

<!-- BEGIN:design-and-functionality-preservation-rules -->
# Design Choices & Functionality Preservation

1. **Confirm Design Choices & Feature Changes**:
   Always consult the user and confirm design choices, UI layout shifts, and workflow changes.
   
2. **Never Delete or Silently Alter Existing Functionality**:
   Never remove, replace, or simplify existing capabilities, modals, or user workflows without explicit user confirmation.

3. **Tool Permission Hygiene (No Permission Spam)**:
   Avoid triggering repetitive tool cascades (such as granular browser subagents that generate 30+ sequential micro-action permission dialogs). Keep operations batched, direct, and efficient so the user is never bombarded with dozens of IDE confirmation prompts.
<!-- END:design-and-functionality-preservation-rules -->

<!-- BEGIN:end-to-end-state-lifecycle-rules -->
# End-to-End State Lifecycle & Future-Day Synchronization Standards

1. **Full Vertical State Lifecycle Tracing**:
   Whenever building or modifying any user control, modal, or input (e.g. dosage pills, timing dropdowns, session frequencies, cadence/rest days):
   - **Step 1 (UI State)**: Modal internal state & user interactions.
   - **Step 2 (Contract Serialization)**: Output string/payload MUST use standardized, shared serialization helpers—never ad-hoc or mismatched string patterns.
   - **Step 3 (Database Persistence)**: Updates MUST update both JSONB details AND dedicated top-level columns (e.g. `timing_slot`), and MUST update all affected future rows across Supabase—never just the single active task ID.
   - **Step 4 (Query Selection)**: All data fetchers (`getDailyProtocolTasks`, `getMultiDayProtocolTasks`, `getProtocolTasksHistory`) MUST explicitly SELECT all override columns (e.g. `custom_dose, custom_timing, notes` from `user_bench_items`).
   - **Step 5 (In-Memory Hydration)**: `hydrateTasksInMemory` MUST guarantee user overrides take precedence over static modality defaults across all dates and views.
   - **Step 6 (Timeline & Multi-Dose Grouping)**: Parsers (e.g. `parseMultiDoseTimingSlots`) MUST match the serialized formats and dynamically place each split session into its intended time block.

2. **Idempotent Schedule & Rest Day Reconciliation**:
   When recurring cadence, days of the week, or rest intervals change, always run a full future-schedule reconciliation (`reconcileModalityScheduleAndFutureTasks`):
   - Prune/deactivate uncompleted pending tasks on rest days.
   - Insert missing task rows on newly scheduled active days.
   - Propagate updated custom dosage, custom timing, and timing slots across all active future dates.
<!-- END:end-to-end-state-lifecycle-rules -->
