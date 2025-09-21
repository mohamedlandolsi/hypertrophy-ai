const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProgramBuilder() {
  console.log('🧪 Testing Program Builder Setup...\n');

  try {
    // 1. Check if we have training programs
    console.log('1️⃣ Checking training programs...');
    const programs = await prisma.trainingProgram.findMany({
      where: { isActive: true },
      include: {
        workoutTemplates: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    if (programs.length === 0) {
      console.log('⚠️  No training programs found. Creating test program...');
      
      // Create a test program with workout templates
      const testProgram = await prisma.trainingProgram.create({
        data: {
          name: {
            en: "Upper/Lower Split",
            ar: "تقسيم علوي/سفلي",
            fr: "Division Haut/Bas"
          },
          description: {
            en: "A classic upper/lower body split program",
            ar: "برنامج تقسيم كلاسيكي للجزء العلوي والسفلي",
            fr: "Un programme de division classique haut/bas du corps"
          },
          price: 2999, // $29.99
          lemonSqueezyId: "test-program-123",
          workoutTemplates: {
            create: [
              {
                name: {
                  en: "Upper Body A",
                  ar: "الجزء العلوي أ",
                  fr: "Haut du Corps A"
                },
                order: 1,
                requiredMuscleGroups: ["Chest", "Back", "Shoulders", "Arms"]
              },
              {
                name: {
                  en: "Lower Body A",
                  ar: "الجزء السفلي أ", 
                  fr: "Bas du Corps A"
                },
                order: 2,
                requiredMuscleGroups: ["Quadriceps", "Hamstrings", "Glutes", "Calves"]
              },
              {
                name: {
                  en: "Upper Body B",
                  ar: "الجزء العلوي ب",
                  fr: "Haut du Corps B"
                },
                order: 3,
                requiredMuscleGroups: ["Chest", "Back", "Shoulders", "Arms"]
              },
              {
                name: {
                  en: "Lower Body B",
                  ar: "الجزء السفلي ب",
                  fr: "Bas du Corps B"
                },
                order: 4,
                requiredMuscleGroups: ["Quadriceps", "Hamstrings", "Glutes", "Calves"]
              }
            ]
          }
        },
        include: {
          workoutTemplates: true
        }
      });
      
      console.log(`✅ Created test program: ${testProgram.id}`);
    } else {
      console.log(`✅ Found ${programs.length} training program(s)`);
      programs.forEach(program => {
        const programName = program.name.en || Object.values(program.name)[0];
        console.log(`   - ${programName} (${program.workoutTemplates.length} workouts)`);
      });
    }

    // 2. Check if we have training exercises
    console.log('\n2️⃣ Checking training exercises...');
    const exercises = await prisma.trainingExercise.findMany();
    
    if (exercises.length === 0) {
      console.log('⚠️  No training exercises found. Creating test exercises...');
      
      const testExercises = [
        // Upper Body Exercises
        {
          name: {
            en: "Bench Press",
            ar: "ضغط البنش",
            fr: "Développé Couché"
          },
          primaryMuscleGroup: "Chest",
          secondaryMuscleGroups: ["Shoulders", "Triceps"],
          type: "Compound"
        },
        {
          name: {
            en: "Pull-ups",
            ar: "العقلة",
            fr: "Tractions"
          },
          primaryMuscleGroup: "Back",
          secondaryMuscleGroups: ["Biceps"],
          type: "Compound"
        },
        {
          name: {
            en: "Overhead Press",
            ar: "الضغط العلوي",
            fr: "Développé Militaire"
          },
          primaryMuscleGroup: "Shoulders",
          secondaryMuscleGroups: ["Triceps"],
          type: "Compound"
        },
        {
          name: {
            en: "Barbell Rows",
            ar: "تجديف البار",
            fr: "Rowing Barre"
          },
          primaryMuscleGroup: "Back",
          secondaryMuscleGroups: ["Biceps"],
          type: "Compound"
        },
        {
          name: {
            en: "Dips",
            ar: "الغطس",
            fr: "Dips"
          },
          primaryMuscleGroup: "Triceps",
          secondaryMuscleGroups: ["Chest", "Shoulders"],
          type: "Compound"
        },
        {
          name: {
            en: "Bicep Curls",
            ar: "عضلة البايسيب",
            fr: "Curl Biceps"
          },
          primaryMuscleGroup: "Biceps",
          secondaryMuscleGroups: [],
          type: "Isolation"
        },
        
        // Lower Body Exercises
        {
          name: {
            en: "Squats",
            ar: "القرفصاء",
            fr: "Squats"
          },
          primaryMuscleGroup: "Quadriceps",
          secondaryMuscleGroups: ["Glutes", "Hamstrings"],
          type: "Compound"
        },
        {
          name: {
            en: "Deadlifts",
            ar: "الرفع المميت",
            fr: "Soulevé de Terre"
          },
          primaryMuscleGroup: "Hamstrings",
          secondaryMuscleGroups: ["Glutes", "Back"],
          type: "Compound"
        },
        {
          name: {
            en: "Romanian Deadlifts",
            ar: "الرفع المميت الروماني",
            fr: "Soulevé de Terre Roumain"
          },
          primaryMuscleGroup: "Hamstrings",
          secondaryMuscleGroups: ["Glutes"],
          type: "Compound"
        },
        {
          name: {
            en: "Walking Lunges",
            ar: "الطعنات المتحركة",
            fr: "Fentes Marchées"
          },
          primaryMuscleGroup: "Quadriceps",
          secondaryMuscleGroups: ["Glutes", "Hamstrings"],
          type: "Unilateral"
        },
        {
          name: {
            en: "Calf Raises",
            ar: "رفع السمانة",
            fr: "Élévations Mollets"
          },
          primaryMuscleGroup: "Calves",
          secondaryMuscleGroups: [],
          type: "Isolation"
        },
        {
          name: {
            en: "Hip Thrusts",
            ar: "دفع الورك",
            fr: "Hip Thrust"
          },
          primaryMuscleGroup: "Glutes",
          secondaryMuscleGroups: ["Hamstrings"],
          type: "Isolation"
        }
      ];

      await prisma.trainingExercise.createMany({
        data: testExercises
      });
      
      console.log(`✅ Created ${testExercises.length} test exercises`);
    } else {
      console.log(`✅ Found ${exercises.length} training exercise(s)`);
      
      // Group by muscle group
      const muscleGroups = exercises.reduce((acc, exercise) => {
        if (!acc[exercise.primaryMuscleGroup]) {
          acc[exercise.primaryMuscleGroup] = 0;
        }
        acc[exercise.primaryMuscleGroup]++;
        return acc;
      }, {});
      
      Object.entries(muscleGroups).forEach(([muscle, count]) => {
        console.log(`   - ${muscle}: ${count} exercises`);
      });
    }

    // 3. Test program builder data retrieval function structure
    console.log('\n3️⃣ Testing data structure for program builder...');
    
    const firstProgram = await prisma.trainingProgram.findFirst({
      where: { isActive: true },
      include: {
        workoutTemplates: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    if (firstProgram) {
      console.log('✅ Program structure valid:');
      console.log(`   - Program ID: ${firstProgram.id}`);
      console.log(`   - Workout Templates: ${firstProgram.workoutTemplates.length}`);
      
      firstProgram.workoutTemplates.forEach(template => {
        const templateName = template.name.en || Object.values(template.name)[0];
        console.log(`   - ${templateName}: ${template.requiredMuscleGroups.join(', ')}`);
      });
    }

    // 4. Test user program configuration structure
    console.log('\n4️⃣ Testing UserProgram configuration structure...');
    
    // Check if UserProgram table is ready
    const userProgramsCount = await prisma.userProgram.count();
    console.log(`✅ UserProgram table accessible (${userProgramsCount} records)`);

    console.log('\n🎉 Program Builder setup test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ TrainingProgram model ready');
    console.log('✅ WorkoutTemplate model ready');
    console.log('✅ TrainingExercise model ready');
    console.log('✅ UserProgram model ready');
    console.log('✅ Test data available');
    
    if (firstProgram) {
      console.log(`\n🔗 Test URL: /programs/${firstProgram.id}/build`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testProgramBuilder().catch(console.error);