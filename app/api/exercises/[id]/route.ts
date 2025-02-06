import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@/lib/firebase-admin';
import { ExerciseModel } from '@/models/exercise';
import { checkIsAdmin } from '@/middleware/adminAuth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || '';

    await connectDB();

    const data = await req.json();
    const isAdmin = await checkIsAdmin(userEmail);

    // Najdeme existující cvik
    const existingExercise = await ExerciseModel.findById(params.id);
    if (!existingExercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Kontrola oprávnění
    if (existingExercise.isSystem && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (!existingExercise.isSystem && existingExercise.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update cviku se zachováním původních hodnot isSystem a userId
    const exercise = await ExerciseModel.findByIdAndUpdate(
      params.id,
      {
        ...data,
        isSystem: existingExercise.isSystem,
        userId: existingExercise.userId
      },
      { new: true }
    );

    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error updating exercise:', error);
    return NextResponse.json(
      { error: 'Failed to update exercise' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || '';

    await connectDB();

    // Najdeme existující cvik
    const exercise = await ExerciseModel.findById(params.id);
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    // Kontrola oprávnění
    const isAdmin = await checkIsAdmin(userEmail);
    if (exercise.isSystem && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (!exercise.isSystem && exercise.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await ExerciseModel.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return NextResponse.json(
      { error: 'Failed to delete exercise' },
      { status: 500 }
    );
  }
}
