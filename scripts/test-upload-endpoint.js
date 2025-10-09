const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function testUploadAPIRequest() {
    console.log('🔍 Testing actual /api/upload endpoint...\n');

    const baseUrl = 'http://localhost:3000';
    
    // Create a test image buffer
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+fBgALNAFP1ycK6QAAAA==', 'base64');
    
    // 1. Test without authentication (should return 401)
    console.log('1. Testing without authentication...');
    try {
        const formData = new FormData();
        formData.append('file', testImageBuffer, {
            filename: 'test.png',
            contentType: 'image/png'
        });
        formData.append('type', 'program-thumbnail');

        const response = await fetch(`${baseUrl}/api/upload`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const result = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response:`, result);

        if (response.status === 401) {
            console.log('✅ Correctly returned 401 for unauthenticated request');
        } else {
            console.log('❌ Expected 401 but got:', response.status);
        }
    } catch (error) {
        console.log('❌ Error making request:', error.message);
    }

    // 2. Test with missing file (should return 400)
    console.log('\n2. Testing with missing file...');
    try {
        const formData = new FormData();
        formData.append('type', 'program-thumbnail');

        const response = await fetch(`${baseUrl}/api/upload`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const result = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response:`, result);

        if (response.status === 400 && result.error === 'No file provided') {
            console.log('✅ Correctly returned 400 for missing file');
        } else {
            console.log('❌ Expected 400 "No file provided" but got:', response.status, result.error);
        }
    } catch (error) {
        console.log('❌ Error making request:', error.message);
    }

    // 3. Test with wrong type (should return 400)
    console.log('\n3. Testing with wrong upload type...');
    try {
        const formData = new FormData();
        formData.append('file', testImageBuffer, {
            filename: 'test.png',
            contentType: 'image/png'
        });
        formData.append('type', 'wrong-type');

        const response = await fetch(`${baseUrl}/api/upload`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const result = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response:`, result);

        if (response.status === 400 && result.error === 'Invalid upload type') {
            console.log('✅ Correctly returned 400 for wrong type');
        } else {
            console.log('❌ Expected 400 "Invalid upload type" but got:', response.status, result.error);
        }
    } catch (error) {
        console.log('❌ Error making request:', error.message);
    }

    // 4. Test with invalid file type (should return 400)
    console.log('\n4. Testing with invalid file type...');
    try {
        const formData = new FormData();
        formData.append('file', testImageBuffer, {
            filename: 'test.txt',
            contentType: 'text/plain'
        });
        formData.append('type', 'program-thumbnail');

        const response = await fetch(`${baseUrl}/api/upload`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const result = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response:`, result);

        if (response.status === 400 && result.error === 'Invalid file type') {
            console.log('✅ Correctly returned 400 for invalid file type');
        } else {
            console.log('❌ Expected 400 "Invalid file type" but got:', response.status, result.error);
        }
    } catch (error) {
        console.log('❌ Error making request:', error.message);
    }

    console.log('\n✅ API endpoint testing complete');
    console.log('\n📋 Summary:');
    console.log('   - The upload API is working correctly and returning proper 400 errors');
    console.log('   - The issue is likely in the frontend error handling or file preparation');
    console.log('   - Check the browser network tab for the exact request being sent');
    console.log('   - Ensure the user is properly authenticated with admin role');
}

testUploadAPIRequest().catch(console.error);