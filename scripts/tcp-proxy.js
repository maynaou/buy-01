const net = require('node:net');

const [listenPortValue, targetHost, targetPortValue] = process.argv.slice(2);
const listenPort = Number(listenPortValue);
const targetPort = Number(targetPortValue);

function isValidPort(port) {
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

if (!isValidPort(listenPort) || !targetHost || !isValidPort(targetPort)) {
  console.error('Usage: node tcp-proxy.js <listen-port> <target-host> <target-port>');
  process.exit(2);
}

const connections = new Set();
const server = net.createServer((client) => {
  const upstream = net.connect({ host: targetHost, port: targetPort });
  connections.add(client);
  connections.add(upstream);

  client.on('error', () => upstream.destroy());
  client.on('close', () => {
    connections.delete(client);
    upstream.destroy();
  });
  upstream.on('error', (error) => {
    console.error(`TCP proxy to ${targetHost}:${targetPort} failed: ${error.message}`);
    client.destroy();
  });
  upstream.on('close', () => connections.delete(upstream));

  client.pipe(upstream);
  upstream.pipe(client);
});

server.on('error', (error) => {
  console.error(`TCP proxy on port ${listenPort} failed: ${error.message}`);
  process.exitCode = 1;
});

server.listen(listenPort, '127.0.0.1', () => {
  console.log(`TCP proxy listening on 127.0.0.1:${listenPort} -> ${targetHost}:${targetPort}`);
});

function shutdown() {
  if (server.listening) {
    server.close();
  }
  for (const connection of connections) {
    connection.destroy();
  }
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
