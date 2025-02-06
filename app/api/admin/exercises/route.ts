import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@/lib/firebase-admin';
import { ExerciseModel } from '@/models/exercise';
import { checkIsAdmin } from '@/middleware/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userEmail = decodedToken.email || '';

    // Kontrola admin oprávnění
    const isAdmin = await checkIsAdmin(userEmail);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Vrátíme pouze systémové cviky
    const exercises = await ExerciseModel.find({ isSystem: true }).sort({ category: 1, name: 1 });
    return NextResponse.json({ data: exercises });
  } catch (error) {
    console.error('Exercise fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userEmail = decodedToken.email || '';

    // Kontrola admin oprávnění
    const isAdmin = await checkIsAdmin(userEmail);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const data = await req.json();
    if (!data.name) {
      return NextResponse.json(
        { error: 'Exercise name is required' },
        { status: 400 }
      );
    }

    // Vytvoříme systémový cvik
    const exerciseData = {
      ...data,
      isSystem: true
    };

    console.log('Creating system exercise with data:', exerciseData);

    const exercise = await ExerciseModel.create(exerciseData);
    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error saving system exercise:', error);
    if (error.code === 11000) { // MongoDB duplicate key error
      return NextResponse.json(
        { error: 'Exercise with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to save system exercise' },
      { status: 500 }
    );
  }
}
