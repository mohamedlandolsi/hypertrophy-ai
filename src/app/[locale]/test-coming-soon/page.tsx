// Test page to debug coming soon functionality
import ComingSoon from '@/components/coming-soon';

export default function TestComingSoonPage() {
  if (process.env.NODE_ENV === 'development') { console.log('NEXT_PUBLIC_CHAT_COMING_SOON:', process.env.NEXT_PUBLIC_CHAT_COMING_SOON); }
  
  return (
    <div>
      <h1>Test Page</h1>
      <p>Environment Variable: {process.env.NEXT_PUBLIC_CHAT_COMING_SOON}</p>
      <p>Should show coming soon: {process.env.NEXT_PUBLIC_CHAT_COMING_SOON === 'true' ? 'Yes' : 'No'}</p>
      
      <hr />
      
      <ComingSoon 
        title="Test Coming Soon"
        subtitle="Testing component"
        description="This is a test of the coming soon component"
      />
    </div>
  );
}
