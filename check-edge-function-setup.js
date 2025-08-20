#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('⚙️  Supabase Edge Function Setup Helper');
console.log('=====================================\n');

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} (missing)`);
    return false;
  }
}

function checkDirectory(dirPath, description) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    console.log(`✅ ${description}: ${dirPath}`);
    
    // List contents
    const contents = fs.readdirSync(dirPath);
    if (contents.length > 0) {
      console.log(`   📁 Contents: ${contents.join(', ')}`);
    } else {
      console.log(`   📁 Empty directory`);
    }
    return true;
  } else {
    console.log(`❌ ${description}: ${dirPath} (missing)`);
    return false;
  }
}

function checkEnvironmentVariables() {
  console.log('🌍 Environment Variables Check:');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  let allPresent = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      const value = process.env[varName];
      const masked = value.length > 20 ? value.substring(0, 20) + '...' : value;
      console.log(`   ✅ ${varName}: ${masked}`);
    } else {
      console.log(`   ❌ ${varName}: Not set`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

function main() {
  console.log('📋 Checking Edge Function Setup...\n');

  // Check directory structure
  console.log('📂 Directory Structure:');
  const supabaseDir = checkDirectory('./supabase', 'Supabase directory');
  const functionsDir = checkDirectory('./supabase/functions', 'Functions directory');
  const fileProcessorDir = checkDirectory('./supabase/functions/file-processor', 'File processor function');
  console.log('');

  // Check required files
  console.log('📄 Required Files:');
  const configFile = checkFile('./supabase/config.toml', 'Supabase config');
  const indexFile = checkFile('./supabase/functions/file-processor/index.ts', 'Edge function code');
  const denoConfig = checkFile('./supabase/functions/deno.json', 'Deno configuration');
  console.log('');

  // Check API routes
  console.log('🔌 API Routes:');
  const apiRoute = checkFile('./src/app/api/knowledge/process-with-edge/route.ts', 'Edge processing API route');
  console.log('');

  // Check React components
  console.log('⚛️  React Components:');
  const reactComponent = checkFile('./src/components/knowledge/EdgeProcessingComponent.tsx', 'Edge processing component');
  console.log('');

  // Check environment variables
  const envVarsOk = checkEnvironmentVariables();
  console.log('');

  // Check documentation
  console.log('📚 Documentation:');
  const docs = checkFile('./SUPABASE_EDGE_FUNCTION_DOCUMENTATION.md', 'Documentation');
  console.log('');

  // Summary
  console.log('📊 Setup Summary:');
  console.log('================');
  
  const allFilesPresent = supabaseDir && functionsDir && fileProcessorDir && 
                         configFile && indexFile && apiRoute && reactComponent;
  
  if (allFilesPresent) {
    console.log('✅ All required files are present');
  } else {
    console.log('❌ Some required files are missing');
  }

  if (envVarsOk) {
    console.log('✅ Environment variables configured');
  } else {
    console.log('❌ Environment variables need configuration');
  }

  console.log('');

  if (allFilesPresent && envVarsOk) {
    console.log('🎉 Setup appears complete!');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Deploy the Edge Function:');
    console.log('      node deploy-edge-function.js');
    console.log('   2. Test the deployment:');
    console.log('      node test-edge-function.js');
    console.log('   3. Use the EdgeProcessingComponent in your app');
  } else {
    console.log('⚠️  Setup incomplete. Please address the issues above.');
    console.log('');
    console.log('📖 For detailed setup instructions, see:');
    console.log('   SUPABASE_EDGE_FUNCTION_DOCUMENTATION.md');
  }
}

main();
