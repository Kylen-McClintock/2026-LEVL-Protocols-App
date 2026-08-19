const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://allzcxnbvabahocbgbmt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbHpjeG5idmFiYWhvY2JnYm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjI1NzYsImV4cCI6MjA5NjA5ODU3Nn0.qg15ltfcW_NB0YloXcKbS25MM6NQvfkJDz19o25SXMQ'
)

async function check() {
  console.log('Fetching modalities...')
  const { data: mods, error: e1 } = await supabase.from('modalities').select('id, functional_outcomes_to_track')
  console.log('MODS:', JSON.stringify(mods, null, 2))
  
  console.log('Fetching outcomes...')
  const { data: outcomes, error: e2 } = await supabase.from('outcome_dimensions').select('id')
  console.log('OUTCOMES:', JSON.stringify(outcomes, null, 2))
}

check()
