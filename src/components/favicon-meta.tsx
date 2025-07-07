export default function FaviconMeta() {
  return (
    <>
      {/* Standard favicon */}
      <link rel="icon" type="image/x-icon" href="/favicon/favicon.ico" />
      
      {/* PNG favicons for different sizes */}
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
      
      {/* Apple Touch Icon */}
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
      
      {/* Android Chrome icons */}
      <link rel="icon" type="image/png" sizes="192x192" href="/favicon/android-chrome-192x192.png" />
      <link rel="icon" type="image/png" sizes="512x512" href="/favicon/android-chrome-512x512.png" />
      
      {/* Web App Manifest */}
      <link rel="manifest" href="/favicon/site.webmanifest" />
      
      {/* Theme color for mobile browsers */}
      <meta name="theme-color" content="#ffffff" />
      <meta name="msapplication-TileColor" content="#ffffff" />
      
      {/* Apple Web App */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="HypertroQ" />
    </>
  );
}
