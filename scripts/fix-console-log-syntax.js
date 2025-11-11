#!/usr/bin/env node

/**
 * Script to fix multiline console.log syntax errors
 * Reverts problematic wrappings and applies them correctly
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/components/admin/ai-testing-interface.tsx',
  'src/components/admin/item-category-manager.tsx',
];

function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  
  // Fix pattern: if (process.env.NODE_ENV === 'development') { console.log('...', { }
  // This occurs when the console.log had a multiline object
  let fixed = content.replace(
    /if \(process\.env\.NODE_ENV === 'development'\) \{ console\.log\((.*?), \{ \}\s*$/gm,
    "if (process.env.NODE_ENV === 'development') { console.log($1, {"
  );
  
  // Fix broken object literals after our wrapping
  fixed = fixed.replace(
    /if \(process\.env\.NODE_ENV === 'development'\) \{ console\.log\((.*?)\);\s*\n(\s+)(\w+)/g,
    (match, args, indent, nextLine) => {
      // This was a multiline console.log that got broken
      // Just remove the guard for now and let it be a normal console.log
      return `console.log(${args},\n${indent}${nextLine}`;
    }
  );
  
  fs.writeFileSync(fullPath, fixed, 'utf-8');
  console.log(`✓ Fixed ${filePath}`);
}

console.log('🔧 Fixing console.log syntax errors...\n');

for (const file of filesToFix) {
  try {
    fixFile(file);
  } catch (error) {
    console.error(`✗ Error fixing ${file}:`, error.message);
  }
}

console.log('\n✅ Syntax fixes complete!');
