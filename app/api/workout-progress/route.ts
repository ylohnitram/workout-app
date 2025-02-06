import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@/lib/firebase-admin';
import { WorkoutProgress } from '@/models/workoutProgress';

export const dynamic = 'force-dynamic';

// GET - Získání aktivního průběhu tréninku
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

    // Načteme aktivní průběh tréninku uživatele
    const activeWorkout = await WorkoutProgress.findOne({
      userId,
      isActive: true
    });

    return NextResponse.json({ data: activeWorkout });
  } catch (error) {
    console.error('Error fetching workout progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout progress' },
      { status: 500 }
    );
  }
}

// POST - Vytvoření nového průběhu tréninku
export async function POST(req: Request) {
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
    const { workoutId, startTime, exercises } = data;

    // Validace dat
    if (!workoutId || !startTime || !Array.isArray(exercises)) {
      return NextResponse.json(
        { error: 'Invalid workout progress data' },
        { status: 400 }
      );
    }

    // Deaktivujeme případný předchozí aktivní trénink
    await WorkoutProgress.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    // Vytvoříme nový průběh
    const progress = await WorkoutProgress.create({
      userId,
      workoutId,
      startTime: new Date(startTime),
      lastSaveTime: new Date(),
      isActive: true,
      exercises: exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map(set => ({
          ...set,
          completedAt: set.completedAt ? new Date(set.completedAt) : undefined
        }))
      })),
      progress: 0
    });

    return NextResponse.json({ data: progress });
  } catch (error) {
    console.error('Error creating workout progress:', error);
    return NextResponse.json(
      { error: 'Failed to create workout progress' },
      { status: 500 }
    );
  }
}

// PUT - Aktualizace průběhu tréninku
export async function PUT(req: Request) {
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
    const { workoutId, exercises, progress, isActive = true } = data;

    // Validace dat
    if (!workoutId || !Array.isArray(exercises)) {
      return NextResponse.json(
        { error: 'Invalid workout progress data' },
        { status: 400 }
      );
    }

    // Aktualizujeme průběh
    const updated = await WorkoutProgress.findOneAndUpdate(
      { userId, workoutId, isActive: true },
      {
        exercises: exercises.map(exercise => ({
          ...exercise,
          sets: exercise.sets.map(set => ({
            ...set,
            completedAt: set.completedAt ? new Date(set.completedAt) : undefined
          }))
        })),
        progress,
        isActive,
        lastSaveTime: new Date()
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'No active workout found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating workout progress:', error);
    return NextResponse.json(
      { error: 'Failed to update workout progress' },
      { status: 500 }
    );
  }
}

// DELETE - Vymazání průběhu tréninku (pro případ potřeby zrušit trénink)
export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    await connectDB();

    // Deaktivujeme všechny aktivní tréninky uživatele
    await WorkoutProgress.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout progress:', error);
    return NextResponse.json(
      { error: 'Failed to delete workout progress' },
      { status: 500 }
    );
  }
}
