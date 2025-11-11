'use client';

import { ProgramCustomizer } from './program-customizer';

interface WorkoutTemplatesProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userCustomization: any;
  locale: string;
  userId?: string;
}

export function WorkoutTemplates({
  program,
  userCustomization,
  locale,
  userId
}: WorkoutTemplatesProps) {
  // Simply render the ProgramCustomizer which has all the exercise selection functionality
  return (
    <ProgramCustomizer
      program={program}
      userCustomization={userCustomization}
      userId={userId || ''}
      locale={locale}
      onCustomizationSaved={() => {
        // Callback when customization is saved
        if (process.env.NODE_ENV === 'development') { console.log('Customization saved from Workouts tab'); }
      }}
    />
  );
}