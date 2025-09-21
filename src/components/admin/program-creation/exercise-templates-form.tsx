'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ExerciseTemplatesForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercise Templates</CardTitle>
        <CardDescription>
          Configure exercise selection rules and volume guidelines
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Exercise templates form coming soon...</p>
      </CardContent>
    </Card>
  );
}