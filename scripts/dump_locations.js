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

async function dumpLocations() {
  const { data, error } = await supabase.from('locations').select('*');
  if (error) {
    console.error('Error fetching locations:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No locations found in DB.');
    return;
  }

  // Create CSV header
  // Ensure 'id', 'slug', 'name' are first
  const baseKeys = Object.keys(data[0]);
  const preferredOrder = ['id', 'slug', 'name', 'type', 'ruling_nation_id', 'prosperity_level', 'x', 'y', 'description', 'connections', 'neighbors'];
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
        // Stringify JSON arrays and objects, escape quotes for CSV
        const strVal = JSON.stringify(val).replace(/"/g, '""');
        return `"${strVal}"`;
      }
      if (typeof val === 'string' && (val.includes(',') || val.includes('\n') || val.includes('"'))) {
        // Escape quotes and wrap string in quotes if it contains commas or newlines
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csv += values.join(',') + '\n';
  });

  const outPath = path.join(__dirname, '../src/data/csv/locations.csv');
  fs.writeFileSync(outPath, csv, 'utf8');
  console.log(`Successfully wrote ${data.length} rows to src/data/csv/locations.csv`);
}

dumpLocations();
