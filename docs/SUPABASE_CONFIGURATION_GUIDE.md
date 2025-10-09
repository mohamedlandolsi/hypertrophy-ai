# 🔧 Supabase Configuration Recommendations for HypertroQ

## 📋 Complete Supabase Setup Guide

### 1. 🔐 Authentication Settings

#### Go to: Supabase Dashboard → Authentication → Settings

**Site URL Configuration:**
```
Site URL: https://hypertroq.com
```

**Redirect URLs (Add all of these):**
```
https://hypertroq.com/auth/callback
https://hypertroq.com/
https://hypertroq.com/login
https://hypertroq.com/signup
https://hypertroq.com/update-password
https://hypertroq.vercel.app/auth/callback  (if using Vercel)
https://hypertroq.vercel.app/
https://hypertroq.vercel.app/login
https://hypertroq.vercel.app/signup
https://hypertroq.vercel.app/update-password
http://localhost:3000/auth/callback  (for development)
http://localhost:3000/
http://localhost:3000/login
http://localhost:3000/signup
http://localhost:3000/update-password
```

**Email Templates:**
- Customize email templates to match your brand
- Update "Confirm your signup" email template
- Update "Reset your password" email template
- Set your app name as "HypertroQ"

#### Custom Email Templates for HypertroQ (Spam-Optimized):

**1. Confirm Signup Email Template:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; border: 1px solid #e9ecef;">
  <!-- Header -->
  <div style="background-color: #667eea; padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: normal;">
      Welcome to HypertroQ
    </h1>
    <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">
      Your Fitness Coaching Platform
    </p>
  </div>
  
  <!-- Content -->
  <div style="background-color: white; padding: 30px;">
    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">
      Please verify your email address
    </h2>
    
    <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
      Hello,<br><br>
      Thank you for signing up for HypertroQ. To complete your registration, please verify your email address.
    </p>
    
    <p style="color: #666; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
      Click the link below to verify your account:
    </p>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 25px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background-color: #667eea; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-size: 16px;">
        Verify Email Address
      </a>
    </div>
    
    <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
      If the button does not work, copy this link:<br>
      <span style="color: #667eea; word-break: break-all;">{{ .ConfirmationURL }}</span>
    </p>
    
    <!-- Features Preview -->
    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 25px;">
      <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">
        What you can do with HypertroQ:
      </h3>
      <ul style="color: #666; line-height: 1.6; padding-left: 20px;">
        <li>Create personalized workout plans</li>
        <li>Access fitness knowledge and resources</li>
        <li>Track your fitness progress</li>
        <li>Get coaching support</li>
      </ul>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
    <p style="color: #999; margin: 0; font-size: 14px;">
      Need assistance? Contact us at support@hypertroq.com
    </p>
    <p style="color: #ccc; margin: 10px 0 0 0; font-size: 12px;">
      HypertroQ Fitness Platform<br>
      Email sent to {{ .Email }}
    </p>
  </div>
</div>
```

**2. Reset Password Email Template:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; border: 1px solid #e9ecef;">
  <!-- Header -->
  <div style="background-color: #dc3545; padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: normal;">
      Password Reset Request
    </h1>
    <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">
      HypertroQ Account Security
    </p>
  </div>
  
  <!-- Content -->
  <div style="background-color: white; padding: 30px;">
    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">
      Reset your account password
    </h2>
    
    <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
      Hello,<br><br>
      A password reset was requested for your HypertroQ account. If you did not request this change, please ignore this email.
    </p>
    
    <p style="color: #666; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
      To create a new password, click the link below:
    </p>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 25px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background-color: #dc3545; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-size: 16px;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
      If the button does not work, copy this link:<br>
      <span style="color: #dc3545; word-break: break-all;">{{ .ConfirmationURL }}</span>
    </p>
    
    <!-- Security Notice -->
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 25px 0;">
      <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">
        Security Information
      </h4>
      <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.5;">
        This link will expire in 60 minutes. If you did not request this reset, please contact our support team.
      </p>
    </div>
    
    <!-- Tips -->
    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 25px;">
      <h4 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">
        Password Guidelines:
      </h4>
      <ul style="color: #666; line-height: 1.6; padding-left: 20px; font-size: 14px;">
        <li>Use at least 8 characters</li>
        <li>Include uppercase and lowercase letters</li>
        <li>Add numbers and special characters</li>
        <li>Avoid common words or personal information</li>
      </ul>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
    <p style="color: #999; margin: 0; font-size: 14px;">
      Need assistance? Contact us at support@hypertroq.com
    </p>
    <p style="color: #ccc; margin: 10px 0 0 0; font-size: 12px;">
      HypertroQ Fitness Platform<br>
      Email sent to {{ .Email }}
    </p>
  </div>
</div>
```

