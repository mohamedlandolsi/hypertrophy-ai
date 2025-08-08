const fs = require('fs');
const path = require('path');

function verifyTranslations() {
  console.log('🔍 Verifying ChatPage.toasts.imagePasted translations...\n');
  
  const languages = ['en', 'ar', 'fr'];
  const languageNames = {
    'en': 'English',
    'ar': 'Arabic', 
    'fr': 'French'
  };
  
  languages.forEach(lang => {
    const filePath = path.join(__dirname, 'messages', `${lang}.json`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const translations = JSON.parse(content);
      
      console.log(`📝 ${languageNames[lang]} (${lang}.json):`);
      
      // Check if ChatPage.toasts.imagePastedTitle exists
      if (translations.ChatPage?.toasts?.imagePastedTitle) {
        console.log(`  ✅ ChatPage.toasts.imagePastedTitle: "${translations.ChatPage.toasts.imagePastedTitle}"`);
      } else {
        console.log(`  ❌ ChatPage.toasts.imagePastedTitle: MISSING`);
      }
      
      // Check if ChatPage.toasts.imagePastedText exists
      if (translations.ChatPage?.toasts?.imagePastedText) {
        console.log(`  ✅ ChatPage.toasts.imagePastedText: "${translations.ChatPage.toasts.imagePastedText}"`);
      } else {
        console.log(`  ❌ ChatPage.toasts.imagePastedText: MISSING`);
      }
      
      // Check if duplicates were removed from top-level toasts
      const topLevelToasts = translations.toasts;
      if (topLevelToasts?.imagePastedTitle || topLevelToasts?.imagePastedText) {
        console.log(`  ⚠️  WARNING: Duplicate entries still exist in top-level toasts section`);
      } else {
        console.log(`  ✅ No duplicate entries in top-level toasts section`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`  ❌ Error reading ${lang}.json:`, error.message);
    }
  });
  
  console.log('🎯 Translation verification completed!');
}

verifyTranslations();
