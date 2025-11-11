#!/usr/bin/env node

/**
 * Fix all broken console.log( } patterns in gemini.ts
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/lib/gemini.ts');
let content = fs.readFileSync(filePath, 'utf-8');

console.log('🔧 Fixing console.log( } patterns in gemini.ts...\n');

// Split into lines for processing
const lines = content.split('\n');
let fixedCount = 0;
let i = 0;

while (i < lines.length) {
  const line = lines[i];
  
  // Check if this line has the broken pattern: console.log( }
  if (line.includes('console.log( }')) {
    // Next line should have the message (string or template literal)
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const indent = line.match(/^(\s*)/)[1];
      
      // Extract the message from next line
      const messageMatch = nextLine.match(/^\s*(.+)\s*$/);
      if (messageMatch) {
        const message = messageMatch[1];
        
        // Replace current line with proper format
        lines[i] = `${indent}if (process.env.NODE_ENV === 'development') {`;
        lines[i + 1] = `${indent}  console.log(${message});`;
        
        // Check if there's a closing ); on line i+2
        if (i + 2 < lines.length && lines[i + 2].trim() === ');') {
          lines[i + 2] = `${indent}}`;
        } else {
          // Insert closing brace
          lines.splice(i + 2, 0, `${indent}}`);
        }
        
        fixedCount++;
        console.log(`✓ Fixed line ${i + 1}`);
      }
    }
  }
  
  i++;
}

// Join back and save
content = lines.join('\n');
fs.writeFileSync(filePath, content, 'utf-8');

console.log(`\n✅ Complete! Fixed ${fixedCount} console.log patterns in gemini.ts`);