**3. Change Email Address Confirmation Template:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; border: 1px solid #e9ecef;">
  <!-- Header -->
  <div style="background-color: #28a745; padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: normal;">
      Email Address Update
    </h1>
    <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">
      HypertroQ Account Settings
    </p>
  </div>
  
  <!-- Content -->
  <div style="background-color: white; padding: 30px;">
    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">
      Verify your new email address
    </h2>
    
    <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
      Hello,<br><br>
      You have requested to update your email address for your HypertroQ account. Please verify your new email address to complete this change.
    </p>
    
    <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0;">
      <p style="color: #666; margin: 0; font-size: 14px;">
        <strong>New email address:</strong> {{ .Email }}
      </p>
    </div>
    
    <p style="color: #666; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px;">
      Click the link below to verify this email address:
    </p>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 25px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background-color: #28a745; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-size: 16px;">
        Verify Email Address
      </a>
    </div>
    
    <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
      If the button does not work, copy this link:<br>
      <span style="color: #28a745; word-break: break-all;">{{ .ConfirmationURL }}</span>
    </p>
    
    <!-- Security Notice -->
    <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; margin: 25px 0;">
      <h4 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px;">
        Account Security
      </h4>
      <p style="color: #0c5460; margin: 0; font-size: 14px; line-height: 1.5;">
        If you did not request this email change, please contact our support team immediately.
      </p>
    </div>
    
    <!-- What happens next -->
    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 25px;">
      <h4 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">
        After verification:
      </h4>
      <ul style="color: #666; line-height: 1.6; padding-left: 20px; font-size: 14px;">
        <li>Your email address will be updated</li>
        <li>Future emails will be sent to this address</li>
        <li>Your account data remains unchanged</li>
        <li>Your login credentials stay the same</li>
      </ul>
    </div>
  </div>
  
  <!-- Footer -->
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
    <p style="color: #999; margin: 0; font-size: 14px;">
      Need assistance? Contact us at support@hypertroq.com
    </p>
    <p style="color: #ccc; margin: 10px 0 0 0; font-size: 12px;">
      HypertroQ Fitness Platform<br>
      Email sent to {{ .Email }}
    </p>
  </div>
</div>
```

### ✅ Spam-Optimized Email Templates - Key Improvements:

**Anti-Spam Optimizations Applied:**
1. **Removed emojis** - Often flagged as unprofessional or phishing
2. **Simplified language** - Eliminated phrases like "Hi there!" and "Almost there!"
3. **Professional tone** - Used formal greeting "Hello" instead of casual language
4. **Removed gradients** - Used solid colors for better email client compatibility
5. **Standard fonts** - Changed to Arial for universal compatibility
6. **Clear subject intent** - More descriptive headers without marketing language
7. **Reduced urgency language** - Removed time pressure phrases
8. **Professional CTA buttons** - Simple, clear action words
9. **Legitimate contact info** - Added proper support email addresses
10. **Standard formatting** - Used conventional email layout patterns

**Deliverability Improvements:**
- **Text-to-image ratio** optimized for spam filters
- **No suspicious phrases** that trigger phishing detection
- **Professional business language** throughout
- **Clear sender identification** with company name
- **Proper email structure** with headers, content, and footer
- **Contact information** clearly displayed
- **Legitimate links** without suspicious formatting

These templates should now pass spam filters much more reliably while maintaining a professional appearance that builds trust with your users.

### 2. 🔑 OAuth Providers Configuration

#### Google OAuth Setup:
1. **Go to**: Authentication → Providers → Google
2. **Enable Google provider**
3. **Add OAuth URLs**:
   - Authorized JavaScript origins: `https://hypertroq.com`, `https://hypertroq.vercel.app`
   - Authorized redirect URIs: `https://[your-project-ref].supabase.co/auth/v1/callback`

