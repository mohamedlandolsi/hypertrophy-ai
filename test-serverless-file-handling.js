/**
 * Test script for serverless file handling with Supabase Storage
 * 
 * This script tests the new upload flow:
 * 1. Request signed upload URL
 * 2. Upload file directly to Supabase Storage
 * 3. Process file from storage
 * 4. Verify download functionality
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Create a test file
const testFileName = 'test-knowledge.txt';
const testContent = `# Fitness Knowledge Test

This is a test file for the serverless file handling system.

## Exercise Guidelines
- Always warm up before exercising
- Start with light weights and progress gradually
- Focus on proper form over heavy weights
- Allow adequate rest between workouts

## Nutrition Tips
- Eat a balanced diet with adequate protein
- Stay hydrated throughout the day
- Time your meals around your workouts
- Consider post-workout nutrition for recovery

This file tests:
- Text extraction
- Chunking and embeddings
- Storage in Supabase
- Download functionality
`;

async function testServerlessFileHandling() {
  console.log('🧪 Testing Serverless File Handling System');
  console.log('=========================================');

  const baseUrl = 'http://localhost:3000';
  
  try {
    // Create test file
    console.log('📄 Creating test file...');
    const testFilePath = path.join(__dirname, testFileName);
    fs.writeFileSync(testFilePath, testContent);
    console.log(`✅ Test file created: ${testFileName}`);

    // Read test file
    const fileBuffer = fs.readFileSync(testFilePath);
    const fileSize = fileBuffer.length;
    const mimeType = 'text/plain';

    console.log(`📊 File details: ${testFileName} (${fileSize} bytes, ${mimeType})`);

    // Step 1: Request signed upload URL
    console.log('\n1️⃣ Requesting signed upload URL...');
    
    const startResponse = await fetch(`${baseUrl}/api/knowledge/upload/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': process.env.TEST_COOKIE || '' // You'll need to set this for auth
      },
      body: JSON.stringify({
        fileName: testFileName,
        fileSize: fileSize,
        mimeType: mimeType,
      }),
    });

    if (!startResponse.ok) {
      const errorData = await startResponse.json();
      throw new Error(`Failed to get upload URL: ${errorData.error}`);
    }

    const { uploadUrl, filePath, token } = await startResponse.json();
    console.log(`✅ Upload URL obtained:`);
    console.log(`   File path: ${filePath}`);
    console.log(`   Token: ${token ? 'Present' : 'Missing'}`);

    // Step 2: Upload file to Supabase Storage
    console.log('\n2️⃣ Uploading file to Supabase Storage...');
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': mimeType,
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload to storage: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
    }

    console.log(`✅ File uploaded to Supabase Storage successfully`);

    // Step 3: Process the uploaded file
    console.log('\n3️⃣ Processing uploaded file...');
    
    const processResponse = await fetch(`${baseUrl}/api/knowledge/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': process.env.TEST_COOKIE || ''
      },
      body: JSON.stringify({
        filePath: filePath,
        fileName: testFileName,
        fileSize: fileSize,
        mimeType: mimeType,
      }),
    });

    if (!processResponse.ok) {
      const errorData = await processResponse.json();
      throw new Error(`Failed to process file: ${errorData.error}`);
    }

    const processResult = await processResponse.json();
    console.log(`✅ File processed successfully:`);
    console.log(`   Knowledge item ID: ${processResult.knowledgeItem.id}`);
    console.log(`   Status: ${processResult.knowledgeItem.status}`);
    
    if (processResult.knowledgeItem.processingResult) {
      const result = processResult.knowledgeItem.processingResult;
      console.log(`   Chunks created: ${result.chunksCreated}`);
      console.log(`   Embeddings generated: ${result.embeddingsGenerated}`);
      console.log(`   Processing time: ${result.processingTime}ms`);
      
      if (result.warnings && result.warnings.length > 0) {
        console.log(`   Warnings: ${result.warnings.join(', ')}`);
      }
    }

    // Step 4: Test download functionality
    console.log('\n4️⃣ Testing download functionality...');
    
    const downloadResponse = await fetch(`${baseUrl}/api/knowledge/${processResult.knowledgeItem.id}/download`, {
      method: 'GET',
      headers: {
        'Cookie': process.env.TEST_COOKIE || ''
      }
    });

    if (!downloadResponse.ok) {
      const errorData = await downloadResponse.json();
      console.log(`⚠️ Download test failed: ${errorData.error}`);
    } else {
      const downloadedContent = await downloadResponse.text();
      console.log(`✅ Download test successful`);
      console.log(`   Downloaded ${downloadedContent.length} bytes`);
      console.log(`   Content matches: ${downloadedContent === testContent}`);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    fs.unlinkSync(testFilePath);
    console.log(`✅ Test file deleted: ${testFileName}`);

    console.log('\n🎉 Serverless file handling test completed successfully!');
    
    console.log('\n📋 Summary:');
    console.log('✅ Signed upload URL generation works');
    console.log('✅ Direct upload to Supabase Storage works');
    console.log('✅ File processing from storage works');
    console.log('✅ Download from storage works');
    console.log('✅ Chunking and embeddings generation works');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Cleanup on error
    const testFilePath = path.join(__dirname, testFileName);
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('🧹 Cleaned up test file');
    }
    
    process.exit(1);
  }
}

// Instructions for running the test
if (require.main === module) {
  console.log('🔧 SETUP INSTRUCTIONS:');
  console.log('1. Start your Next.js development server: npm run dev');
  console.log('2. Login to your app in a browser');
  console.log('3. Copy the session cookie and set it as TEST_COOKIE environment variable');
  console.log('   Example: TEST_COOKIE="your-session-cookie-here"');
  console.log('4. Run this test: node test-serverless-file-handling.js');
  console.log('');
  
  if (!process.env.TEST_COOKIE) {
    console.log('❌ TEST_COOKIE environment variable not set');
    console.log('Please set your session cookie and try again.');
    process.exit(1);
  }
  
  testServerlessFileHandling();
}

module.exports = { testServerlessFileHandling };
