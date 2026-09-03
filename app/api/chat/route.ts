import { google } from '@ai-sdk/google';
import { streamText, tool, embed, convertToModelMessages, UIMessage } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const maxDuration = 30;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { messages, localUserId, clientContext } = await req.json();
    console.log("INCOMING MESSAGES FROM CLIENT:", JSON.stringify(messages, null, 2));

    // Fetch comprehensive health profile, bloodwork labs, BioAge scores, routine, and bench data
    let userContextPrompt = ''
    if (localUserId || clientContext) {
      try {
        const todayStr = new Date().toISOString().split('T')[0]

        let profileData = clientContext?.profile || null
        let panels = clientContext?.panels || []
        let bRecords = clientContext?.biomarkers || []
        let bioMeas = clientContext?.biologicalMeasurements || []
        let benchData = clientContext?.benchItems || []
        let todayTasksData = clientContext?.todayTasks || []
        let checkinData = clientContext?.checkin ? [clientContext.checkin] : []

        if (localUserId && supabase) {
          const [
            { data: dbProfile },
            { data: dbPanels },
            { data: dbRecords },
            { data: dbBench },
            { data: dbToday },
            { data: dbCheckins }
          ] = await Promise.all([
            supabase.from('user_profiles').select('*').eq('local_user_id', localUserId).maybeSingle(),
            supabase.from('user_lab_panels').select('*').eq('user_id', localUserId).order('collection_date', { ascending: false }).limit(5),
            supabase.from('biomarker_measurements').select('*').eq('user_id', localUserId).order('collection_date', { ascending: false }).limit(100),
            supabase.from('user_bench_items').select('*, modality:modalities(*), protocol:protocols(*)').eq('local_user_id', localUserId),
            supabase.from('daily_protocol_tasks').select('*, modality:modalities(*), protocol_step:protocol_steps(*, modality:modalities(*))').eq('local_user_id', localUserId).eq('date', todayStr),
            supabase.from('daily_wellbeing_checkins').select('*').eq('local_user_id', localUserId).order('checkin_date', { ascending: false }).limit(3)
          ])

          if (!profileData) profileData = dbProfile
          if (panels.length === 0 && dbPanels) panels = dbPanels
          if (bRecords.length === 0 && dbRecords) bRecords = dbRecords
          if (benchData.length === 0 && dbBench) benchData = dbBench
          if (todayTasksData.length === 0 && dbToday) todayTasksData = dbToday
          if (checkinData.length === 0 && dbCheckins) checkinData = dbCheckins
        }

        let profileSummary = 'Profile Not Configured Yet'
        if (profileData) {
          profileSummary = `
- Chronological Age: ${profileData.age ?? 'Not specified'}
- Biological Sex: ${profileData.biological_sex ?? 'Not specified'}
- Body Fat %: ${profileData.body_fat_percentage ?? 'Not specified'}%
- Dietary Pattern: ${profileData.dietary_pattern ?? 'Standard'}
- Primary Goals: ${Array.isArray(profileData.primary_goals) ? profileData.primary_goals.join(', ') : 'General Longevity'}
- Weekly Spend Budget: $${profileData.weekly_spend_budget_usd ?? 'Flexible'}
- Weekly Time Budget: ${profileData.weekly_time_budget_hours ?? 'Flexible'} hours
- Risk Tolerance: ${profileData.risk_tolerance ?? 'Moderate'}
- Discipline Level: ${profileData.discipline_level_0_99 ?? 50}/100
- Experimental Openness: ${profileData.experimental_openness_0_99 ?? 50}/100
- Outcome Preferences & Negative Risk Factors: ${JSON.stringify(profileData.outcome_preference_scores || {})}`
        }

        let bloodworkSummary = 'No Bloodwork / Lab Panels Uploaded Yet'
        if (bRecords && bRecords.length > 0) {
          const latestPanel = panels && panels.length > 0 ? panels[0] : null
          const bioOutputs = latestPanel?.bioage_outputs

          bloodworkSummary = `
- Latest Panel Collection Date: ${latestPanel?.collection_date || 'Recent'} (Provider: ${latestPanel?.provider_name || 'Lab Panel'})
- Phenotypic BioAge: ${bioOutputs?.pheno_age || 'Calculated'} (Age Gap: ${bioOutputs?.pheno_age_gap || 'N/A'})
- KDM Biological Age: ${bioOutputs?.kdm_age || 'Calculated'} (Age Gap: ${bioOutputs?.kdm_age_gap || 'N/A'})
- Homeostatic Dysregulation Score: ${bioOutputs?.hd_score || 'N/A'}
- Measured Biomarkers (${bRecords.length} lab records available):
${bRecords.map((b: any) => `  • ${b.raw_name || b.biomarker_id}: ${b.normalized_value ?? b.raw_value} ${b.normalized_unit || b.raw_unit || ''} (Flag: ${b.lab_flag || 'normal'})`).join('\n')}`
        }

        let physSummary = 'No physiological age assessments recorded yet'
        if (bioMeas && bioMeas.length > 0) {
          physSummary = bioMeas.map((m: any) => `  • ${m.measurement_id || m.name}: ${m.value} ${m.unit || ''}`).join('\n')
        }

        let todaySummary = 'No modalities scheduled in Today routine yet'
        if (todayTasksData && todayTasksData.length > 0) {
          const names = todayTasksData.map((t: any) => {
            const m = t.modality || t.protocol_step?.modality
            return m ? m.name : 'Custom Modality'
          })
          todaySummary = names.join(', ')
        }

        let benchSummary = 'No modalities saved on Bench yet'
        if (benchData && benchData.length > 0) {
          const names = benchData.map((b: any) => {
            if (b.modality) return `Modality: ${b.modality.name}`
            if (b.protocol) return `Protocol: ${b.protocol.name}`
            return 'Bench Item'
          })
          benchSummary = names.join(', ')
        }

        let checkinSummary = 'No recent daily check-ins logged'
        if (checkinData && checkinData.length > 0) {
          const latest = checkinData[0]
          checkinSummary = `Date: ${latest.checkin_date} | Mood: ${latest.mood_0_10 ?? 'N/A'}/10 | Energy: ${latest.energy_0_10 ?? 'N/A'}/10 | Stress: ${latest.stress_0_10 ?? 'N/A'}/10 | Sleep: ${latest.subjective_sleep_0_10 ?? 'N/A'}/10 | Logged Exposures: ${JSON.stringify(latest.custom_outcomes_jsonb || {})}`
        }

        userContextPrompt = `\n\n=== USER'S COMPLETE PERSONAL HEALTH, LAB & ROUTINE DATA ===
👤 USER PROFILE:
${profileSummary}

🩸 BLOODWORK & BIOMARKERS:
${bloodworkSummary}

🏋️ PHYSIOLOGICAL AGE ASSESSMENT TESTS:
${physSummary}

📅 TODAY'S ACTIVE ROUTINE:
${todaySummary}

🏋️ BENCH MODALITIES & PROTOCOLS:
${benchSummary}

📊 RECENT DAILY CHECK-IN & LOGGED EXPOSURES:
${checkinSummary}
===========================================================`
      } catch (err) {
        console.error('Copilot full user context fetch error:', err)
      }
    }

    const systemPrompt = `You are the LEVL AI Coach, an elite health, longevity, and performance expert.
You have FULL ACCESS to the user's complete personal health data provided below, including their user profile, bloodwork lab panels, measured biomarkers (such as testosterone, ApoB, hs-CRP, HbA1c, Vitamin D, lipids, liver enzymes, etc.), biological age scores, Today routine, Bench items, and recent check-ins.

CRITICAL ACCESS RULES:
1. YOU ALREADY HAVE DIRECT ACCESS to the user's personal health profile, lab results, bloodwork biomarkers, biological age metrics, Today routine, Bench items, and daily check-ins provided in the system context.
2. NEVER state or claim that you "cannot directly access" or "do not have access to" their personal lab results, testosterone levels, or profile data. Answer their questions directly using their exact values provided in the prompt context below!
3. Ground all biomarker/bloodwork optimization recommendations directly in existing LEVL modalities and protocols. Use healthspan/longevity optimization framing ("Optimal Longevity Zone", "Opportunity to Optimize").
4. ALWAYS use EXISTING modalities and protocols from the database first.
5. If the user asks for a protocol or modality recommendation, call search_database tool to verify canonical LEVL modalities, or call present_protocol / present_modality directly.
6. When recommending protocols for specific user goals or lab results, ALWAYS call the present_protocol tool to render interactive protocol cards!

CANONICAL MASTER PROTOCOLS CATALOG IN DATABASE:
- \`dr_thomas_dayspring_endothelial_vascular_protocol\`: Dr. Thomas Dayspring Endothelial & Vascular Elasticity Protocol (Best for: High ApoB, LDL, arterial stiffness, hypertension)
- \`dr_casey_means_metabolic_flexibility_protocol\`: Dr. Casey Means & Glucose Goddess Postprandial Glycemic Protocol (Best for: High HbA1c, glucose spikes, insulin resistance, CGM optimization)
- \`dr_valter_longo_senolytic_fmd_protocol\`: Dr. Valter Longo & Mayo Clinic Senolytic & Fasting Mimicking Protocol (Best for: Senescent zombie cell purge, SASP inflammation, stem cell renewal)
- \`wim_hof_autonomic_hrv_reset_protocol\`: Wim Hof Autonomic Nervous System & HRV Reset Protocol (Best for: Low HRV, vagal nerve tone, stress resilience, acute dopamine elevation)
- \`dr_matthew_walker_sleep_blueprint\`: Dr. Matthew Walker’s 8-Hour Sleep Architecture Blueprint (Best for: Insomnia, low NREM deep sleep, REM fragmentation, caffeine/food timing)
- \`dr_david_sinclair_epigenetic_renewal\`: Dr. David Sinclair’s Epigenetic Renewal Protocol (Best for: NAD+ depletion, sirtuin SIRT1/3/6 activation, epigenetic age reversal)
- \`gary_brecka_superhuman_protocol\`: Gary Brecka’s Superhuman Protocol (Best for: Low cellular voltage, plasma tissue hypoxia, red light, MTHFR methylation)
- \`bryan_johnson_blueprint_protocol\`: Bryan Johnson's Project Blueprint Core Protocol v2.0 (Best for: Speed of aging reduction <0.70, organ system reversal)
- \`peter_attia_centenarian_decathlon_protocol\`: Dr. Peter Attia's Centenarian Decathlon Protocol (Best for: Low VO2 Max, sarcopenia, Zone 2 cardiorespiratory volume)

=== LEVL APP UI/UX, NAVIGATION & FEATURE GUIDE ===
If the user asks where to find something, how to perform an action, or how features work in LEVL, provide clear, friendly, step-by-step guidance:

1. 🩸 Bloodwork & Lab Biomarkers Upload:
   • Where to go: Navigate to "Physiological Age" (/physiological-age) or "Biomarkers & Tracking" (/tracking).
   • How to upload: Click the "Upload Lab Panel / Bloodwork PDF or Image" button at the top of the Biomarkers section. Upload any PDF or photo of blood tests from Quest Diagnostics, Labcorp, Function Health, etc. LEVL's Multimodal Vision AI automatically parses and normalizes every biomarker, calculates your PhenoAge biological age gap, and plots optimal longevity reference ranges.

2. ⏱️ Fasting & Nutrition Schedule Customization:
   • Where to go: Navigate to "Schedule" (/schedule).
   • How to edit fasting & macro targets: In the unified Fasting & Scheduling Split View, click on any of the 4 headline KPI cards (e.g. "[Edit] Fasting Window Target" or "[Edit] Daily Targets"). This opens the Targets Drawer where you can customize your fasting protocol (16:8, 18:6, 20:4, OMAD, or custom fasting hours), adjust target Fast Break (First Bite) and Fast Cutoff (Last Bite) times, and set precision nutrition targets for Calories, Protein (g), Net Carbs (g), Prebiotic Fiber (g), and Healthy Fats (g).
   • How to quick-log meals: On the Today timeline (/today), tap the first hotkey button ("Log Meal / Fast Break") to take or upload a plate photo for instant AI macro breakdown and botanical plant diversity count, or manually log with custom timestamps.

3. ⚙️ Modality Dosing, Scheduling & Cadence Customization:
   • How to customize: On the Today timeline (/today) or Bench (/bench), find any modality card and click the "Personalize" / "Schedule" gear or calendar button.
   • What you can adjust in the Modality Studio:
     - Cadence & Rotation: Choose "Days of Week" or "Rest Interval" (e.g. every 2 days, rolling vs fixed weekly anchor).
     - Real-World Adaptation Policy: Choose what happens if a dose is skipped (Roll Forward, Fixed, or Cascade Shift).
     - Daily Multi-Dose Frequency: 1x, 2x AM/PM, or 3x TID with circadian time slots.
     - Dosage Spectrum Slider & Titration Planner: Adjust starter vs personal target vs prescribed protocol doses, peptide step-up cycles, secondary vehicle notes (e.g. "with 1 tbsp EVOO"), and PubMed study links.

4. 🔍 Exploring Protocols & Modalities Catalog:
   • Where to go: Navigate to "Explore" (/explore).
   • Browse 100+ verified clinical protocols (Bryan Johnson Blueprint, Peter Attia Centenarian Decathlon, David Sinclair Epigenetic Stack, Valter Longo FMD, Dr. Matthew Walker Sleep Architecture, Dr. Thomas Dayspring Vascular, Wim Hof HRV, Gary Brecka Superhuman, etc.).
   • Tap any protocol to view scientific dossiers and 1-click "Enroll Protocol", "Add to Today", or "Add to Bench".

5. 🏋️ Bench & Protocol Backlog:
   • Where to go: Navigate to "Bench" (/bench).
   • View modalities or protocols you have saved for later experimentation. You can fine-tune dosing and schedule configs on the bench before promoting them into your live Today timeline.

6. 👤 User Health Profile & Settings:
   • Where to go: Navigate to "Settings" (/settings).
   • Update your Chronological Age, Biological Sex, Body Fat %, Dietary Pattern, Primary Longevity Goals, Spend/Time Budgets, Risk Tolerance, and Discipline Level.

7. 📊 Daily Check-in & Outcome Tracking:
   • How to log: On the Today timeline (/today), tap the daily wellbeing check-in banner to log mood, energy, stress, and sleep quality (0-10), which powers the daily efficacy correlations.
==================================================

7. When a user asks to add something to their routine but doesn't specify if it's for "today" or their "bench", DEFAULT to using the 'add_to_bench' tool rather than explaining the difference or asking them. Add it to their bench immediately.
8. If you are recommending an existing modality or protocol from the database, use the 'present_modality' or 'present_protocol' tool so the user can see it as an interactive UI card.
9. When a user asks you to create a new modality, or when a recommended intervention is not in the catalog, use the 'create_modality_draft' tool.
   ALWAYS auto-fill complete, evidence-based recommendations:
   - name: Precise name (e.g. "Spermidine", "Tongkat Ali", "BPC-157", "Apigenin")
   - category: Best category ("Supplements", "Peptides", "Thermal", "Fitness", "Sleep", "Nootropics", "Nutrition", "Mindfulness", "Light Therapy", "Other")
   - headline_benefit: 1-sentence primary biological or longevity benefit
   - instructions: Clear administration and absorption instructions (e.g. "Take with high-polyphenol olive oil or fatty meal for maximal bioavailability")
   - dose_amount: Numerical amount (e.g. "10", "400", "500", "20")
   - dose_unit: Measurement unit ("mg", "g", "mcg", "IU", "mins", "ml")
   - admin_context: E.g. "With fatty meal", "Empty stomach upon waking", "Pre-workout (30-45m)", "30m before sleep"
   - timing_slot: Circadian timing slot ("morning_supplement_stack", "waking", "first_meal", "midday", "afternoon", "evening_supplement_stack", "bedtime", "anytime")
   - cadence_mode: "daily", "days_of_week", or "interval"
   - selected_days: E.g. ["Mon", "Wed", "Fri"] if days_of_week
   - rest_interval_days: E.g. 1 (every other day) if interval
   - add_to_today: true (automatically schedule in Today tasks)
   - save_to_bench: true (save to bench for permanent access)

${userContextPrompt}`

    const coreMessages = await convertToModelMessages(messages as UIMessage[]);

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages: coreMessages,
      tools: {
        search_database: {
          description: 'Hybrid search the LEVL database for modalities, protocols, or exact keyword matches.',
          inputSchema: z.object({
            query: z.string().describe('The search query or keyword.'),
            filter_type: z.enum(['modality', 'protocol', 'all']).optional(),
          }),
          execute: async ({ query, filter_type }: { query: string; filter_type?: string }) => {
            try {
              if (!query || query.trim() === '') {
                return { error: "You must provide a non-empty search query parameter." };
              }

              // 1. Embed the user's query
              const { embedding: queryEmbedding } = await embed({
                model: google.textEmbeddingModel('gemini-embedding-001'),
                value: query,
              });

              // 2. Call the Hybrid Search RPC
              const { data, error } = await supabase.rpc('match_modalities', {
                query_embedding: queryEmbedding,
                query_text: query,
                match_count: 5,
                filter_category: null
              });

              if (error) return { error: error.message };
              return { results: data || [], note: 'Showing top Hybrid Search results (Semantic + Keyword)' };
            } catch (e: any) {
              return { error: e.message };
            }
          },
        },

        create_modality_draft: {
          description: 'Create and schedule a NEW custom modality in the LEVL database and automatically add it to Today with evidence-based recommended dosage, timing slot, and cadence.',
          inputSchema: z.object({
            name: z.string().describe('Name of the modality (e.g. "Spermidine", "Tongkat Ali")'),
            category: z.string().optional().describe('Category: Supplements, Peptides, Thermal, Fitness, Sleep, Nootropics, Nutrition, Mindfulness, Light Therapy, Other'),
            headline_benefit: z.string().optional().describe('1-sentence primary biological or longevity benefit'),
            brief_description: z.string().optional().describe('Summary of the modality and mechanism'),
            instructions: z.string().optional().describe('Actionable administration instructions (e.g. take with dietary fats)'),
            source_url: z.string().optional().describe('PubMed or clinical trial URL if available'),
            dose_amount: z.string().optional().describe('Numerical amount e.g. "500", "10", "1"'),
            dose_unit: z.string().optional().describe('Dosing unit e.g. "mg", "g", "mcg", "IU", "ml", "mins"'),
            admin_context: z.string().optional().describe('Context: "With fatty meal", "Empty stomach upon waking", "Pre-workout (30-45m)", etc.'),
            timing_slot: z.string().optional().describe('Timing slot: "waking", "morning_routine", "morning_supplement_stack", "first_meal", "midday", "afternoon", "evening_supplement_stack", "bedtime", "anytime"'),
            split_count: z.number().optional().describe('1 for single daily dose, 2 for AM/PM split'),
            split_evening_slot: z.string().optional().describe('Evening slot if split (e.g. "evening_supplement_stack")'),
            cadence_mode: z.enum(['daily', 'days_of_week', 'interval', 'pulse']).optional().describe('Cadence: "daily", "days_of_week", "interval", or "pulse"'),
            selected_days: z.array(z.string()).optional().describe('Array of active days e.g. ["Mon", "Wed", "Fri"]'),
            rest_interval_days: z.number().optional().describe('Rest days between sessions (e.g. 1 for every other day)'),
            selected_outcomes: z.array(z.string()).optional().describe('Target outcomes e.g. ["energy", "sleep_quality", "overall_longevity"]'),
            add_to_today: z.boolean().default(true).describe('Whether to automatically schedule this modality in Today tasks (default true)'),
            save_to_bench: z.boolean().default(true).describe('Whether to add to protocol bench for permanent tracking (default true)')
          }),
          execute: async (draftData) => {
            if (!localUserId) return { success: false, error: 'User not authenticated or localUserId missing' };

            const cleanName = draftData.name.trim();
            const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
            const id = `custom_${slug}_${Math.random().toString(36).substring(2, 7)}`;

            const rawDose = draftData.dose_amount ? `${draftData.dose_amount} ${draftData.dose_unit || 'mg'}`.trim() : '';
            let formattedDose = rawDose;
            if (draftData.admin_context) {
              formattedDose = formattedDose ? `${formattedDose} (${draftData.admin_context})` : draftData.admin_context;
            }
            if (draftData.split_count && draftData.split_count > 1) {
              formattedDose = formattedDose ? `${formattedDose} • ${draftData.split_count}x daily split` : `${draftData.split_count}x daily split`;
            }

            const primaryTiming = draftData.split_count === 2 && draftData.split_evening_slot
              ? `${draftData.timing_slot || 'morning_supplement_stack'},${draftData.split_evening_slot}`
              : (draftData.timing_slot || 'morning_supplement_stack');

            const newMod = {
              id,
              slug,
              name: cleanName,
              display_name: cleanName,
              category: draftData.category || 'Supplements',
              status: 'active',
              visibility: 'private',
              local_user_id: localUserId,
              headline_benefit: draftData.headline_benefit || 'Custom longevity optimization',
              brief_description: draftData.brief_description || draftData.headline_benefit || 'Custom user modality created via AI Coach',
              instructions: draftData.instructions || undefined,
              source_url: draftData.source_url || undefined,
              default_timing_slot: primaryTiming,
              dose_or_exposure: formattedDose || undefined,
              created_at: new Date().toISOString()
            };

            const { data: modData, error: modErr } = await supabase
              .from('modalities')
              .insert([newMod])
              .select()
              .single();

            if (modErr) {
              console.error('Error creating modality in DB:', modErr);
              return { success: false, error: modErr.message };
            }

            const todayStr = new Date().toISOString().split('T')[0];

            // 1. Add to Today if requested
            let taskCreated = false;
            if (draftData.add_to_today !== false) {
              const { error: taskErr } = await supabase
                .from('daily_protocol_tasks')
                .insert([{
                  local_user_id: localUserId,
                  date: todayStr,
                  modality_id: id,
                  status: 'pending',
                  custom_dose: formattedDose || undefined,
                  custom_timing: primaryTiming,
                  timing_slot: primaryTiming,
                  notes: draftData.instructions || undefined
                }]);

              if (!taskErr) taskCreated = true;
            }

            // 2. Add to Bench if requested
            if (draftData.save_to_bench !== false) {
              await supabase
                .from('user_bench_items')
                .insert([{
                  local_user_id: localUserId,
                  modality_id: id,
                  custom_dose: formattedDose || undefined,
                  custom_timing: primaryTiming,
                  notes: draftData.instructions || undefined
                }]);
            }

            // 3. Populate future scheduled dates across next 30 days
            if (draftData.add_to_today !== false) {
              const [y, m, d] = todayStr.split('-').map(Number);
              const localStartDate = new Date(y, m - 1, d, 12, 0, 0);
              const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              const futureTasksToInsert: any[] = [];

              if (draftData.cadence_mode === 'days_of_week' && draftData.selected_days?.length) {
                for (let i = 1; i <= 30; i++) {
                  const tDate = new Date(localStartDate);
                  tDate.setDate(localStartDate.getDate() + i);
                  const dayName = DAYS_SHORT[tDate.getDay()];
                  if (draftData.selected_days.includes(dayName)) {
                    const dStr = tDate.toISOString().split('T')[0];
                    futureTasksToInsert.push({
                      local_user_id: localUserId,
                      date: dStr,
                      modality_id: id,
                      status: 'pending',
                      custom_dose: formattedDose || undefined,
                      custom_timing: primaryTiming,
                      timing_slot: primaryTiming,
                      notes: draftData.instructions || undefined
                    });
                  }
                }
              } else if (draftData.cadence_mode === 'interval' && typeof draftData.rest_interval_days === 'number') {
                const step = draftData.rest_interval_days + 1;
                for (let i = step; i <= 30; i += step) {
                  const tDate = new Date(localStartDate);
                  tDate.setDate(localStartDate.getDate() + i);
                  const dStr = tDate.toISOString().split('T')[0];
                  futureTasksToInsert.push({
                    local_user_id: localUserId,
                    date: dStr,
                    modality_id: id,
                    status: 'pending',
                    custom_dose: formattedDose || undefined,
                    custom_timing: primaryTiming,
                    timing_slot: primaryTiming,
                    notes: draftData.instructions || undefined
                  });
                }
              } else if (draftData.cadence_mode === 'daily' || !draftData.cadence_mode) {
                for (let i = 1; i <= 30; i++) {
                  const tDate = new Date(localStartDate);
                  tDate.setDate(localStartDate.getDate() + i);
                  const dStr = tDate.toISOString().split('T')[0];
                  futureTasksToInsert.push({
                    local_user_id: localUserId,
                    date: dStr,
                    modality_id: id,
                    status: 'pending',
                    custom_dose: formattedDose || undefined,
                    custom_timing: primaryTiming,
                    timing_slot: primaryTiming,
                    notes: draftData.instructions || undefined
                  });
                }
              }

              if (futureTasksToInsert.length > 0) {
                try {
                  await supabase.from('daily_protocol_tasks').insert(futureTasksToInsert);
                } catch (schedErr) {
                  console.warn('Could not batch insert future scheduled tasks:', schedErr);
                }
              }
            }

            const initialData = {
              id: modData.id,
              name: modData.name,
              category: modData.category,
              headlineBenefit: modData.headline_benefit,
              instructions: modData.instructions || draftData.instructions,
              sourceUrl: modData.source_url || draftData.source_url,
              doseAmount: draftData.dose_amount || '',
              doseUnit: draftData.dose_unit || 'mg',
              adminContext: draftData.admin_context || '',
              timingSlot: primaryTiming,
              splitCount: (draftData.split_count as 1 | 2 | 3) || 1,
              splitEveningSlot: draftData.split_evening_slot || 'evening_supplement_stack',
              cadenceMode: draftData.cadence_mode || 'daily',
              selectedDays: draftData.selected_days || ['Mon', 'Wed', 'Fri'],
              restIntervalDays: draftData.rest_interval_days ?? 1,
              selectedOutcomes: draftData.selected_outcomes || ['energy'],
              scheduleToToday: true,
              saveToBench: true
            };

            return {
              success: true,
              message: `Created and scheduled "${modData.name}" into Today's routine!`,
              modality: modData,
              initialData,
              taskCreated
            };
          },
        },

        create_protocol_draft: {
          description: 'Draft a new Protocol containing multiple modalities.',
          inputSchema: z.object({
            name: z.string(),
            summary: z.string(),
            modality_ids: z.array(z.string()).describe('List of modality IDs to include in this protocol.'),
          }),
          execute: async (draftData) => {
            // Note: True MVP needs the Protocol + ProtocolSteps inserted
            const protocolId = draftData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const { data: pData, error: pError } = await supabase.from('protocols').insert({
              id: protocolId,
              name: draftData.name,
              description: draftData.summary,
              review_status: 'draft',
              local_user_id: localUserId,
              author_id: localUserId,
              visibility: 'private'
            }).select().single();

            if (pError) return { success: false, error: pError.message };

            // Insert steps
            for (let i = 0; i < draftData.modality_ids.length; i++) {
              await supabase.from('protocol_steps').insert({
                protocol_id: protocolId,
                modality_id: draftData.modality_ids[i],
                display_order: i + 1
              });
            }
            
            const { data: finalPData } = await supabase.from('protocols').select('*, protocol_steps(*, modality:modalities(*))').eq('id', protocolId).single();
            if (finalPData?.protocol_steps) {
              finalPData.protocol_steps.sort((a: any, b: any) => a.display_order - b.display_order);
            }

            return { success: true, message: 'Protocol drafted successfully.', protocol: finalPData };
          },
        },

        add_to_bench: {
          description: 'Add a modality or protocol to the user\'s bench.',
          inputSchema: z.object({
            id: z.string().describe('The ID of the modality or protocol to add.'),
            type: z.enum(['modality', 'protocol']).describe('Whether it is a modality or a protocol.'),
          }),
          execute: async ({ id, type }: { id: string, type: 'modality' | 'protocol' }) => {
            if (!localUserId) return { success: false, error: 'User not authenticated or localUserId missing' };
            try {
              if (type === 'modality') {
                const { error } = await supabase.from('user_bench_items').insert([{ local_user_id: localUserId, modality_id: id }]);
                if (error) return { success: false, error: error.message };
              } else {
                // To properly add a protocol to the bench we also add its steps, but for now we insert the protocol itself
                const { error } = await supabase.from('user_bench_items').insert([{ local_user_id: localUserId, protocol_id: id }]);
                if (error) return { success: false, error: error.message };
              }
              return { success: true, message: 'Successfully added ' + type + ' to bench.' };
            } catch (e: any) {
              return { success: false, error: e.message };
            }
          },
        },

        add_to_today: {
          description: 'Add a modality or protocol to the user\'s Today timeline/routine.',
          inputSchema: z.object({
            id: z.string().describe('The ID of the modality or protocol to add.'),
            type: z.enum(['modality', 'protocol']).describe('Whether it is a modality or a protocol.'),
          }),
          execute: async ({ id, type }: { id: string, type: 'modality' | 'protocol' }) => {
            if (!localUserId) return { success: false, error: 'User not authenticated or localUserId missing' };
            const dateStr = new Date().toISOString().split('T')[0]
            try {
              if (type === 'modality') {
                const { error } = await supabase.from('daily_protocol_tasks').insert([{ local_user_id: localUserId, date: dateStr, modality_id: id }]);
                if (error) return { success: false, error: error.message };
              } else {
                const { data: pData, error: pError } = await supabase.from('protocols').select('*, protocol_steps(*)').eq('id', id).single();
                if (pError || !pData) return { success: false, error: pError?.message || 'Protocol not found' };
                
                const steps = pData.protocol_steps || [];
                for (const step of steps) {
                  await supabase.from('daily_protocol_tasks').insert({
                    local_user_id: localUserId,
                    date: dateStr,
                    protocol_step_id: step.id
                  });
                }
              }
              return { success: true, message: 'Successfully added ' + type + ' to Today timeline.' };
            } catch (e: any) {
              return { success: false, error: e.message };
            }
          },
        },

        update_profile_inline: {
          description: 'Render interactive UI sliders and toggles for the user to update their profile preferences (e.g. discipline, time budget, risk tolerance). Call this tool when asking the user about their preferences.',
          inputSchema: z.object({
            message: z.string().describe('A message explaining why you are asking for these preferences.'),
          }),
          execute: async ({ message }) => {
            return { status: 'profile_form_rendered', message };
          }
        },

        ask_user_options: {
          description: 'Ask the user a question with expected dynamic choices. Use this to render interactive buttons (e.g. Yes/No, or other options) in the chat.',
          inputSchema: z.object({
            question: z.string().describe('The question to ask the user.'),
            options: z.array(z.string()).describe('The options to display as buttons. (e.g. ["Yes", "No"] or ["Morning", "Evening"])')
          }),
          execute: async ({ question, options }) => {
            return { status: 'options_rendered', question, options };
          }
        },

        present_modality: {
          description: 'Present a single modality to the user as an interactive UI card. Always use this tool when recommending a specific modality from the database.',
          inputSchema: z.object({
            modality_id: z.string().describe('The ID of the modality to present.'),
          }),
          execute: async ({ modality_id }) => {
            const { data, error } = await supabase.from('modalities').select('*').eq('id', modality_id).single();
            if (error) return { success: false, error: error.message };
            return { success: true, modality: data };
          }
        },

        present_protocol: {
          description: 'Present a full protocol to the user as an interactive UI card. Always use this tool when recommending a specific protocol.',
          inputSchema: z.object({
            protocol_id: z.string().describe('The ID of the protocol to present.'),
          }),
          execute: async ({ protocol_id }) => {
            const { data, error } = await supabase.from('protocols').select('*, protocol_steps(*, modality:modalities(*))').eq('id', protocol_id).single();
            if (error) return { success: false, error: error.message };
            if (data?.protocol_steps) {
               data.protocol_steps.sort((a: any, b: any) => a.display_order - b.display_order);
            }
            return { success: true, protocol: data };
          }
        },
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("API Chat Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 500 });
  }
}
