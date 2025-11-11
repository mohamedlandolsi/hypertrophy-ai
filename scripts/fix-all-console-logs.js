#!/usr/bin/env node

/**
 * Fix all broken console.log syntax patterns
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/components/admin/program-creation/about-program-form.tsx',
  'src/components/ui/rich-text-editor.tsx',
  'src/app/[locale]/admin/programs/[id]/edit/page.tsx',
  'src/app/[locale]/chat/page.tsx',
  'src/app/api/admin/knowledge-item-categories/route.ts',
  'src/app/api/upload/route.ts',
  'src/app/debug/page.tsx',
  'src/lib/gemini.ts',
  'src/lib/subscription.ts',
  'src/lib/enhanced-rag-v2.ts',
  'src/lib/function-calling.ts',
];

console.log('🔧 Fixing console.log syntax errors...\n');

let totalFixed = 0;

filesToFix.forEach(relativePath => {
  const filePath = path.join(process.cwd(), relativePath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipped: ${relativePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let fixCount = 0;
  
  // Fix pattern 1: if (process.env.NODE_ENV === 'development') { console.log('text', { }
  //   prop: value,
  //   ...
  // });
  const pattern1Matches = content.match(/if \(process\.env\.NODE_ENV === 'development'\) \{ console\.log\((.*?), \{ \}\s*\n([\s\S]*?)\n(\s*)\}\);/g);
  if (pattern1Matches) {
    content = content.replace(
      /if \(process\.env\.NODE_ENV === 'development'\) \{ console\.log\((.*?), \{ \}\s*\n([\s\S]*?)\n(\s*)\}\);/g,
      (match, args, objContent, indent) => {
        fixCount++;
        const lines = objContent.split('\n');
        const formattedObj = lines.map(line => `      ${line.trim()}`).join('\n');
        return `if (process.env.NODE_ENV === 'development') {\n      console.log(${args}, {\n${formattedObj}\n      });\n    }`;
      }
    );
  }
  
  // Fix pattern 2: if (process.env.NODE_ENV === 'development') { console.log( }
  //   text
  // );
  const pattern2Matches = content.match(/if \(process\.env\.NODE_ENV === 'development'\) \{ console\.log\( \}\s*\n\s*`([^`]*)`\s*\n\s*\);/g);
  if (pattern2Matches) {
    content = content.replace(
      /if \(process\.env\.NODE_ENV === 'development'\) \{ console\.log\( \}\s*\n\s*`([^`]*)`\s*\n\s*\);/g,
      (match, text) => {
        fixCount++;
        return `if (process.env.NODE_ENV === 'development') {\n    console.log(\`${text}\`);\n  }`;
      }
    );
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed ${relativePath} (${fixCount} issues)`);
    totalFixed++;
  } else {
    console.log(`✓ ${relativePath} (no changes needed)`);
  }
});

console.log(`\n✅ Complete! Fixed ${totalFixed} files`);
