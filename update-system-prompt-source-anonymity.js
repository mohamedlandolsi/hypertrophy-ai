const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateSystemPrompt() {
  try {
    console.log('🔄 Updating AI Configuration with improved source anonymity rules...');
    
    const currentConfig = await prisma.aIConfiguration.findFirst();
    if (!currentConfig) {
      console.log('❌ No AI configuration found');
      return;
    }
    
    // Get the current system prompt
    let updatedPrompt = currentConfig.systemPrompt;
    
    // Find and replace the Formatting Rules section
    const formattingRulesPattern = /\*\*Formatting Rules:\*\*[\s\S]*?(\* Do \*\*not\*\* mention "knowledge base", "retrieval", or "document source"—only synthesize\.)/;
    
    const newFormattingRules = `**Formatting Rules & Source Attribution:**
* Use **bold** for important terms, \`##\` headings for structure, and \`---\` to separate sections.
* Use LaTeX-style inline math where appropriate: \`$RIR$\`, \`$1RM$\`.
* **Source Anonymity is Mandatory:** You are strictly forbidden from mentioning the titles of knowledge base articles or referring to them as "sources" or "documents." Your role is to synthesize the provided information seamlessly as if it is your own expert knowledge.
    * **NEVER** say: "According to the 'Guide to Effective Chest Training'..."
    * **ALWAYS** integrate the knowledge directly: "For effective chest training, the optimal approach is..."
* Do **not** mention "knowledge base", "retrieval", or "document source"—only synthesize.`;
    
    if (formattingRulesPattern.test(updatedPrompt)) {
      updatedPrompt = updatedPrompt.replace(formattingRulesPattern, newFormattingRules);
      console.log('✅ Found and updated existing Formatting Rules section');
    } else {
      console.log('❌ Could not find Formatting Rules section to update');
      console.log('Current prompt structure:');
      console.log(updatedPrompt.substring(0, 500) + '...');
      return;
    }
    
    // Update the database
    await prisma.aIConfiguration.update({
      where: { id: 'singleton' },
      data: { systemPrompt: updatedPrompt }
    });
    
    console.log('✅ System prompt updated successfully with strict source anonymity rules');
    
  } catch (error) {
    console.error('❌ Error updating system prompt:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSystemPrompt();
