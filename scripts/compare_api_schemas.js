const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function fetchSchema(url, serviceRoleKey) {
  const response = await fetch(url, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch schema from ${url}: ${response.statusText}`);
  }
  return response.json();
}

async function main() {
  let devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  let prodUrl = process.env.DASHBOARD_SUPABASE_URL;
  const prodKey = process.env.DASHBOARD_SUPABASE_SERVICE_ROLE_KEY;

  if (!devUrl || !devKey || !prodUrl || !prodKey) {
    console.error('Error: Missing database credentials in environment or .env.local.');
    console.error(`devUrl: ${devUrl ? 'set' : 'missing'}, devKey: ${devKey ? 'set' : 'missing'}`);
    console.error(`prodUrl: ${prodUrl ? 'set' : 'missing'}, prodKey: ${prodKey ? 'set' : 'missing'}`);
    process.exit(1);
  }

  // Append rest/v1/ if not already present
  if (!devUrl.endsWith('/rest/v1/')) {
    devUrl = devUrl.endsWith('/') ? `${devUrl}rest/v1/` : `${devUrl}/rest/v1/`;
  }
  if (!prodUrl.endsWith('/rest/v1/')) {
    prodUrl = prodUrl.endsWith('/') ? `${prodUrl}rest/v1/` : `${prodUrl}/rest/v1/`;
  }

  console.log(`Fetching development schema from ${devUrl}...`);
  const devSchema = await fetchSchema(devUrl, devKey);
  
  console.log(`Fetching production schema from ${prodUrl}...`);
  const prodSchema = await fetchSchema(prodUrl, prodKey);

  const devTables = Object.keys(devSchema.definitions || {}).sort();
  const prodTables = Object.keys(prodSchema.definitions || {}).sort();

  let report = '=== DATABASE SCHEMA COMPARISON REPORT ===\n\n';

  report += `Development Tables Count: ${devTables.length}\n`;
  report += `Production Tables Count: ${prodTables.length}\n\n`;

  // Check for missing tables in production
  const missingInProd = devTables.filter(t => !prodTables.includes(t));
  report += `--- Tables missing in Production ---\n`;
  if (missingInProd.length > 0) {
    missingInProd.forEach(t => report += `- ${t}\n`);
  } else {
    report += `None\n`;
  }
  report += '\n';

  // Check for missing tables in development
  const missingInDev = prodTables.filter(t => !devTables.includes(t));
  report += `--- Tables missing in Development ---\n`;
  if (missingInDev.length > 0) {
    missingInDev.forEach(t => report += `- ${t}\n`);
  } else {
    report += `None\n`;
  }
  report += '\n';

  // Compare columns for common tables
  const commonTables = devTables.filter(t => prodTables.includes(t));
  report += `--- Table Schema Columns Diff ---\n`;
  let hasDiff = false;

  for (const table of commonTables) {
    const devCols = devSchema.definitions[table].properties || {};
    const prodCols = prodSchema.definitions[table].properties || {};

    const devColNames = Object.keys(devCols).sort();
    const prodColNames = Object.keys(prodCols).sort();

    const missingColsInProd = devColNames.filter(c => !prodColNames.includes(c));
    const missingColsInDev = prodColNames.filter(c => !devColNames.includes(c));

    const typeDiffs = [];
    for (const col of devColNames.filter(c => prodColNames.includes(c))) {
      const devType = devCols[col].type || devCols[col].format;
      const prodType = prodCols[col].type || prodCols[col].format;
      if (devType !== prodType) {
        typeDiffs.push({ col, devType, prodType });
      }
    }

    if (missingColsInProd.length > 0 || missingColsInDev.length > 0 || typeDiffs.length > 0) {
      hasDiff = true;
      report += `Table: ${table}\n`;
      if (missingColsInProd.length > 0) {
        report += `  Missing columns in Production: ${missingColsInProd.join(', ')}\n`;
      }
      if (missingColsInDev.length > 0) {
        report += `  Missing columns in Development: ${missingColsInDev.join(', ')}\n`;
      }
      if (typeDiffs.length > 0) {
        report += `  Type differences:\n`;
        typeDiffs.forEach(d => {
          report += `    - ${d.col}: Dev (${d.devType}) vs Prod (${d.prodType})\n`;
        });
      }
      report += '\n';
    }
  }

  if (!hasDiff) {
    report += `All common tables have identical columns and types.\n\n`;
  }

  fs.writeFileSync('audit_output.txt', report);
  console.log('Report written to audit_output.txt');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
