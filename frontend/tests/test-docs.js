import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evskpbbqojkclyyjvpjr.supabase.co';
const supabaseAnonKey = 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDocs() {
  console.log('Fetching all applications...');
  const { data: apps } = await supabase.from('applications').select('*');
  console.log('Apps:', apps.map(a => ({ id: a.id, name: a.full_name, status: a.status })));

  console.log('\nFetching all documents...');
  const { data: docs, error } = await supabase.from('documents').select('*');
  if (error) {
    console.error('Error fetching documents:', error.message);
  } else {
    console.log('Docs count:', docs.length);
    console.log('Docs records:', docs);
  }
}

checkDocs();
