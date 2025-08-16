import { prisma } from '../src/lib/prisma';

async function createDefaultCategories() {
  console.log('🚀 Creating default knowledge categories...');

  const defaultCategories = [
    {
      id: 'chest',
      name: 'chest',
      description: 'Chest exercises, pectoral training, and chest development content'
    },
    {
      id: 'back',
      name: 'back', 
      description: 'Back exercises, lat training, and back development content'
    },
    {
      id: 'elbow_flexors',
      name: 'elbow_flexors',
      description: 'Bicep exercises and elbow flexion movements'
    },
    {
      id: 'forearms',
      name: 'forearms',
      description: 'Forearm exercises and grip strength training'
    },
    {
      id: 'triceps',
      name: 'triceps',
      description: 'Tricep exercises and elbow extension movements'
    },
    {
      id: 'shoulders',
      name: 'shoulders',
      description: 'Shoulder exercises, deltoid training, and shoulder development'
    },
    {
      id: 'abs',
      name: 'abs',
      description: 'Abdominal exercises and core training'
    },
    {
      id: 'legs',
      name: 'legs',
      description: 'Lower body exercises and leg training'
    },
    {
      id: 'quadriceps',
      name: 'quadriceps',
      description: 'Quadricep exercises and knee extension movements'
    },
    {
      id: 'hamstrings',
      name: 'hamstrings',
      description: 'Hamstring exercises and knee flexion movements'
    },
    {
      id: 'glutes',
      name: 'glutes',
      description: 'Glute exercises and hip extension movements'
    },
    {
      id: 'calves',
      name: 'calves',
      description: 'Calf exercises and lower leg training'
    },
    {
      id: 'adductors',
      name: 'adductors',
      description: 'Adductor exercises and inner thigh training'
    },
    {
      id: 'hypertrophy_programs',
      name: 'hypertrophy_programs',
      description: 'Complete training programs designed for muscle hypertrophy and growth'
    },
    {
      id: 'hypertrophy_principles',
      name: 'hypertrophy_principles',
      description: 'Core principles, science, and methodologies for muscle hypertrophy'
    }
  ];

  for (const category of defaultCategories) {
    try {
      await prisma.knowledgeCategory.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          description: category.description,
          updatedAt: new Date()
        },
        create: {
          id: category.id,
          name: category.name,
          description: category.description,
          updatedAt: new Date()
        }
      });
      console.log(`✅ Created/updated category: ${category.name}`);
    } catch (error) {
      console.error(`❌ Error creating category ${category.name}:`, error);
    }
  }

  console.log('🎉 Default categories creation completed!');
}

// Run the script
createDefaultCategories()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
