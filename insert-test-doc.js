import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evskpbbqojkclyyjvpjr.supabase.co';
const supabaseAnonKey = 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const appId = 'APP-2026-4231';
  console.log('Inserting test document...');
  const { data, error } = await supabase.from('documents').insert([
    { application_id: appId, document_type: '10th Marksheet', file_path: 'https://evskpbbqojkclyyjvpjr.supabase.co/storage/v1/object/public/documents/APP-2026-4231/marksheet10.png' }
  ]).select('*');

  if (error) {
    console.error('Insert Error:', error.message, error.details);
  } else {
    console.log('Insert Success:', data);
  }
}

testInsert();
