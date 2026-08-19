const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://allzcxnbvabahocbgbmt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbHpjeG5idmFiYWhvY2JnYm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjI1NzYsImV4cCI6MjA5NjA5ODU3Nn0.qg15ltfcW_NB0YloXcKbS25MM6NQvfkJDz19o25SXMQ'
)

async function patchDatabase() {
  const updates = [
    { id: 'rapamycin_weekly', arr: ['energy', 'brain_fog', 'digestive_comfort'] },
    { id: 'metformin_daily', arr: ['energy', 'satiety', 'digestive_comfort'] },
    { id: 'zone_2_cardio', arr: ['endurance', 'energy', 'sleep_quality', 'soreness'] },
    { id: 'spermidine_supplement', arr: ['sleep_quality', 'waking_restedness', 'energy'] },
    { id: 'sauna_exposure', arr: ['sleep_quality', 'sleep_latency', 'stress'] },
    { id: 'epa_dha_omega3', arr: ['focus', 'brain_fog', 'mood'] }
  ]

  for (const update of updates) {
    const { error } = await supabase
      .from('modalities')
      .update({ functional_outcomes_to_track: update.arr })
      .eq('id', update.id)
    
    if (error) {
      console.error('Failed to update', update.id, error)
    } else {
      console.log('Updated', update.id)
    }
  }
}

patchDatabase()
