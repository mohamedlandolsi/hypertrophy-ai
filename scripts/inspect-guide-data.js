const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function inspectGuideData() {
  try {
    console.log('🔍 Inspecting guide data in database...\n');

    const programs = await prisma.trainingProgram.findMany({
      include: {
        programGuide: true,
      }
    });

    programs.forEach((program, index) => {
      console.log(`📋 Program ${index + 1}: ${program.name.en || 'No English name'}`);
      console.log(`   ID: ${program.id}`);
      console.log(`   Program Guide:`, program.programGuide);
      
      if (program.programGuide) {
        console.log('   Guide Content Raw:', JSON.stringify(program.programGuide.content, null, 2));
      }
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectGuideData();