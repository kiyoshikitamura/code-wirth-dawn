const dns = require('dns');

const region = 'ap-northeast-1';
const promises = [];

for (let i = 0; i <= 9; i++) {
  const host = `aws-${i}-${region}.pooler.supabase.com`;
  promises.push(
    new Promise((resolve) => {
      dns.resolve4(host, (err, addresses) => {
        if (err) {
          resolve({ host, exists: false, error: err.code });
        } else {
          resolve({ host, exists: true, addresses });
        }
      });
    })
  );
}

Promise.all(promises).then((results) => {
  results.forEach((r) => {
    if (r.exists) {
      console.log(`${r.host}: OK -> ${r.addresses.join(', ')}`);
    } else {
      console.log(`${r.host}: FAILED (${r.error})`);
    }
  });
});
