#!/usr/bin/env node

/**
 * Script to wrap console.log statements with development guards
 * This preserves debugging capability in development while cleaning production builds
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');
let filesProcessed = 0;
let logsGuarded = 0;
let logsRemoved = 0;

// Patterns to preserve (keep these console statements)
const preservePatterns = [
  /console\.error/,
  /console\.warn/,
  /console\.info/,
  /console\.table/,
  /console\.debug/,
];

// Patterns to remove completely (obvious debug statements)
const removePatterns = [
  /console\.log\(['"`]test/i,
  /console\.log\(['"`]debug/i,
  /console\.log\(['"`]here/i,
  /console\.log\(['"`]log/i,
  /console\.log\([0-9]+\)/,
  /console\.log\(['"`]\)/,
];

function shouldPreserve(line) {
  return preservePatterns.some(pattern => pattern.test(line));
}

function shouldRemove(line) {
  return removePatterns.some(pattern => pattern.test(line));
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let modified = false;
  
  const newLines = lines.map((line, index) => {
    // Skip if already guarded or not a console.log
    if (!line.includes('console.log') || shouldPreserve(line)) {
      return line;
    }
    
    // Check if already guarded
    if (line.includes('process.env.NODE_ENV') || line.includes('NODE_ENV')) {
      return line;
    }
    
    // Remove obvious debug statements
    if (shouldRemove(line)) {
      logsRemoved++;
      modified = true;
      return line.replace(/console\.log\([^)]*\);?/, '// Removed debug console.log');
    }
    
    // Guard remaining console.logs
    const indent = line.match(/^\s*/)[0];
    const logStatement = line.trim();
    
    if (logStatement.startsWith('console.log')) {
      logsGuarded++;
      modified = true;
      return `${indent}if (process.env.NODE_ENV === 'development') { ${logStatement} }`;
    }
    
    return line;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
    filesProcessed++;
  }
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.includes('node_modules')) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      try {
        processFile(fullPath);
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error.message);
      }
    }
  }
}

console.log('🔍 Scanning for console.log statements in src/...\n');
scanDirectory(srcDir);

console.log('\n✅ Console.log cleanup complete!\n');
console.log(`📊 Statistics:`);
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Logs guarded with dev check: ${logsGuarded}`);
console.log(`   Debug logs removed: ${logsRemoved}`);
console.log(`   Total changes: ${logsGuarded + logsRemoved}`);

if (filesProcessed > 0) {
  console.log('\n⚠️  Please review the changes and test thoroughly!');
  console.log('   Console.logs are now only active in development mode.');
}
