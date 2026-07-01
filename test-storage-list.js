import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evskpbbqojkclyyjvpjr.supabase.co';
const supabaseAnonKey = 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testList() {
  const appId = 'APP-2026-4231';
  console.log(`Listing files for folder: ${appId}`);
  const { data, error } = await supabase.storage.from('documents').list(appId);
  if (error) {
    console.error('List Error:', error.message);
  } else {
    console.log('Files found:', data);
    if (data && data.length > 0) {
      data.forEach(file => {
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(`${appId}/${file.name}`);
        console.log(`File: ${file.name}, URL: ${urlData.publicUrl}`);
      });
    }
  }
}

testList();
