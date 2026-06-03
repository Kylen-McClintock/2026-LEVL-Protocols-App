# LEVL Protocols App — Information Architecture

## App Routes Hierarchy

### `/onboarding`
- Lightweight profile creation flow.
- Collects primary goals, functional outcome priorities, and constraints.
- Generates `local_user_id`.
- Routes to `/today` upon completion.

### `/` (Root)
- Auto-redirects. If `local_user_id` exists in `localStorage`, redirects to `/today`. Otherwise, redirects to `/onboarding`.

### `/today` (Primary View)
- Vertical stack of modality cards ordered by relative daily rhythm.
- Primary interaction surface for completing/skipping sessions and tracking outcomes.

### `/weekly`
- Horizontal scroll by day to view past completions and future planned stacks.
- Desktop view provides a broader week-at-a-glance.

### `/bench`
- Repository of saved candidate modalities and protocols.
- Sortable by Next Best Action, friction, and goals.
- Interface to move a benched item into the daily stack.

### `/explore`
- Global library of modalities and protocols.
- Sections for "Next Best Actions for You", "Featured Protocols", and "Browse All".
- Adding from explore adds to the bench.

### `/settings`
- Minimal configuration for the MVP.
- Edit profile details, reset demo data, toggle Geek Mode default.

### `/modalities/[id]`
- Standalone view for a specific modality.
- Displays full details, Geek Mode stats, claims, and relationships.

### `/protocols/[id]`
- Standalone view for a specific protocol.
- Lists the steps and combined benefits.
