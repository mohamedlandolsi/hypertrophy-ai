const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateExerciseTemplatesWithNames() {
  try {
    console.log('🏋️ Updating Exercise Templates with Names...\n');

    // Get all exercise templates
    const templates = await prisma.exerciseTemplate.findMany({
      orderBy: [
        { muscleGroup: 'asc' },
        { categoryType: 'asc' },
        { priority: 'asc' }
      ]
    });

    console.log(`Found ${templates.length} exercise templates to update\n`);

    // Exercise names by muscle group and type
    const exerciseNames = {
      chest: {
        COMPOUND: {
          en: ['Chest Press', 'Incline Chest Press', 'Decline Chest Press'],
          ar: ['ضغط الصدر', 'ضغط الصدر المائل علوي', 'ضغط الصدر المائل سفلي']
        },
        ISOLATION: {
          en: ['Chest Fly', 'Cable Crossover', 'Pec Deck'],
          ar: ['فتح الصدر', 'التقاطع بالكابل', 'جهاز الصدر']
        },
        UNILATERAL: {
          en: ['Single Arm Chest Press', 'Single Arm Fly', 'Single Arm Cable Crossover'],
          ar: ['ضغط الصدر بذراع واحدة', 'فتح الصدر بذراع واحدة', 'التقاطع بالكابل بذراع واحدة']
        }
      },
      back: {
        COMPOUND: {
          en: ['Lat Pulldown', 'Seated Row', 'T-Bar Row'],
          ar: ['سحب عالي', 'تجديف جالس', 'تجديف بالبار']
        },
        ISOLATION: {
          en: ['Straight Arm Pulldown', 'Cable Pullover', 'Reverse Fly'],
          ar: ['سحب ذراع مستقيم', 'سحب علوي بالكابل', 'فتح خلفي']
        },
        UNILATERAL: {
          en: ['Single Arm Row', 'Single Arm Pulldown', 'Single Arm Pullover'],
          ar: ['تجديف بذراع واحدة', 'سحب عالي بذراع واحدة', 'سحب علوي بذراع واحدة']
        }
      },
      shoulders: {
        COMPOUND: {
          en: ['Shoulder Press', 'Arnold Press', 'Pike Push Up'],
          ar: ['ضغط الكتف', 'ضغط أرنولد', 'ضغط مقلوب']
        },
        ISOLATION: {
          en: ['Lateral Raise', 'Front Raise', 'Rear Delt Fly'],
          ar: ['رفع جانبي', 'رفع أمامي', 'فتح خلفي للكتف']
        },
        UNILATERAL: {
          en: ['Single Arm Press', 'Single Arm Lateral Raise', 'Single Arm Front Raise'],
          ar: ['ضغط بذراع واحدة', 'رفع جانبي بذراع واحدة', 'رفع أمامي بذراع واحدة']
        }
      },
      arms: {
        ISOLATION: {
          en: ['Bicep Curl', 'Tricep Extension', 'Hammer Curl', 'Tricep Pushdown', 'Preacher Curl', 'Overhead Extension'],
          ar: ['تموج العضلة ذات الرأسين', 'مد ثلاثية الرؤوس', 'تموج المطرقة', 'دفع ثلاثية الرؤوس', 'تموج الواعظ', 'مد علوي']
        }
      },
      legs: {
        COMPOUND: {
          en: ['Leg Press', 'Squat', 'Deadlift'],
          ar: ['ضغط الساقين', 'القرفصاء', 'الرفعة الميتة']
        },
        ISOLATION: {
          en: ['Leg Extension', 'Leg Curl', 'Calf Raise'],
          ar: ['مد الساقين', 'تجعيد الساقين', 'رفع السمانة']
        },
        UNILATERAL: {
          en: ['Single Leg Press', 'Bulgarian Split Squat', 'Single Leg Deadlift'],
          ar: ['ضغط ساق واحدة', 'القرفصاء البلغاري', 'الرفعة الميتة بساق واحدة']
        }
      }
    };

    // Update each template with appropriate name
    let updatedCount = 0;
    const exerciseCounters = {};

    for (const template of templates) {
      const muscleGroup = template.muscleGroup;
      const exerciseType = template.exerciseType;
      
      // Initialize counter for this muscle group and type
      const key = `${muscleGroup}_${exerciseType}`;
      if (!exerciseCounters[key]) {
        exerciseCounters[key] = 0;
      }

      // Get the appropriate names
      const names = exerciseNames[muscleGroup]?.[exerciseType];
      if (names) {
        const nameIndex = exerciseCounters[key] % names.en.length;
        const exerciseName = {
          en: names.en[nameIndex],
          ar: names.ar[nameIndex]
        };

        // Update the template
        await prisma.exerciseTemplate.update({
          where: { id: template.id },
          data: { name: exerciseName }
        });

        console.log(`✅ Updated ${muscleGroup} ${exerciseType} (${template.categoryType}): ${exerciseName.en}`);
        updatedCount++;
        exerciseCounters[key]++;
      } else {
        // Fallback name
        const exerciseName = {
          en: `${muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1)} ${exerciseType.toLowerCase()} Exercise`,
          ar: `تمرين ${muscleGroup} ${exerciseType.toLowerCase()}`
        };

        await prisma.exerciseTemplate.update({
          where: { id: template.id },
          data: { name: exerciseName }
        });

        console.log(`⚠️  Updated ${muscleGroup} ${exerciseType} (${template.categoryType}): ${exerciseName.en} (fallback)`);
        updatedCount++;
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} exercise templates with names!`);
    console.log('🎯 Exercise templates now have multilingual names for the program customizer!');

  } catch (error) {
    console.error('❌ Error updating exercise templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExerciseTemplatesWithNames();