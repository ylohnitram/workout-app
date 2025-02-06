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

    // Pokud je admin, vrátíme všechny systémové cviky
    // Pokud není admin, vrátíme jen jeho vlastní cviky
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

    // Pokud není admin, nemůže vytvářet systémové cviky
    const isAdmin = await checkIsAdmin(userEmail);
    if (data.isSystem && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized to create system exercises' },
        { status: 403 }
      );
    }

    // Pro běžné uživatele nastavíme userId a isSystem: false
    const exerciseData = isAdmin ? data : {
      ...data,
      userId,
      isSystem: false
    };

    const exercise = await ExerciseModel.create(exerciseData);
    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error saving exercise:', error);
    return NextResponse.json(
      { error: 'Failed to save exercise' },
      { status: 500 }
    );
  }
}
