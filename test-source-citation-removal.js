#!/usr/bin/env node
/**
 * Test script to verify that source citations and knowledge base mentions are removed
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing source citation removal...\n');

// Check core-prompts.ts
const corePromptsPath = path.join(__dirname, 'src', 'lib', 'ai', 'core-prompts.ts');
const corePromptsContent = fs.readFileSync(corePromptsPath, 'utf8');

console.log('📋 Checking core-prompts.ts...');
const badPatterns = [
  'MUST cite',
  '<source:',
  'cite it',
  'knowledge base',
  'specialized knowledge base',
  'Cite knowledge base'
];

let issuesFound = 0;

badPatterns.forEach(pattern => {
  if (corePromptsContent.toLowerCase().includes(pattern.toLowerCase())) {
    console.log(`  ❌ Found problematic pattern: "${pattern}"`);
    issuesFound++;
  } else {
    console.log(`  ✅ Pattern removed: "${pattern}"`);
  }
});

// Check workout-program-generator.ts  
const workoutGenPath = path.join(__dirname, 'src', 'lib', 'ai', 'workout-program-generator.ts');
const workoutGenContent = fs.readFileSync(workoutGenPath, 'utf8');

console.log('\n📋 Checking workout-program-generator.ts...');
const workoutBadPatterns = [
  'citing the relevant source',
  '<source:TITLE>',
  'Knowledge Base Adherence'
];

workoutBadPatterns.forEach(pattern => {
  if (workoutGenContent.includes(pattern)) {
    console.log(`  ❌ Found problematic pattern: "${pattern}"`);
    issuesFound++;
  } else {
    console.log(`  ✅ Pattern removed: "${pattern}"`);
  }
});

// Check main chat route
const chatRoutePath = path.join(__dirname, 'src', 'app', 'api', 'chat', 'route.ts');
const chatRouteContent = fs.readFileSync(chatRoutePath, 'utf8');

console.log('\n📋 Checking chat route formatting...');
if (chatRouteContent.includes('[title: ${chunk.knowledgeItem.title}]')) {
  console.log('  ❌ Still includes title formatting in main route');
  issuesFound++;
} else {
  console.log('  ✅ Title formatting removed from main route');
}

// Check route-new.ts if it exists
const routeNewPath = path.join(__dirname, 'src', 'app', 'api', 'chat', 'route-new.ts');
if (fs.existsSync(routeNewPath)) {
  const routeNewContent = fs.readFileSync(routeNewPath, 'utf8');
  
  console.log('\n📋 Checking route-new.ts formatting...');
  if (routeNewContent.includes('[title: ${chunk.knowledgeItem.title}]')) {
    console.log('  ❌ Still includes title formatting in route-new');
    issuesFound++;
  } else {
    console.log('  ✅ Title formatting removed from route-new');
  }
}

console.log('\n📊 Summary:');
if (issuesFound === 0) {
  console.log('🎉 All source citation patterns successfully removed!');
  console.log('✅ AI will no longer mention knowledge base sources');
  console.log('✅ AI will no longer include <source:> citations');
  console.log('✅ AI will no longer mention "knowledge base" explicitly');
  console.log('✅ Knowledge context formatting cleaned up');
} else {
  console.log(`❌ Found ${issuesFound} issues that need to be addressed`);
  process.exit(1);
}

console.log('\n🔧 Changes applied:');
console.log('- Removed mandatory source citation requirements from core prompts');
console.log('- Replaced "knowledge base" with neutral "training database" references');
console.log('- Updated fallback messages to not mention knowledge base');
console.log('- Removed title information from knowledge context formatting');
console.log('- Updated workout program generation to not require source citations');
console.log('- Changed all prompts to encourage natural, flowing responses without citations');
