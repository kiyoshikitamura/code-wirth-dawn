const net = require('net');

const LISTEN_PORT = 5433;
const TARGET_HOST = '2406:da1a:6b0:f611:3d6:2e84:c5bd:f83c';
const TARGET_PORT = 5432;

const server = net.createServer((clientSocket) => {
  console.log(`[Proxy] Connection accepted from ${clientSocket.remoteAddress}:${clientSocket.remotePort}`);

  const serverSocket = net.createConnection({
    host: TARGET_HOST,
    port: TARGET_PORT,
    family: 6 // 明示的にIPv6での接続を優先
  }, () => {
    console.log('[Proxy] Connected to Supabase Database (IPv6)');
  });

  clientSocket.pipe(serverSocket);
  serverSocket.pipe(clientSocket);

  clientSocket.on('error', (err) => {
    console.error('[Proxy] Client socket error:', err.message);
  });

  serverSocket.on('error', (err) => {
    console.error('[Proxy] Supabase socket error:', err.message);
  });

  clientSocket.on('close', () => {
    serverSocket.destroy();
  });

  serverSocket.on('close', () => {
    clientSocket.destroy();
  });
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(`[Proxy] TCP Proxy listening on 0.0.0.0:${LISTEN_PORT} -> ${TARGET_HOST}:${TARGET_PORT}`);
});
