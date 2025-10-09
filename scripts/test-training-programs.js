// Test script for training program CRUD operations
// Run with: node test-training-programs.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTrainingProgramCRUD() {
  console.log('🧪 Testing Training Program CRUD Operations...\n');

  try {
    // Test data
    const testProgramData = {
      name: {
        en: 'Upper/Lower Split',
        ar: 'تقسيم علوي/سفلي',
        fr: 'Division Haut/Bas'
      },
      description: {
        en: 'A proven 4-day upper/lower body split for muscle growth',
        ar: 'تقسيم مؤكد لمدة 4 أيام للجزء العلوي والسفلي لنمو العضلات',
        fr: 'Une division corps supérieur/inférieur de 4 jours éprouvée pour la croissance musculaire'
      },
      price: 2999, // $29.99 in cents
      lemonSqueezyId: 'test-upper-lower-123',
      programGuide: {
        content: {
          en: {
            structure: 'This program alternates between upper and lower body days, training each twice per week.',
            exerciseSelection: 'Focus on compound movements with some isolation work for weak points.',
            volumeAdjustment: 'Start with 12-16 sets per muscle group per week, adjust based on recovery.',
            beginnerGuidelines: 'Beginners should start with lighter weights and focus on form over load.'
          },
          ar: {
            structure: 'يتناوب هذا البرنامج بين أيام الجزء العلوي والسفلي، ويدرب كل منهما مرتين في الأسبوع.',
            exerciseSelection: 'ركز على الحركات المركبة مع بعض العمل المعزول للنقاط الضعيفة.',
            volumeAdjustment: 'ابدأ بـ 12-16 مجموعة لكل مجموعة عضلية في الأسبوع، واضبط بناءً على الاستشفاء.',
            beginnerGuidelines: 'يجب على المبتدئين البدء بأوزان أخف والتركيز على الشكل بدلاً من الحمل.'
          },
          fr: {
            structure: 'Ce programme alterne entre les jours du haut et du bas du corps, entraînant chacun deux fois par semaine.',
            exerciseSelection: 'Concentrez-vous sur les mouvements composés avec un peu de travail d\'isolation pour les points faibles.',
            volumeAdjustment: 'Commencez avec 12-16 séries par groupe musculaire par semaine, ajustez selon la récupération.',
            beginnerGuidelines: 'Les débutants devraient commencer avec des poids plus légers et se concentrer sur la forme plutôt que sur la charge.'
          }
        }
      },
      workoutTemplates: [
        {
          name: {
            en: 'Upper Body A',
            ar: 'الجزء العلوي أ',
            fr: 'Haut du Corps A'
          },
          order: 1,
          requiredMuscleGroups: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS']
        },
        {
          name: {
            en: 'Lower Body A',
            ar: 'الجزء السفلي أ',
            fr: 'Bas du Corps A'
          },
          order: 2,
          requiredMuscleGroups: ['QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES']
        },
        {
          name: {
            en: 'Upper Body B',
            ar: 'الجزء العلوي ب',
            fr: 'Haut du Corps B'
          },
          order: 3,
          requiredMuscleGroups: ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS']
        },
        {
          name: {
            en: 'Lower Body B',
            ar: 'الجزء السفلي ب',
            fr: 'Bas du Corps B'
          },
          order: 4,
          requiredMuscleGroups: ['QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES']
        }
      ]
    };

    // 1. Test Create Operation
    console.log('1️⃣ Testing CREATE operation...');
    
    const createdProgram = await prisma.trainingProgram.create({
      data: {
        name: testProgramData.name,
        description: testProgramData.description,
        price: testProgramData.price,
        lemonSqueezyId: testProgramData.lemonSqueezyId,
      },
    });

    console.log('✅ Training program created:', createdProgram.id);

    // Create program guide
    await prisma.programGuide.create({
      data: {
        trainingProgramId: createdProgram.id,
        content: testProgramData.programGuide.content,
      },
    });

    console.log('✅ Program guide created');

    // Create workout templates
    await prisma.workoutTemplate.createMany({
      data: testProgramData.workoutTemplates.map((template) => ({
        trainingProgramId: createdProgram.id,
        name: template.name,
        order: template.order,
        requiredMuscleGroups: template.requiredMuscleGroups,
      })),
    });

    console.log('✅ Workout templates created');

    // 2. Test Read Operation
    console.log('\n2️⃣ Testing READ operation...');
    
    const fetchedProgram = await prisma.trainingProgram.findUnique({
      where: { id: createdProgram.id },
      include: {
        programGuide: true,
        workoutTemplates: {
          orderBy: { order: 'asc' },
        },
      },
    });

    console.log('✅ Program fetched with all relations');
    console.log(`   - Program: ${fetchedProgram.name.en}`);
    console.log(`   - Guide sections: ${Object.keys(fetchedProgram.programGuide.content.en).length}`);
    console.log(`   - Workout templates: ${fetchedProgram.workoutTemplates.length}`);

    // 3. Test Update Operation
    console.log('\n3️⃣ Testing UPDATE operation...');
    
    const updatedProgram = await prisma.trainingProgram.update({
      where: { id: createdProgram.id },
      data: {
        price: 3999, // Updated price
        isActive: false, // Toggle status
      },
    });

    console.log('✅ Program updated - new price:', updatedProgram.price);

    // 4. Test Delete Operation
    console.log('\n4️⃣ Testing DELETE operation...');
    
    await prisma.trainingProgram.delete({
      where: { id: createdProgram.id },
    });

    console.log('✅ Program deleted successfully');

    // Verify deletion
    const deletedProgram = await prisma.trainingProgram.findUnique({
      where: { id: createdProgram.id },
    });

    if (!deletedProgram) {
      console.log('✅ Deletion verified - program not found');
    }

    console.log('\n🎉 All CRUD operations completed successfully!\n');

    // Test schema validation
    console.log('5️⃣ Testing Schema Constraints...');
    
    try {
      // Test unique constraint on lemonSqueezyId
      await prisma.trainingProgram.create({
        data: {
          name: testProgramData.name,
          description: testProgramData.description,
          price: testProgramData.price,
          lemonSqueezyId: 'duplicate-test-id',
        },
      });

      const program2 = await prisma.trainingProgram.create({
        data: {
          name: testProgramData.name,
          description: testProgramData.description,
          price: testProgramData.price,
          lemonSqueezyId: 'duplicate-test-id', // Same ID - should fail
        },
      });

      console.log('❌ Unique constraint test failed - duplicate allowed');
    } catch (error) {
      if (error.code === 'P2002') {
        console.log('✅ Unique constraint working - duplicate lemonSqueezyId rejected');
      } else {
        console.log('⚠️ Unexpected error:', error.message);
      }
    }

    // Clean up any test data
    await prisma.trainingProgram.deleteMany({
      where: { lemonSqueezyId: { startsWith: 'duplicate-test-' } },
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testTrainingProgramCRUD();
}

module.exports = { testTrainingProgramCRUD };