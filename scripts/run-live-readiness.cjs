const { spawnSync } = require('node:child_process');

if (!process.env.EPOSTAL_LIVE_BASE_URL) {
  console.log('Skipping live readiness gate: set EPOSTAL_LIVE_BASE_URL to run production checks.');
  process.exit(0);
}

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(command, ['playwright', 'test', 'tests/live_production_readiness.spec.ts', 'tests/live_full_cycle.spec.ts'], {
  stdio: 'inherit',
  shell: false,
});

process.exit(result.status ?? 1);
