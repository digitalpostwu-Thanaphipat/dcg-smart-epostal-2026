/**
 * ePostal Deployment Synchronizer
 * This script automates the full deployment flow:
 * 1. Build frontend
 * 2. Sync build to backend
 * 3. Push to GAS
 * 4. Create new deployment
 * 5. Extract Deployment ID and update .env.local
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const ENV_FILE = path.join(FRONTEND_DIR, '.env.local');

function log(msg) {
  console.log(`[SyncDeploy] ${msg}`);
}

function run(cmd, cwd = ROOT_DIR) {
  log(`Running: ${cmd}`);
  return execSync(cmd, { cwd, encoding: 'utf8' });
}

try {
  // 1. Build Frontend
  log('Building frontend...');
  run('npm run build', FRONTEND_DIR);

  // 2. Sync Build to Backend
  log('Syncing build to backend...');
  const distIndex = path.join(FRONTEND_DIR, 'dist/index.html');
  const backendIndex = path.join(BACKEND_DIR, 'index.html');
  fs.copyFileSync(distIndex, backendIndex);
  log('Copied frontend/dist/index.html to backend/index.html');

  // 3. Push to GAS
  log('Pushing source to Google Apps Script...');
  run('clasp push', BACKEND_DIR);

  // 4. Create New Deployment
  const dateStr = new Date().toISOString().split('T')[0];
  log('Creating new deployment...');
  const deployOutput = run(`clasp deploy -d "Auto-Deploy ${dateStr}"`, BACKEND_DIR);
  log('Deployment successful.');

  // 5. Extract Deployment ID
  // Clasp output format can be:
  // "- <ID> @<Version> <Description>" (older versions)
  // "Deployed <ID> @<Version>" (newer versions)
  const match = deployOutput.match(/(?:-|Deployed)\s+([a-zA-Z0-9_-]+)\s+@\d+/);
  if (match && match[1]) {
    const deployId = match[1];
    log(`Captured New Deployment ID: ${deployId}`);

    // 6. Update .env.local
    let envContent = '';
    if (fs.existsSync(ENV_FILE)) {
      envContent = fs.readFileSync(ENV_FILE, 'utf8');
    }

    const newEnvLine = `VITE_GAS_DEPLOY_ID=${deployId}`;
    if (envContent.includes('VITE_GAS_DEPLOY_ID=')) {
      envContent = envContent.replace(/VITE_GAS_DEPLOY_ID=.*/, newEnvLine);
    } else {
      envContent += `\n${newEnvLine}`;
    }

    fs.writeFileSync(ENV_FILE, envContent.trim() + '\n');
    log(`Updated ${ENV_FILE} with new ID.`);
    log('✅ Sync Deployment Complete!');
  } else {
    console.error('❌ Could not extract Deployment ID from clasp output.');
    console.log('Full Output:', deployOutput);
  }
} catch (err) {
  console.error('❌ Deployment Sync Failed:');
  console.error(err.message);
  process.exit(1);
}
