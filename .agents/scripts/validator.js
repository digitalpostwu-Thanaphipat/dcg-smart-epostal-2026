const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend', 'src');

let errors = [];

/**
 * Rule 1: GAS Hardening
 * All write operations to Google Sheets MUST be wrapped in LockService.
 */
function checkGasHardening() {
  console.log('🔍 [Rule 1] Checking GAS Hardening (LockService)...');
  const gsFiles = fs.readdirSync(BACKEND_DIR).filter(f => f.endsWith('.gs'));
  
  gsFiles.forEach(file => {
    const content = fs.readFileSync(path.join(BACKEND_DIR, file), 'utf8');
    const writeOps = ['setValue', 'setValues', 'appendRow', 'deleteRow', 'clearContent'];
    
    writeOps.forEach(op => {
      // Find occurrences of the operation
      const opRegex = new RegExp(`\\.${op}\\s*\\(`, 'g');
      if (opRegex.test(content)) {
        // If operation exists, check for LockService in the same file
        // (Ideally we check block-level, but file-level is a good start for static analysis)
        if (!content.includes('LockService.getScriptLock()')) {
          errors.push(`[GAS ERROR] ${file}: Found ".${op}()" but LockService is missing in this file.`);
        }
      }
    });
  });
}

/**
 * Rule 2: Schema Compliance & Column Safety
 * No hardcoded column indices. Must use getHeaderIndex() or similar.
 */
function checkColumnSafety() {
  console.log('🔍 [Rule 2] Checking Column Safety (No Hardcoded Indices)...');
  const gsFiles = fs.readdirSync(BACKEND_DIR).filter(f => f.endsWith('.gs'));
  
  gsFiles.forEach(file => {
    const content = fs.readFileSync(path.join(BACKEND_DIR, file), 'utf8');
    
    // Look for patterns like sheet.getRange(row, 5) where 5 is a raw number
    // We target common GAS methods where columns are hardcoded
    const hardcodedColumnRegex = /\.getRange\([^,]+,\s*\d+\s*\)/g;
    const matches = content.match(hardcodedColumnRegex);
    
    if (matches) {
      matches.forEach(match => {
        errors.push(`[COLUMN ERROR] ${file}: Found hardcoded column index in "${match}". Use getHeaderIndex() instead.`);
      });
    }
  });
}

/**
 * Rule 3: Package_Log Integrity
 * Ensure Package_Log operations use the 16-column canonical schema.
 */
function checkSchemaCompliance() {
  console.log('🔍 [Rule 3] Checking Package_Log Schema Integrity...');
  const packageLogFile = path.join(BACKEND_DIR, 'Service_Package.gs');
  if (fs.existsSync(packageLogFile)) {
    const content = fs.readFileSync(packageLogFile, 'utf8');
    
    // Check for hardcoded 16 column assumptions if any
    if (content.includes('Package_Log') && content.includes('getSchema(')) {
      errors.push(`[SCHEMA ERROR] Service_Package.gs: Package_Log operations detected using dynamic getSchema(). Must use hardcoded 16-column schema.`);
    }
  }
}

/**
 * Rule 4: Accessibility First
 * Buttons and interactive elements must have labels.
 */
function checkFrontendAccessibility() {
  console.log('🔍 [Rule 4] Checking Frontend Accessibility (WCAG)...');
  const walkSync = (dir, callback) => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        walkSync(filePath, callback);
      } else {
        callback(filePath);
      }
    });
  };

  walkSync(FRONTEND_DIR, (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Mask inline arrow functions to prevent premature regex matching termination at '=>'
      const maskedContent = content.replace(/=>/g, '__ARROW__');
      
      // Preprocess multi-line button tags to be single-line for robust regex matching
      const singleLineContent = maskedContent.replace(/<button[\s\S]*?>/g, match => {
        return match.replace(/\r?\n/g, ' ');
      });
      
      // Check for buttons without labels or icons without alt
      const buttonRegex = /<button(?!.*aria-label)(?!.*aria-labelledby)[^>]*>/g;
      const matches = singleLineContent.match(buttonRegex);
      
      if (matches) {
        // Filter out components that we know handle labels internally
        const filteredMatches = matches.filter(m => !m.includes('SearchableSelect') && !m.includes('className="sr-only"'));
        if (filteredMatches.length > 0) {
          errors.push(`[UI ERROR] ${path.relative(ROOT_DIR, filePath)}: Found <button> without aria-label.`);
        }
      }
    }
  });
}

console.log('\n🚀 [ePostal] Closed-Loop Quality Gate Starting...');
console.log('==================================================');

checkGasHardening();
checkColumnSafety();
checkSchemaCompliance();
checkFrontendAccessibility();

console.log('==================================================');

if (errors.length > 0) {
  console.error(`❌ FAILED: Found ${errors.length} quality violations.\n`);
  errors.forEach(err => console.error(`  - ${err}`));
  console.log('\n⚠️  Please fix these issues before deploying or pushing.');
  process.exit(1);
} else {
  console.log('✅ PASS: All quality gates cleared. Code is compliant with ePostal standards.');
  process.exit(0);
}

