// Quick test to verify all translation keys exist
const fs = require('fs');
const path = require('path');

// Load translation files
const enMessages = JSON.parse(fs.readFileSync(path.join(__dirname, 'messages', 'en.json'), 'utf8'));
const arMessages = JSON.parse(fs.readFileSync(path.join(__dirname, 'messages', 'ar.json'), 'utf8'));
const frMessages = JSON.parse(fs.readFileSync(path.join(__dirname, 'messages', 'fr.json'), 'utf8'));

// Function to check if key exists in nested object
function hasKey(obj, keyPath) {
  return keyPath.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj) !== null;
}

// Test keys we are actually using in the code
const testKeys = [
  'HomePage.features.latestResearch.title',
  'HomePage.features.latestResearch.description',
  'HomePage.features.mythFreeTraining.title',
  'HomePage.features.mythFreeTraining.description',
  'HomePage.features.optimizedProgramming.title',
  'HomePage.features.optimizedProgramming.description',
  'HomePage.howToUse.title',
  'HomePage.howToUse.subtitle',
  'HomePage.howToUse.steps.createAccount.title',
  'HomePage.howToUse.steps.createAccount.description',
  'HomePage.howToUse.steps.completeProfile.title',
  'HomePage.howToUse.steps.completeProfile.description',
  'HomePage.howToUse.steps.startChatting.title',
  'HomePage.howToUse.steps.startChatting.description',
  'HomePage.howToUse.steps.upgradeForMore.title',
  'HomePage.howToUse.steps.upgradeForMore.description',
  'HomePage.whyChoose.title',
  'HomePage.whyChoose.subtitle',
  'HomePage.whyChoose.benefits.personalTrainer.title',
  'HomePage.whyChoose.benefits.personalTrainer.description',
  'HomePage.whyChoose.benefits.personalizedProgramming.title',
  'HomePage.whyChoose.benefits.personalizedProgramming.description',
  'HomePage.whyChoose.benefits.evidenceBased.title',
  'HomePage.whyChoose.benefits.evidenceBased.description',
  'HomePage.whyChoose.benefits.continuousLearning.title',
  'HomePage.whyChoose.benefits.continuousLearning.description',
  'HomePage.whyChoose.specialFeatures.title',
  'HomePage.whyChoose.specialFeatures.subtitle',
  'HomePage.whyChoose.specialFeatures.fitness',
  'HomePage.whyChoose.specialFeatures.myths',
  'HomePage.whyChoose.specialFeatures.personalized',
  'HomePage.whyChoose.specialFeatures.programs',
  'HomePage.finalCta.title',
  'HomePage.finalCta.subtitle',
  'HomePage.finalCta.freeMessages',
  'HomePage.finalCta.getStartedFree',
  'HomePage.finalCta.viewPricing',
  'HomePage.finalCta.instantAccess'
];

console.log('Testing translation keys...\n');

let allKeysExist = true;

testKeys.forEach(key => {
  const enExists = hasKey(enMessages, key);
  const arExists = hasKey(arMessages, key);
  const frExists = hasKey(frMessages, key);
  
  if (!enExists || !arExists || !frExists) {
    console.log(`❌ Missing key: ${key}`);
    if (!enExists) console.log(`   - Missing in EN`);
    if (!arExists) console.log(`   - Missing in AR`);
    if (!frExists) console.log(`   - Missing in FR`);
    allKeysExist = false;
  } else {
    console.log(`✅ ${key}`);
  }
});

if (allKeysExist) {
  console.log('\n🎉 All translation keys exist in all languages!');
} else {
  console.log('\n❌ Some translation keys are missing.');
}
