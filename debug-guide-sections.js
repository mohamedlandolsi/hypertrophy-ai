const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const normalizeGuideSectionsFromArray = (sections) =>
  sections
    .map((section, index) => {
      if (section && typeof section === 'object') {
        const id = typeof section.id === 'string' && section.id.trim().length > 0
          ? section.id
          : `guide-${index + 1}`;
        const title = typeof section.title === 'string' && section.title.trim().length > 0
          ? section.title
          : `Section ${index + 1}`;
        const order = typeof section.order === 'number' ? section.order : index + 1;
        const contentValue = section.content;
        const content = typeof contentValue === 'string'
          ? contentValue
          : JSON.stringify(contentValue ?? '');

        return { id, title, content, order };
      }

      return {
        id: `guide-${index + 1}`,
        title: `Section ${index + 1}`,
        content: typeof section === 'string' ? section : JSON.stringify(section ?? ''),
        order: index + 1,
      };
    })
    .sort((a, b) => a.order - b.order)
    .map((section, index) => ({ ...section, order: index + 1 }));

const normalizeGuideSections = (rawContent) => {
  if (!rawContent) return [];

  if (Array.isArray(rawContent)) {
    return normalizeGuideSectionsFromArray(rawContent);
  }

  if (typeof rawContent === 'object') {
    const contentObj = rawContent;
    if (Array.isArray(contentObj.sections)) {
      return normalizeGuideSectionsFromArray(contentObj.sections);
    }

    return Object.entries(contentObj).map(([key, value], index) => ({
      id: `guide-${key}`,
      title: key.toUpperCase(),
      content: typeof value === 'string' ? value : JSON.stringify(value ?? ''),
      order: index + 1,
    }));
  }

  return [];
};

const stripHtml = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

async function testGuideSections() {
  try {
    console.log('🔍 Testing Guide Sections functionality...\n');

    // Find a program with guide content
    const programsWithGuides = await prisma.trainingProgram.findMany({
      include: {
        programGuide: true,
      },
      where: {
        programGuide: {
          isNot: null
        }
      },
      take: 3
    });

    if (programsWithGuides.length > 0) {
      console.log(`✅ Found ${programsWithGuides.length} programs with guide content:`);
      
      programsWithGuides.forEach((program, index) => {
        console.log(`\n📋 Program ${index + 1}: ${program.name.en}`);
        console.log(`   ID: ${program.id}`);
        if (program.programGuide) {
          const sections = normalizeGuideSections(program.programGuide.content);
          console.log(`   Sections: ${sections.length}`);
          sections.forEach((section) => {
            console.log(`     • [${section.order}] ${section.title} — ${stripHtml(section.content).slice(0, 80)}${stripHtml(section.content).length > 80 ? '…' : ''}`);
          });
        }
      });

      console.log('\n🧪 Testing data transformation logic...\n');

      // Simulate how guide content should be loaded in the edit page
      const testProgram = programsWithGuides[0];
      const guideSections = normalizeGuideSections(testProgram.programGuide?.content);

      console.log('📄 Simulated guide sections for form:');
      guideSections.forEach(section => {
        console.log(`   - ${section.title}: "${stripHtml(section.content).slice(0, 50)}${stripHtml(section.content).length > 50 ? '…' : ''}"`);
      });

      console.log('\n💾 Normalized structure to save (JSON):');
      console.log(`   ${JSON.stringify(guideSections, null, 2).substring(0, 200)}${guideSections.length > 0 ? '...' : ''}`);

    } else {
      console.log('ℹ️  No programs with guide content found. This is normal if no guides have been created yet.');
      
      // Show how to create test data
      console.log('\n💡 To test guide sections:');
      console.log('1. Go to the admin panel');
      console.log('2. Create or edit a training program');
      console.log('3. Add content to the Guide tab with sections titled "EN", "AR", "FR"');
      console.log('4. Save the program');
      console.log('5. Edit it again to verify the guide sections load correctly');
    }

    // Show all programs for reference
    const allPrograms = await prisma.trainingProgram.findMany({
      select: {
        id: true,
        name: true,
        programGuide: {
          select: {
            content: true
          }
        }
      }
    });

    console.log(`\n📊 Total programs in database: ${allPrograms.length}`);
    console.log(`📊 Programs with guides: ${allPrograms.filter(p => p.programGuide).length}`);

  } catch (error) {
    console.error('❌ Error testing guide sections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGuideSections();