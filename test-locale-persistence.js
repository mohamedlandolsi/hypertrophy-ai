#!/usr/bin/env node

/**
 * Test script to verify locale persistence in the application
 * This script checks if the locale is properly preserved when navigating
 */

const fs = require('fs');
const path = require('path');

const baseDir = './src';

// Function to check if a file contains locale-aware patterns
function checkLocaleAwareNavigation(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check for hardcoded href patterns that don't use locale
    const hardcodedHrefPattern = /href=["']\/(?!api|_next|#|mailto:|tel:|https?:\/\/)[^"']*["']/g;
    const matches = content.match(hardcodedHrefPattern);
    
    if (matches) {
      matches.forEach(match => {
        // Skip if it's already locale-aware
        if (!match.includes('/${locale}') && !match.includes('`/')) {
          issues.push(`Potential hardcoded href: ${match}`);
        }
      });
    }
    
    return issues;
  } catch (error) {
    return [`Error reading file: ${error.message}`];
  }
}

// Function to recursively find all .tsx and .ts files
function findReactFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .next directories
        if (!['node_modules', '.next', '.git'].includes(item)) {
          traverse(fullPath);
        }
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    });
  }
  
  traverse(dir);
  return files;
}

console.log('🔍 Checking for locale persistence issues...\n');

const reactFiles = findReactFiles(baseDir);
let totalIssues = 0;
let filesWithIssues = 0;

reactFiles.forEach(file => {
  const issues = checkLocaleAwareNavigation(file);
  
  if (issues.length > 0) {
    filesWithIssues++;
    totalIssues += issues.length;
    
    console.log(`⚠️  ${file}:`);
    issues.forEach(issue => {
      console.log(`   ${issue}`);
    });
    console.log('');
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Files checked: ${reactFiles.length}`);
console.log(`   Files with issues: ${filesWithIssues}`);
console.log(`   Total issues: ${totalIssues}`);

if (totalIssues === 0) {
  console.log('✅ No locale persistence issues found!');
} else {
  console.log('❌ Please fix the issues above to ensure proper locale persistence.');
}
