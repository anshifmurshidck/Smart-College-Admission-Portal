import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evskpbbqojkclyyjvpjr.supabase.co';
const supabaseAnonKey = 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log('Checking applications table...');
  const { data: apps, error: appError } = await supabase.from('applications').select('*');
  
  if (appError) {
    console.error('Error fetching applications:', appError.message);
  } else {
    console.log(`Found ${apps.length} applications in the database.`);
    if (apps.length > 0) {
      console.log('Sample IDs:', apps.slice(0, 3).map(a => a.id));
    }
  }

  console.log('\nChecking a specific application with department join...');
  if (apps && apps.length > 0) {
    const testId = apps[0].id;
    const { data: joinData, error: joinError } = await supabase
      .from('applications')
      .select('full_name, department:departments(name, code)')
      .eq('id', testId)
      .single();
    
    if (joinError) {
      console.error('Join Error:', joinError.message);
    } else {
      console.log('Join Success:', joinData);
    }
  }
}

checkData();
