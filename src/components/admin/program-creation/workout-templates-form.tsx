'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function WorkoutTemplatesForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout Templates</CardTitle>
        <CardDescription>
          Define workout sessions and muscle group assignments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Workout templates form coming soon...</p>
      </CardContent>
    </Card>
  );
}