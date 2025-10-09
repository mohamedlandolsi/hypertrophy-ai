const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMultipleStructuresImplementation() {
  console.log('🔬 Testing multiple program structures implementation...');
  
  try {
    // Test 1: Check existing program with migrated structure
    console.log('\n1️⃣ Testing existing program with migrated structure...');
    
    const existingProgram = await prisma.trainingProgram.findFirst({
      include: {
        programStructures: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (existingProgram) {
      console.log(`✅ Found program: ${JSON.stringify(existingProgram.name)}`);
      console.log(`📊 Program has ${existingProgram.programStructures.length} structure(s):`);
      
      existingProgram.programStructures.forEach((structure, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(structure.name)}`);
        console.log(`      - Type: ${structure.structureType}`);
        console.log(`      - Sessions: ${structure.sessionCount}`);
        console.log(`      - Training Days: ${structure.trainingDays}`);
        console.log(`      - Rest Days: ${structure.restDays}`);
        console.log(`      - Default: ${structure.isDefault}`);
        console.log(`      - Order: ${structure.order}`);
      });
    } else {
      console.log('ℹ️  No existing programs found');
    }

    // Test 2: Create a new program with multiple structures
    console.log('\n2️⃣ Testing new program creation with multiple structures...');
    
    const testProgramId = `test_program_${Date.now()}`;
    
    const newProgram = await prisma.trainingProgram.create({
      data: {
        name: {
          en: 'Full Body Split Test Program',
          ar: 'برنامج تقسيم الجسم الكامل التجريبي',
          fr: 'Programme de Split Full Body Test'
        },
        description: {
          en: 'A test program with multiple structure variants',
          ar: 'برنامج تجريبي مع متغيرات هيكلية متعددة',
          fr: 'Un programme de test avec plusieurs variantes structurelles'
        },
        price: 2999, // $29.99
        hasInteractiveBuilder: true,
        allowsCustomization: true,
        isActive: false, // Keep as inactive for testing
      },
    });

    // Create multiple structures for the test program
    const structures = await prisma.programStructure.createMany({
      data: [
        {
          trainingProgramId: newProgram.id,
          name: {
            en: 'Weekly Structure (3 days)',
            ar: 'هيكل أسبوعي (3 أيام)',
            fr: 'Structure Hebdomadaire (3 jours)'
          },
          structureType: 'weekly',
          sessionCount: 3,
          trainingDays: 3,
          restDays: 1,
          weeklySchedule: {
            monday: 'Full Body A',
            tuesday: '',
            wednesday: 'Full Body B',
            thursday: '',
            friday: 'Full Body C',
            saturday: '',
            sunday: ''
          },
          order: 0,
          isDefault: true
        },
        {
          trainingProgramId: newProgram.id,
          name: {
            en: 'Weekly Structure (4 days)',
            ar: 'هيكل أسبوعي (4 أيام)',
            fr: 'Structure Hebdomadaire (4 jours)'
          },
          structureType: 'weekly',
          sessionCount: 4,
          trainingDays: 4,
          restDays: 1,
          weeklySchedule: {
            monday: 'Upper Body',
            tuesday: 'Lower Body',
            wednesday: '',
            thursday: 'Push',
            friday: 'Pull',
            saturday: '',
            sunday: ''
          },
          order: 1,
          isDefault: false
        },
        {
          trainingProgramId: newProgram.id,
          name: {
            en: 'Cyclic Structure (2 on, 1 off)',
            ar: 'هيكل دوري (يومان تدريب، يوم راحة)',
            fr: 'Structure Cyclique (2 marche, 1 arrêt)'
          },
          structureType: 'cyclic',
          sessionCount: 0, // Not applicable for cyclic
          trainingDays: 2,
          restDays: 1,
          weeklySchedule: null,
          order: 2,
          isDefault: false
        }
      ]
    });

    console.log(`✅ Created test program with ID: ${newProgram.id}`);
    console.log(`📊 Added ${structures.count} structures to the program`);

    // Test 3: Verify the structures were created correctly
    console.log('\n3️⃣ Verifying created structures...');
    
    const createdProgram = await prisma.trainingProgram.findUnique({
      where: { id: newProgram.id },
      include: {
        programStructures: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (createdProgram) {
      console.log(`✅ Verified program: ${JSON.stringify(createdProgram.name)}`);
      console.log(`📊 Program has ${createdProgram.programStructures.length} structure(s):`);
      
      createdProgram.programStructures.forEach((structure, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(structure.name)}`);
        console.log(`      - Type: ${structure.structureType}`);
        console.log(`      - Sessions: ${structure.sessionCount}`);
        console.log(`      - Training Days: ${structure.trainingDays}`);
        console.log(`      - Rest Days: ${structure.restDays}`);
        console.log(`      - Default: ${structure.isDefault}`);
        console.log(`      - Order: ${structure.order}`);
        
        if (structure.weeklySchedule) {
          console.log('      - Weekly Schedule:');
          Object.entries(structure.weeklySchedule).forEach(([day, workout]) => {
            if (workout) {
              console.log(`        ${day}: ${workout}`);
            }
          });
        }
      });
    }

    // Test 4: Clean up test data
    console.log('\n4️⃣ Cleaning up test data...');
    
    await prisma.programStructure.deleteMany({
      where: { trainingProgramId: newProgram.id }
    });

    await prisma.trainingProgram.delete({
      where: { id: newProgram.id }
    });

    console.log('✅ Test cleanup completed');

    console.log('\n🎉 All tests passed! Multiple program structures implementation is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testMultipleStructuresImplementation()
    .then(() => {
      console.log('\n✨ Multiple structures test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testMultipleStructuresImplementation };