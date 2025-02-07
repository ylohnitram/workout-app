import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@/lib/firebase-admin';
import { WorkoutLog } from '@/models/workoutLog';

export const dynamic = 'force-dynamic';

// GET - Získání historie tréninků
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    await connectDB();

    // Najdeme logy podle userId a seřadíme od nejnovějších
    const logs = await WorkoutLog.find({ userId })
      .sort({ startTime: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error('Error fetching workout logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout logs' },
      { status: 500 }
    );
  }
}

// POST - Uložení nového logu tréninku
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
    const {
      workoutId,
      startTime,
      endTime,
      duration,
      exercises
    } = data;

    // Validace povinných polí
    if (!workoutId || !startTime || !endTime || !Array.isArray(exercises)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Spočítáme statistiky
    let totalSets = 0;
    let completedSets = 0;

    exercises.forEach(exercise => {
      if (Array.isArray(exercise.sets)) {
        totalSets += exercise.sets.length;
        completedSets += exercise.sets.filter(set => set.isCompleted).length;
      }
    });

    // Vytvoříme log tréninku s vypočítanými statistikami
    const workoutLog = await WorkoutLog.create({
      userId,
      workoutId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      exercises: exercises.map(exercise => ({
        exerciseId: exercise.exerciseId,
        isSystem: exercise.isSystem,
        name: exercise.name,
        sets: exercise.sets.map(set => ({
          ...set,
          type: set.type || 'NORMAL',
          completedAt: set.completedAt ? new Date(set.completedAt) : undefined
        })),
        progress: exercise.progress
      })),
      totalProgress: totalSets > 0 ? (completedSets / totalSets) * 100 : 0,
      totalSets,
      completedSets
    });

    return NextResponse.json({ data: workoutLog });
  } catch (error) {
    console.error('Error saving workout log:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to save workout log',
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to save workout log' },
      { status: 500 }
    );
  }
}

// DELETE - Smazání logu tréninku
export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const url = new URL(req.url);
    const logId = url.searchParams.get('id');

    if (!logId) {
      return NextResponse.json(
        { error: 'Log ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Smažeme pouze log, který patří danému uživateli
    const log = await WorkoutLog.findOneAndDelete({
      _id: logId,
      userId
    });

    if (!log) {
      return NextResponse.json(
        { error: 'Log not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout log:', error);
    return NextResponse.json(
      { error: 'Failed to delete workout log' },
      { status: 500 }
    );
  }
}
