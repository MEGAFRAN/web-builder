import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

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

const nextArgs = ['dev'];
if (listenHost) {
  nextArgs.push('-H', '0.0.0.0');
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
