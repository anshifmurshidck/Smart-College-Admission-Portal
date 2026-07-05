import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://evskpbbqojkclyyjvpjr.supabase.co';
const supabaseAnonKey = 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsertApp() {
  const appId = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  console.log('Inserting test application:', appId);
  const { data, error } = await supabase.from('applications').insert([{
    id: appId,
    full_name: 'Test Applicant',
    email: 'test@example.com',
    phone: '+919876543210',
    address: '123 Test St',
    dob: '2000-01-01',
    gender: 'Male',
    parent_name: 'Test Parent',
    parent_phone: '+919876543210',
    department_id: 1,
    aadhaar_number: '123456789012',
    state: 'Kerala',
    tenth_percentage: 95.5,
    twelfth_percentage: 92.0,
    status: 'Pending'
  }]).select('*');

  if (error) {
    console.error('Insert Application Error:', error.message, error.details);
  } else {
    console.log('Insert Application Success:', data);
  }
}

testInsertApp();
