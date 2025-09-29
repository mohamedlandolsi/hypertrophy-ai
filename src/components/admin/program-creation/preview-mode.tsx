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
                <span className="font-medium">Structures:</span> {data.programStructures?.length || 0} structure(s) defined
              </div>
              <div>
                <span className="font-medium">Categories:</span> {data.categories?.join(', ') || 'None selected'}
              </div>
              <div>
                <span className="font-medium">Price:</span> ${(data.price / 100 * 0.32).toFixed(2)} USD (≈ {(data.price / 100).toFixed(2)} TND)
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