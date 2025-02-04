import { NextResponse } from 'next/server';
import { Workout } from '@/models/workout';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@/lib/firebase-admin';

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

    await connectDB();
    const data = await req.json();

    // Validace dat
    if (!data.name) {
      return NextResponse.json({ error: 'Workout name is required' }, { status: 400 });
    }

    const workout = await Workout.findOneAndUpdate(
      { _id: params.id, userId },
      {
        name: data.name,
        exercises: data.exercises || [],
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    return NextResponse.json(workout);
  } catch (error) {
    console.error('Error updating workout:', error);
    return NextResponse.json(
      { error: 'Failed to update workout' },
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

    await connectDB();
    const workout = await Workout.findOneAndDelete({ _id: params.id, userId });

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout:', error);
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    );
  }
}
