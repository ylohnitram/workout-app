import { NextResponse } from 'next/server';
import { Workout } from '@/models/workout';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    // Získáme Firebase token z hlavičky
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

    const workout = await Workout.create({
      userId,
      name: data.name,
      exercises: data.exercises || [],
      date: new Date()
    });

    return NextResponse.json(workout);
  } catch (error) {
    console.error('Error saving workout:', error);
    return NextResponse.json(
      { error: 'Failed to save workout' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    await connectDB();
    const workouts = await Workout.find({ userId }).sort({ date: -1 });

    return NextResponse.json({ data: workouts });
  } catch (error) {
    console.error('Workout fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    );
  }
}
