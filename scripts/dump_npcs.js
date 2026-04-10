const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpNpcs() {
  const { data, error } = await supabase.from('npcs').select('*');
  if (error) {
    console.error('Error fetching npcs:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No npcs found in DB.');
    return;
  }

  // Create CSV header
  const baseKeys = Object.keys(data[0]);
  const preferredOrder = ['id', 'slug', 'name', 'job_class', 'gender', 'durability', 'cover_rate', 'price', 'ai_role', 'spawn_type', 'description'];
  const keys = [...preferredOrder.filter(k => baseKeys.includes(k)), ...baseKeys.filter(k => !preferredOrder.includes(k))];
  
  let csv = keys.join(',') + '\n';

  // Create CSV rows
  data.forEach(row => {
    const values = keys.map(k => {
      let val = row[k];
      if (val === null || val === undefined) {
        return '';
      }
      if (typeof val === 'object') {
        const strVal = JSON.stringify(val).replace(/"/g, '""');
        return `"${strVal}"`;
      }
      if (typeof val === 'string' && (val.includes(',') || val.includes('\n') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csv += values.join(',') + '\n';
  });

  const outPath = path.join(__dirname, '../src/data/csv/npcs_db_dump.csv');
  fs.writeFileSync(outPath, csv, 'utf8');
  console.log(`Successfully wrote ${data.length} rows to src/data/csv/npcs_db_dump.csv`);
}

dumpNpcs();
