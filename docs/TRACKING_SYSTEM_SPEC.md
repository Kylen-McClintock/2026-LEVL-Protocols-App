# LEVL Protocols: Outcome Tracking & Modality System Specification

This specification documents the canonical behavior, data flow, and UI rules for the LEVL Protocols tracking architecture.

---

## 1. Outcome Tracking & Modality System Rules

### A. Individual Modality Completion
- **Removed Action**: The extra `[ ✓ Now ]` instant completion button is removed from `ProtocolTaskCard`.
- **Primary Completion Flow**:
  - Clicking `[ Complete ]` / `[ Complete & Track ]` on a card opens the inline outcome tracking panel.
  - **Default Phase View**: Opens directly to **`[ After Modality ]`** (`post`) phase sliders.
  - **Phase Switcher**: Includes an inline tab toggle (`[ After Modality ]` | `[ Before Modality ]`) allowing the user to view and edit `pre` baseline ratings—even if those baseline ratings were already populated from Group Tracking.
  - **Action Buttons**:
    - `[ Save Observations & Complete ]`: Saves `post` (and any edited `pre`) ratings to Supabase and marks the modality `completed`.
    - `[ Skip Tracking & Complete ]`: Marks the modality `completed` in Supabase without requiring rating changes.
- **Undo Completion**:
  - Clicking `Undo` on a completed card cleanly sets task status back to `pending` in Supabase and restores interactive log buttons.

---

### B. Time-Block & Protocol Group Tracking (`⚡ Track Group`)
- **Availability**:
  - **Chronological View**: Rendered on all timed block headers (Morning, Midday, Afternoon, Evening, Bedtime). **EXCLUDED from the "Anytime" group**.
  - **Protocol View**: Rendered on all Protocol headers (e.g. "Longevity Protocol", "Daily Stack").
- **Default Phase**:
  - Inspects observations recorded **today** (`checkin_date === dateStr`).
  - If no baseline exists today: Defaults to **`[ Before Stack ]`**.
  - If a baseline exists today: Defaults to **`[ After Stack ]`**.
- **Neutral Untracked Sliders**: Untracked sliders render in neutral grey (`#6B7280`), displaying badge **`Unset`** and score **`Unset`**. Only explicitly touched sliders are saved to Supabase.
- **Save & Apply Behavior**:
  - Saves `pre` or `post` outcome observations to Supabase `outcome_observations` for all target task UUIDs in the group.
  - Triggers an observation refresh so baseline ratings immediately flow down to individual cards as `⚡ Baseline: X/10`.
  - **CRITICAL**: **Does NOT mark modalities completed**. Tasks remain in `pending` status until completed individually.

---

### C. Completed Modalities Section (Minimalist Grouping)
- Located at the bottom of the page in the Completed Modalities section.
- Displays completed items in a **super minimalist, sleek grouped container**.
- **Grouping Alignment**:
  - **Chronological View Mode**: Grouped by time slot headers (Morning, Midday, Evening, Bedtime).
  - **Protocol View Mode**: Grouped by Protocol Name headers.

---

## 2. Technical Data Principles & UUID Safety
- **UUID Resolution**: `DedupedTask` maintains `original_tasks: DailyProtocolTask[]` to resolve actual database UUIDs.
- **Supabase Query Safety**: All task status updates and observation functions validate UUID syntax regex (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) before executing PostgreSQL queries.
- **Clean Timing Slot Assignment**: Tasks group strictly by `task.timing_slot || task.protocol_step?.timing_slot || 'anytime'`. Keyword auto-overrides are excluded.
