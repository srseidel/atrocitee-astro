// Simple script to check if environment variables are loading
import dotenv from 'dotenv';
dotenv.config();

console.log('Checking Supabase environment variables:');
console.log('PUBLIC_SUPABASE_URL:', process.env.PUBLIC_SUPABASE_URL ? 'Found ✓' : 'Not found ✗');
console.log('PUBLIC_SUPABASE_ANON_KEY:', process.env.PUBLIC_SUPABASE_ANON_KEY ? 'Found ✓' : 'Not found ✗'); 