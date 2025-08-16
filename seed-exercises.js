const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const INITIAL_EXERCISES = [
  // Chest exercises
  { name: "Machine chest press", muscleGroup: "CHEST", equipment: ["chest press machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  { name: "Incline machine chest press", muscleGroup: "CHEST", equipment: ["incline chest press machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  { name: "Chest fly machine", muscleGroup: "CHEST", equipment: ["peck deck machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Low to high cable fly", muscleGroup: "CHEST", equipment: ["cable machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  { name: "High to low cable fly", muscleGroup: "CHEST", equipment: ["cable machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  
  // Back exercises
  { name: "Lat pulldown", muscleGroup: "BACK", equipment: ["lat pulldown machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Close grip lat pulldown", muscleGroup: "BACK", equipment: ["lat pulldown machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  { name: "Chest supported row", muscleGroup: "BACK", equipment: ["rowing machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  { name: "Pullover machine", muscleGroup: "BACK", equipment: ["pullover machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  { name: "Cable pullover", muscleGroup: "BACK", equipment: ["cable machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  
  // Shoulder exercises
  { name: "Cable lateral raises", muscleGroup: "SHOULDERS", equipment: ["cable machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  { name: "Lateral raise machine", muscleGroup: "SHOULDERS", equipment: ["lateral raise machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Shoulder press machine", muscleGroup: "SHOULDERS", equipment: ["shoulder press machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Reverse fly machine", muscleGroup: "SHOULDERS", equipment: ["reverse fly machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Cable reverse fly", muscleGroup: "SHOULDERS", equipment: ["cable machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  
  // Biceps exercises
  { name: "Preacher curl machine", muscleGroup: "BICEPS", equipment: ["preacher curl machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Cable curl", muscleGroup: "BICEPS", equipment: ["cable machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Hammer curl", muscleGroup: "BICEPS", equipment: ["dumbbells"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Bicep curl machine", muscleGroup: "BICEPS", equipment: ["bicep curl machine"], category: "APPROVED", difficulty: "BEGINNER" },
  
  // Triceps exercises
  { name: "Triceps pushdown", muscleGroup: "TRICEPS", equipment: ["cable machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Triceps extension machine", muscleGroup: "TRICEPS", equipment: ["triceps extension machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Overhead cable extension", muscleGroup: "TRICEPS", equipment: ["cable machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  
  // Abs exercises
  { name: "Cable crunches", muscleGroup: "ABS", equipment: ["cable machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  { name: "Machine crunches", muscleGroup: "ABS", equipment: ["ab crunch machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Leg raises", muscleGroup: "ABS", equipment: ["none"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  
  // Glutes exercises
  { name: "Hip thrust", muscleGroup: "GLUTES", equipment: ["bench", "barbell"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  { name: "Kickback machine", muscleGroup: "GLUTES", equipment: ["glute kickback machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Cable kickback", muscleGroup: "GLUTES", equipment: ["cable machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  { name: "Hip abduction machine", muscleGroup: "GLUTES", equipment: ["hip abduction machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Leg press", muscleGroup: "GLUTES", equipment: ["leg press machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  
  // Quadriceps exercises
  { name: "Leg extension", muscleGroup: "QUADRICEPS", equipment: ["leg extension machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Hack squat", muscleGroup: "QUADRICEPS", equipment: ["hack squat machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  { name: "Pendulum squat", muscleGroup: "QUADRICEPS", equipment: ["pendulum squat machine"], category: "APPROVED", difficulty: "ADVANCED" },
  
  // Hamstrings exercises
  { name: "Seated leg curl", muscleGroup: "HAMSTRINGS", equipment: ["leg curl machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Lying leg curl", muscleGroup: "HAMSTRINGS", equipment: ["leg curl machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Stiff leg deadlift", muscleGroup: "HAMSTRINGS", equipment: ["barbell"], category: "APPROVED", difficulty: "INTERMEDIATE" },
  
  // Adductors exercises
  { name: "Hip adduction machine", muscleGroup: "ADDUCTORS", equipment: ["hip adduction machine"], category: "APPROVED", difficulty: "BEGINNER" },
  
  // Calves exercises
  { name: "Standing calf raise machine", muscleGroup: "CALVES", equipment: ["calf raise machine"], category: "APPROVED", difficulty: "BEGINNER" },
  { name: "Calf press on leg press", muscleGroup: "CALVES", equipment: ["leg press machine"], category: "APPROVED", difficulty: "INTERMEDIATE" },
];

async function seedExercises() {
  try {
    console.log('🌱 Seeding exercise database...');
    
    // Check if exercises already exist
    const existingCount = await prisma.exercise.count();
    if (existingCount > 0) {
      console.log(`📊 Found ${existingCount} existing exercises. Skipping seed.`);
      console.log('💡 If you want to reseed, delete existing exercises first.');
      return;
    }
    
    // Create exercises with generated IDs
    const createdExercises = [];
    for (const exercise of INITIAL_EXERCISES) {
      const created = await prisma.exercise.create({
        data: {
          id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          equipment: exercise.equipment,
          category: exercise.category,
          difficulty: exercise.difficulty,
          isActive: true,
          updatedAt: new Date(),
          description: `${exercise.name} - a machine/cable exercise for ${exercise.muscleGroup.toLowerCase()} development`,
          instructions: `Perform ${exercise.name} with controlled movement, focus on muscle contraction and proper form.`
        }
      });
      createdExercises.push(created);
    }
    
    console.log(`✅ Successfully created ${createdExercises.length} exercises!`);
    
    // Print summary by muscle group
    const summary = createdExercises.reduce((acc, exercise) => {
      acc[exercise.muscleGroup] = (acc[exercise.muscleGroup] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Exercise distribution by muscle group:');
    Object.entries(summary).forEach(([muscle, count]) => {
      console.log(`  ${muscle}: ${count} exercises`);
    });
    
    console.log('\n🎯 All exercises are marked as APPROVED and active for AI recommendations.');
    console.log('🔧 Visit /admin/settings to manage exercises through the web interface.');
    
  } catch (error) {
    console.error('❌ Error seeding exercises:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedExercises();
