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
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || '';

    await connectDB();

    const isAdmin = await checkIsAdmin(userEmail);
    const query = isAdmin 
      ? { isSystem: true }
      : { userId, isSystem: false };

    const exercises = await ExerciseModel.find(query).sort({ name: 1 });
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
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || '';

    await connectDB();

    const data = await req.json();
    if (!data.name) {
      return NextResponse.json(
        { error: 'Exercise name is required' },
        { status: 400 }
      );
    }

    const isAdmin = await checkIsAdmin(userEmail);
    
    // Sestavíme data pro vytvoření cviku
    const exerciseData = {
      name: data.name,
      category: data.category,
      description: data.description,
      isSystem: isAdmin ? data.isSystem : false,
      // Pro uživatelské cviky vždy přidáme userId
      ...((!isAdmin || !data.isSystem) && { userId })
    };

    console.log('Creating exercise with data:', exerciseData);

    const exercise = await ExerciseModel.create(exerciseData);
    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error saving exercise:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save exercise', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
