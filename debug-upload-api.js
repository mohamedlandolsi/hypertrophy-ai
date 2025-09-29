const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUploadAPI() {
    console.log('🔍 Testing /api/upload endpoint logic...\n');

    try {
        // 1. Check for admin users
        console.log('1. Checking for admin users...');
        const adminUsers = await prisma.user.findMany({
            where: { role: 'admin' },
            select: { id: true, role: true }
        });
        
        console.log(`Found ${adminUsers.length} admin users:`);
        adminUsers.forEach(user => {
            console.log(`   - ID: ${user.id}, Role: ${user.role}`);
        });

        if (adminUsers.length === 0) {
            console.log('❌ No admin users found! This could be the issue.');
            console.log('   The upload API requires admin role to upload thumbnails.');
        }

        // 2. Check API validation logic
        console.log('\n2. Testing API validation logic...');
        
        // Simulate the file validation
        const testFile = {
            type: 'image/jpeg',
            size: 500 * 1024, // 500KB
            name: 'test-thumbnail.jpg'
        };
        
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
        
        if (!ALLOWED_TYPES.includes(testFile.type)) {
            console.log('❌ File type validation would fail');
        } else {
            console.log('✅ File type validation would pass');
        }
        
        if (testFile.size > MAX_FILE_SIZE) {
            console.log('❌ File size validation would fail');
        } else {
            console.log('✅ File size validation would pass');
        }

        // 3. Test error handling patterns
        console.log('\n3. Testing error response patterns...');
        
        const sampleErrorResponses = [
            { status: 400, error: 'No file provided' },
            { status: 400, error: 'Invalid upload type' },
            { status: 400, error: 'Invalid file type' },
            { status: 400, error: 'File too large' },
            { status: 401, error: 'Authentication required' },
            { status: 403, error: 'Admin access required' }
        ];
        
        console.log('Possible 400 error scenarios:');
        sampleErrorResponses
            .filter(r => r.status === 400)
            .forEach(r => console.log(`   - ${r.error}`));

    } catch (error) {
        console.error('❌ Error during testing:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testUploadAPI().catch(console.error);