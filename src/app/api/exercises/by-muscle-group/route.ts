import { NextRequest, NextResponse } from 'next/server';
import { getExercisesByMuscleGroup } from '@/lib/exercise-validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const muscleGroup = searchParams.get('muscleGroup');

    if (!muscleGroup) {
      return NextResponse.json(
        { error: 'Muscle group parameter is required' },
        { status: 400 }
      );
    }

    const exercises = await getExercisesByMuscleGroup(muscleGroup);
    
    return NextResponse.json({ exercises });
  } catch (error) {
    console.error('Failed to fetch exercises by muscle group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}