import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { getLocalIpv4Addresses } from './get-local-ipv4-addresses.mjs';

function printHostAddresses(port) {
  const ips = getLocalIpv4Addresses();
  if (ips.length === 0) {
    console.warn('\n  No LAN IPv4 address found. Use localhost or check your network.\n');
    return;
  }
  console.log('\n  Accessible on your local network:');
  for (const { name, address } of ips) {
    console.log(`    http://${address}:${port}  (${name})`);
  }
  console.log('');
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nextBin = path.join(root, 'node_modules/next/dist/bin/next');

const rawArgs = process.argv.slice(2);
let listenHost = false;
const clientTokens = [];

for (const arg of rawArgs) {
  if (arg === '--host') {
    listenHost = true;
  } else if (!arg.startsWith('-')) {
    clientTokens.push(arg);
  }
}

const clientId =
  clientTokens[0] ?? process.env.npm_config_site ?? '';

// Turbopack (Next 16 default) can panic while processing Tailwind v4 in this repo — the
// error shows a broken content glob (e.g. "...ts,ts }\n ,tsx,..."). Use webpack unless opted in.
const useTurbopack = process.env.NEXT_DEV_TURBOPACK === '1';
const nextArgs = ['dev', ...(useTurbopack ? ['--turbopack'] : ['--webpack'])];
if (listenHost) {
  nextArgs.push('-H', '0.0.0.0');
  printHostAddresses(process.env.PORT ?? 3000);
}

const child = spawn(process.execPath, [nextBin, ...nextArgs], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ...(clientId ? { CLIENT_ID: clientId } : {}),
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
