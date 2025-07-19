// Simple test script to verify profile translations are working
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Profile Page Translation Implementation...\n');

// Check if translation files contain the new profile keys
const languages = ['en', 'ar', 'fr'];
let allGood = true;

for (const lang of languages) {
  const filePath = path.join(__dirname, 'messages', `${lang}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${lang}.json file not found`);
    allGood = false;
    continue;
  }

  const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Check if Profile.page exists
  if (!translations.Profile?.page) {
    console.log(`❌ ${lang}: Missing Profile.page section`);
    allGood = false;
    continue;
  }

  const profilePage = translations.Profile.page;
  const requiredKeys = [
    'title',
    'subtitle', 
    'pleaseLogin',
    'tabs.overview',
    'tabs.edit',
    'tabs.account',
    'welcomeHeader.welcomeBack',
    'coachSummary.title',
    'todaysProgress.title',
    'subscription.title',
    'quickActions.title'
  ];

  let missing = [];
  for (const key of requiredKeys) {
    if (!getNestedValue(profilePage, key)) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.log(`❌ ${lang}: Missing keys: ${missing.join(', ')}`);
    allGood = false;
  } else {
    console.log(`✅ ${lang}: All profile translation keys present`);
  }
}

// Check if the profile page component uses translations
const profilePagePath = path.join(__dirname, 'src', 'app', '[locale]', 'profile', 'page.tsx');
if (fs.existsSync(profilePagePath)) {
  const content = fs.readFileSync(profilePagePath, 'utf8');
  
  if (content.includes('useTranslations(') && content.includes("'Profile.page'")) {
    console.log('✅ Profile page component uses translations');
  } else {
    console.log('❌ Profile page component missing translation setup');
    allGood = false;
  }

  // Check for hardcoded text that should be translated
  const suspiciousTexts = [
    'Profile"',
    'Welcome back',
    'Quick Actions',
    'Account Overview'
  ];
  
  let foundHardcoded = [];
  for (const text of suspiciousTexts) {
    if (content.includes(text) && !content.includes(`t('`) && !content.includes(`{t(`)) {
      foundHardcoded.push(text);
    }
  }

  if (foundHardcoded.length > 0) {
    console.log(`⚠️  Potential hardcoded text found: ${foundHardcoded.join(', ')}`);
  }

} else {
  console.log('❌ Profile page component not found');
  allGood = false;
}

console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 All profile page translations appear to be working!');
  console.log('📝 Profile page has been successfully internationalized for EN, AR, and FR');
} else {
  console.log('❌ Some issues found with profile translations');
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}