#### Additional Providers (Optional):
- **GitHub**: For developer-friendly login
- **Apple**: For iOS users
- **Discord**: For community-focused approach

### 3. 💾 Database Configuration

#### Row Level Security (RLS) Policies:

**For User table:**
```sql
-- Enable RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON "User"
FOR SELECT USING (id = auth.uid()::text);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON "User"
FOR UPDATE USING (id = auth.uid()::text);

-- Admin users can read all data
CREATE POLICY "Admins can read all users" ON "User"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);
```

**For Chat table:**
```sql
-- Enable RLS
ALTER TABLE "Chat" ENABLE ROW LEVEL SECURITY;

-- Users can only access their own chats
CREATE POLICY "Users can access own chats" ON "Chat"
FOR ALL USING (userId = auth.uid()::text);

-- Admin users can access all chats
CREATE POLICY "Admins can access all chats" ON "Chat"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);
```

**For Message table:**
```sql
-- Enable RLS
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- Users can access messages from their own chats
CREATE POLICY "Users can access own messages" ON "Message"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Chat" 
    WHERE "Chat".id = "Message".chatId 
    AND "Chat".userId = auth.uid()::text
  )
);
```

**For KnowledgeItem table:**
```sql
-- Enable RLS
ALTER TABLE "KnowledgeItem" ENABLE ROW LEVEL SECURITY;

-- Users can read all knowledge items
CREATE POLICY "Users can read knowledge items" ON "KnowledgeItem"
FOR SELECT USING (true);

-- Only admins can create/update/delete knowledge items
CREATE POLICY "Admins can manage knowledge items" ON "KnowledgeItem"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);
```

**For ClientMemory table:**
```sql
-- Enable RLS
ALTER TABLE "ClientMemory" ENABLE ROW LEVEL SECURITY;

-- Users can only access their own memory
CREATE POLICY "Users can access own memory" ON "ClientMemory"
FOR ALL USING (userId = auth.uid()::text);
```

**For Subscription table:**
```sql
-- Enable RLS
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;

-- Users can only access their own subscription
CREATE POLICY "Users can access own subscription" ON "Subscription"
FOR SELECT USING (userId = auth.uid()::text);

-- Only system can modify subscriptions (via service role)
CREATE POLICY "System can manage subscriptions" ON "Subscription"
FOR ALL USING (auth.role() = 'service_role');
```

### 4. 💽 Storage Configuration

#### Create Storage Buckets:

**Files Bucket (for PDF uploads):**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', false);
```

**Storage Policies:**
```sql
-- Users can upload their own files
CREATE POLICY "Users can upload own files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'files' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Users can read their own files
CREATE POLICY "Users can read own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'files' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Users can delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'files' AND 
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Admins can access all files
CREATE POLICY "Admins can access all files" ON storage.objects
FOR ALL USING (
  bucket_id = 'files' AND
  EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);
```

### 5. 🔧 Edge Functions (Optional)

Consider creating Edge Functions for:
- **Image processing**: Resize uploaded images
- **PDF processing**: Extract text from PDFs
- **Email notifications**: Custom email templates
- **Webhook handling**: LemonSqueezy webhook processing

### 6. 📊 Database Functions

**Admin Check Function:**
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "User" 
    WHERE id = auth.uid()::text AND role = 'admin'
  );
$$;
```

**User Plan Check Function:**
```sql
CREATE OR REPLACE FUNCTION get_user_plan()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT plan FROM "User" 
  WHERE id = auth.uid()::text;
$$;
```

