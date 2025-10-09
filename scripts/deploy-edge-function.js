#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Supabase Edge Function Deployment Script');
console.log('============================================\n');

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📝 Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function deployEdgeFunction() {
  try {
    console.log('🔍 Checking Supabase CLI installation...');
    
    try {
      await runCommand('supabase', ['--version']);
      console.log('✅ Supabase CLI is installed\n');
    } catch (error) {
      console.error('❌ Supabase CLI not found!');
      console.log('Please install it first:');
      console.log('  npm install -g supabase');
      console.log('  or');
      console.log('  winget install Supabase.CLI');
      return;
    }

    console.log('🔗 Checking Supabase project link...');
    try {
      await runCommand('supabase', ['status']);
      console.log('✅ Supabase project is linked\n');
    } catch (error) {
      console.error('❌ Supabase project not linked!');
      console.log('Please link your project first:');
      console.log('  supabase link --project-ref YOUR_PROJECT_REF');
      return;
    }

    console.log('📦 Deploying Edge Function...');
    await runCommand('supabase', ['functions', 'deploy', 'file-processor']);
    console.log('✅ Edge Function deployed successfully!\n');

    console.log('🎉 Deployment Complete!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('  1. Set environment variables in Supabase dashboard:');
    console.log('     - SUPABASE_URL');
    console.log('     - SUPABASE_SERVICE_ROLE_KEY');
    console.log('  2. Test the function using the test script:');
    console.log('     node test-edge-function.js');
    console.log('  3. Use the EdgeProcessingComponent in your React app');
    console.log('');
    console.log('📖 For more details, see: SUPABASE_EDGE_FUNCTION_DOCUMENTATION.md');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('  1. Ensure Supabase CLI is installed and updated');
    console.log('  2. Check that your project is linked: supabase status');
    console.log('  3. Verify you have the correct permissions');
    console.log('  4. Check your internet connection');
  }
}

// Check if we're in the right directory
const currentDir = process.cwd();
const expectedFiles = ['package.json', 'supabase'];

let hasRequiredFiles = true;
for (const file of expectedFiles) {
  if (!require('fs').existsSync(path.join(currentDir, file))) {
    hasRequiredFiles = false;
    break;
  }
}

if (!hasRequiredFiles) {
  console.error('❌ Please run this script from your project root directory');
  console.log('Expected files: package.json, supabase/');
  process.exit(1);
}

console.log('📁 Current directory:', currentDir);
console.log('📂 Supabase functions directory:', path.join(currentDir, 'supabase', 'functions'));
console.log('');

deployEdgeFunction().catch(console.error);
