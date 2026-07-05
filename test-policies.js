import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evskpbbqojkclyyjvpjr.supabase.co';
const supabaseAnonKey = 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPolicies() {
  console.log('Querying table info...');
  const { data, error } = await supabase.from('documents').select('*').limit(1);
  if (error) {
    console.error('Error:', error.message, error.details);
  } else {
    console.log('Documents data:', data);
  }
}

testPolicies();
