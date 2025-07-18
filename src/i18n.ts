import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  // Provide a fallback locale if none is provided
  const resolvedLocale = locale || 'en';
  
  // Dynamically import the locale messages
  let messages;
  try {
    messages = (await import(`../messages/${resolvedLocale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${resolvedLocale}:`, error);
    // Fallback to English if the locale file doesn't exist
    messages = (await import(`../messages/en.json`)).default;
  }
  
  return {
    locale: resolvedLocale,
    messages
  };
});
