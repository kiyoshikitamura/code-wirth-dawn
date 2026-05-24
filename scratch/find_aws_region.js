const https = require('https');

const targetIp = '2406:da1a:6b0:f611:3d6:2e84:c5bd:f83c';

https.get('https://ip-ranges.amazonaws.com/ip-ranges.json', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const json = JSON.parse(data);
    const matches = [];

    // IPv6の簡易的なマッチング
    // targetIp は '2406:da1a:6b0:f611:3d6:2e84:c5bd:f83c'
    // 各プレフィックスをパースして判定する
    json.ipv6_prefixes.forEach((item) => {
      const [prefix, bitsStr] = item.ipv6_prefix.split('/');
      const bits = parseInt(bitsStr, 10);
      
      // 簡易判定: プレフィックスの最初のいくつかのヘキサブロックが一致するか
      // 2406:da1a::/35 -> 2406:da1a (32ビット) とマッチ
      // ここでは16進数文字列をビット列にして比較する
      const targetBin = ipToBinary(targetIp);
      const prefixBin = ipToBinary(prefix);
      
      if (targetBin.substring(0, bits) === prefixBin.substring(0, bits)) {
        matches.push(item);
      }
    });

    console.log('Matches:', JSON.stringify(matches, null, 2));
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});

// IPv6アドレスを128ビットの01文字列にする関数
function ipToBinary(ip) {
  // 簡易展開
  let parts = ip.split(':');
  if (ip.includes('::')) {
    const [left, right] = ip.split('::');
    const leftParts = left ? left.split(':') : [];
    const rightParts = right ? right.split(':') : [];
    const middleCount = 8 - (leftParts.length + rightParts.length);
    parts = [...leftParts, ...Array(middleCount).fill('0'), ...rightParts];
  }
  
  return parts.map(part => {
    const val = parseInt(part || '0', 16);
    return val.toString(2).padStart(16, '0');
  }).join('');
}