### 7. 🔔 Webhooks Configuration

**Set up webhooks for:**
- **LemonSqueezy**: `https://yourdomain.com/api/webhooks/lemon-squeezy`
- **Stripe** (if used): `https://yourdomain.com/api/webhooks/stripe`

### 8. 📈 Analytics & Monitoring

**Enable in Supabase Dashboard:**
- **Auth analytics**: Track login/signup metrics
- **Database analytics**: Monitor query performance
- **Storage analytics**: Track file upload usage
- **API analytics**: Monitor API usage patterns

### 9. 🛡️ Security Best Practices

**API Keys Management:**
- **Never expose service role key** in client-side code
- **Rotate keys regularly** (every 90 days)
- **Use environment variables** for all sensitive data
- **Enable 2FA** on your Supabase account

**Database Security:**
- **Enable RLS** on all tables
- **Use prepared statements** in functions
- **Validate all inputs** in API endpoints
- **Audit admin actions** regularly

### 10. 🚀 Performance Optimization

**Database Indexes:**
```sql
-- Improve chat queries
CREATE INDEX IF NOT EXISTS idx_chat_user_created 
ON "Chat" (userId, createdAt DESC);

-- Improve message queries
CREATE INDEX IF NOT EXISTS idx_message_chat_created 
ON "Message" (chatId, createdAt);

-- Improve knowledge search
CREATE INDEX IF NOT EXISTS idx_knowledge_user_created 
ON "KnowledgeItem" (userId, createdAt DESC);

-- Improve subscription queries
CREATE INDEX IF NOT EXISTS idx_subscription_user_status 
ON "Subscription" (userId, status);
```

**Connection Pooling:**
- Enable connection pooling in production
- Set appropriate pool size (recommended: 10-20 for most apps)

### 11. 🌍 Multi-language Support

**Locale Configuration:**
```sql
-- Add locale column to User table if not exists
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS locale VARCHAR(5) DEFAULT 'en';

-- Create index for locale queries
CREATE INDEX IF NOT EXISTS idx_user_locale ON "User" (locale);
```

### 12. 📱 Real-time Subscriptions

**Enable real-time for:**
- **Chat messages**: Real-time message delivery
- **Subscription status**: Real-time billing updates
- **Admin notifications**: Real-time admin alerts

**JavaScript Setup:**
```javascript
// Enable real-time for chat
const subscription = supabase
  .channel('chat_channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'Message',
    filter: `chatId=eq.${chatId}`
  }, (payload) => {
    // Handle new message
  })
  .subscribe();
```

### 13. 🔄 Environment Variables Required

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://hypertroq.com

# Optional: Database Direct Connection (for Prisma)
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require
```

### 14. 🧪 Testing Configuration

**Test Policies:**
```bash
# Run in your project
node create-admin.js  # Create test admin user
node test-supabase.js # Test Supabase connection
node auth-security-tests.js # Test security measures
```

### 15. 🚨 Monitoring & Alerts

**Set up alerts for:**
- High error rates on auth endpoints
- Unusual database query patterns
- Storage quota approaching limits
- Failed webhook deliveries
- Suspicious login attempts

### 16. 📋 Checklist for Production

- [ ] RLS policies enabled on all tables
- [ ] OAuth providers configured
- [ ] Email templates customized
- [ ] Storage buckets and policies set up
- [ ] Database indexes created
- [ ] Webhooks configured and tested
- [ ] Environment variables set in production
- [ ] Analytics and monitoring enabled
- [ ] Security best practices implemented
- [ ] Admin user created and tested
- [ ] All redirect URLs configured
- [ ] SSL certificates valid
- [ ] Backup strategy in place

---

## 🎯 Quick Setup Commands

Run these in your Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Chat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientMemory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', false);

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_chat_user_created ON "Chat" (userId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_message_chat_created ON "Message" (chatId, createdAt);
```

This comprehensive configuration will ensure your HypertroQ platform is secure, performant, and ready for production! 🚀
