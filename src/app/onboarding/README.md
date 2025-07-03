# Onboarding Wizard Implementation

## Overview

The onboarding wizard is a multi-step form that guides new users through setting up their profile for personalized AI coaching. This implementation follows a progressive approach, gathering essential information without overwhelming the user.

## Features

### 🎯 Multi-Step Process
- **Step 1**: Personal Information (name, age, gender, height, weight, body fat %)
- **Step 2**: Training Information (experience, frequency, style, schedule, activity level)
- **Step 3**: Goals and Motivation (primary/secondary goals, target metrics, deadlines)
- **Step 4**: Training Environment (gym access, home setup, available equipment)

### 🔄 User-Friendly Features
- Progress indicator showing completion status
- Back/forward navigation between steps
- Skip option for users who want to start immediately
- Form data persistence across steps
- Responsive design for all devices

### 🚀 Smart Routing
- New users are automatically redirected to onboarding after email confirmation
- Completed users bypass onboarding and go directly to the chat interface
- Existing users can access onboarding later to complete their profile

## Database Schema

### User Model Updates
```prisma
model User {
  id                      String    @id @default(cuid())
  role                    String    @default("user")
  hasCompletedOnboarding  Boolean   @default(false) // NEW FIELD
  // ... other fields
}
```

### Client Memory Integration
All onboarding data is saved to the `ClientMemory` model, which the AI coach uses for personalization.

## File Structure

```
src/app/onboarding/
├── page.tsx                    # Main onboarding wizard
├── layout.tsx                  # Onboarding-specific layout
├── loading.tsx                 # Loading component
├── actions.ts                  # Server actions for saving data
└── _components/
    ├── step1-personal.tsx      # Personal information step
    ├── step2-training.tsx      # Training background step
    ├── step3-goals.tsx         # Goals and motivation step
    ├── step4-environment.tsx   # Training environment step
    └── onboarding-complete.tsx # Success message component
```

## Key Components

### Authentication Flow
1. User signs up and confirms email
2. Auth callback checks `hasCompletedOnboarding` status
3. New users → `/onboarding`
4. Existing users → `/chat`

### Server Actions
- `completeOnboarding()`: Marks onboarding as complete and redirects to chat
- `saveOnboardingData()`: Saves form data to ClientMemory and completes onboarding

### Form Validation
- Progressive validation with helpful error messages
- Optional fields clearly marked
- Smart defaults for common values

## Usage

### For New Users
1. Complete email verification
2. Automatic redirect to onboarding wizard
3. Fill out 4 steps (or skip anytime)
4. Start chatting with personalized AI coach

### For Existing Users
Users who skipped onboarding can complete it later through their profile settings.

## Customization

### Adding New Steps
1. Create new component in `_components/`
2. Add step to main `page.tsx`
3. Update `totalSteps` constant
4. Add form data interface properties

### Modifying Form Fields
- Update interface definitions in step components
- Ensure database schema supports new fields
- Update server actions to handle new data

## Technical Notes

### Performance
- Uses React Server Components where possible
- Minimal client-side JavaScript
- Efficient form state management

### Accessibility
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly progress indicators

### Error Handling
- Graceful error handling with toast notifications
- Fallback navigation options
- Data validation on both client and server

## Future Enhancements

### Potential Additions
- [ ] Profile picture upload
- [ ] Fitness assessment questionnaire
- [ ] Integration with fitness trackers
- [ ] Social features setup
- [ ] Notification preferences
- [ ] Goal photo uploads

### Analytics Integration
- Track completion rates by step
- Identify common drop-off points
- A/B test different onboarding flows
