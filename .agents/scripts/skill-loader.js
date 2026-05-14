const fs = require('fs');
const path = require('path');

const CORE_SKILLS = [
  'epostal-brain',
  'epostal-gas-architect',
  'epostal-design-system',
  'epostal-navigator',
  'epostal-admin-ops'
];

const MEMORY_FILES = [
  { name: 'HANDOFF', path: path.join(__dirname, '..', 'memory', 'HANDOFF.md') },
  { name: 'KNOWN_ISSUES', path: path.join(__dirname, '..', 'rules', 'KNOWN_ISSUES.md') }
];

const SKILLS_DIR = path.join(__dirname, '..', 'skills');

console.log('🚀 [ePostal] Priming AI Intelligence & Memory...');
console.log('==========================================');

// 1. Load Core Skills
CORE_SKILLS.forEach(skillName => {
  const skillPath = path.join(SKILLS_DIR, skillName, 'SKILL.md');
  if (fs.existsSync(skillPath)) {
    const content = fs.readFileSync(skillPath, 'utf8');
    console.log(`\n🔹 SKILL: ${skillName.toUpperCase()}`);
    console.log('------------------------------------------');
    console.log(content.trim());
  }
});

// 2. Load Runtime Memory
console.log('\n\n🧠 [ePostal] Loading Runtime Memory...');
console.log('==========================================');

MEMORY_FILES.forEach(file => {
  if (fs.existsSync(file.path)) {
    const content = fs.readFileSync(file.path, 'utf8');
    console.log(`\n📂 MEMORY: ${file.name}`);
    console.log('------------------------------------------');
    console.log(content.trim());
  }
});

console.log('\n==========================================');
console.log('✅ AI Context Primed. You are ready to build with ePostal standards.');
