'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProgramCreationInput } from '@/lib/validations/program-creation';

interface PreviewModeProps {
  data: ProgramCreationInput;
}

export function PreviewMode({ data }: PreviewModeProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Program Preview</CardTitle>
          <CardDescription>
            Preview how your training program will appear to users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{data.name?.en || 'Untitled Program'}</h3>
              <p className="text-muted-foreground">{data.description?.en || 'No description provided'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span> {data.programType}
              </div>
              <div>
                <span className="font-medium">Difficulty:</span> {data.difficulty}
              </div>
              <div>
                <span className="font-medium">Duration:</span> {data.estimatedDuration} weeks
              </div>
              <div>
                <span className="font-medium">Sessions/week:</span> {data.sessionCount}
              </div>
              <div>
                <span className="font-medium">Price:</span> ${(data.price / 100).toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Status:</span> {data.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}