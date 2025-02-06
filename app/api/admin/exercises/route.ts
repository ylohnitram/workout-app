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

    const isAdmin = await checkIsAdmin(userEmail);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Pro admina vracíme jen systémové cviky
    const query = { isSystem: true };

    console.log('Fetching system exercises with query:', query);
    const exercises = await ExerciseModel.find(query).sort({ name: 1 });
    console.log('Found system exercises:', exercises);

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

    // Přidáme flag isSystem
    const exerciseData = {
      ...data,
      isSystem: true
    };

    console.log('Creating system exercise with data:', exerciseData);

    const exercise = await ExerciseModel.create(exerciseData);
    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error saving system exercise:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save system exercise', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
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
    if (!data._id || !data.name) {
      return NextResponse.json(
        { error: 'Exercise ID and name are required' },
        { status: 400 }
      );
    }

    // Ujistíme se, že upravujeme jen systémový cvik
    const exercise = await ExerciseModel.findOneAndUpdate(
      { _id: data._id, isSystem: true },
      { ...data, isSystem: true },
      { new: true }
    );

    if (!exercise) {
      return NextResponse.json(
        { error: 'System exercise not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error updating system exercise:', error);
    return NextResponse.json(
      { error: 'Failed to update system exercise' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
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

    const { id } = req.params;
    
    // Ujistíme se, že mažeme jen systémový cvik
    const exercise = await ExerciseModel.findOneAndDelete({ _id: id, isSystem: true });

    if (!exercise) {
      return NextResponse.json(
        { error: 'System exercise not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting system exercise:', error);
    return NextResponse.json(
      { error: 'Failed to delete system exercise' },
      { status: 500 }
    );
  }
}
