const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkExerciseData() {
  try {
    console.log('🔍 Checking all exercise-related data...\n');

    // Check exercise templates
    const exerciseTemplates = await prisma.exerciseTemplate.findMany();
    console.log(`📋 Exercise Templates: ${exerciseTemplates.length}`);
    
    if (exerciseTemplates.length > 0) {
      console.log('First few exercise templates:');
      exerciseTemplates.slice(0, 5).forEach(template => {
        console.log(`  - ${template.id}: ${template.muscleGroup} (${template.categoryType})`);
      });
    }

    // Check if there are other exercise-related tables
    const allTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%exercise%'
      ORDER BY table_name;
    `;
    
    console.log('\n🗃️ Exercise-related tables in database:');
    allTables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // Check workout templates to see their structure
    const workoutTemplates = await prisma.workoutTemplate.findMany();
    console.log(`\n🏋️ Workout Templates: ${workoutTemplates.length}`);
    
    if (workoutTemplates.length > 0) {
      console.log('Workout template details:');
      workoutTemplates.forEach(template => {
        console.log(`\nTemplate: ${template.name}`);
        console.log(`  ID: ${template.id}`);
        console.log(`  Required Muscle Groups: ${JSON.stringify(template.requiredMuscleGroups)}`);
        console.log(`  Training Program ID: ${template.trainingProgramId}`);
        console.log(`  Order: ${template.order}`);
      });
    }

    // Check if there are any other tables that might contain exercise data
    const knowledgeItems = await prisma.knowledgeItem.count();
    console.log(`\n📚 Knowledge Items: ${knowledgeItems}`);

    console.log('\n💡 Diagnosis:');
    if (exerciseTemplates.length === 0) {
      console.log('❌ No exercise templates found in database');
      console.log('🔧 The program customizer needs exercise templates to be populated');
      console.log('💭 Possible solutions:');
      console.log('   1. Seed the database with exercise templates');
      console.log('   2. Create admin interface to add exercise templates');
      console.log('   3. Import exercise data from external source');
    }

  } catch (error) {
    console.error('❌ Error checking exercise data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExerciseData();