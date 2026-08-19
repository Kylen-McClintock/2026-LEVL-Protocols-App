const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://allzcxnbvabahocbgbmt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbHpjeG5idmFiYWhvY2JnYm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjI1NzYsImV4cCI6MjA5NjA5ODU3Nn0.qg15ltfcW_NB0YloXcKbS25MM6NQvfkJDz19o25SXMQ'
)

async function check() {
  console.log('Updating rapamycin...')
  const { data, error } = await supabase
    .from('modalities')
    .update({ functional_outcomes_to_track: ['energy', 'soreness', 'pain'] })
    .eq('id', 'rapamycin_weekly')
    .select('id, functional_outcomes_to_track')
    
  console.log('UPDATE RESULT:', JSON.stringify(data, null, 2))
  console.log('ERROR:', error)
}

check()
