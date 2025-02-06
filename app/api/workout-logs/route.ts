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

    // Parametry pro filtrování
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const workoutId = url.searchParams.get('workoutId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    await connectDB();

    let query;
    if (workoutId) {
      // Historie konkrétního workoutu
      query = await WorkoutLog.findWorkoutLogs(workoutId, limit);
    } else if (startDate && endDate) {
      // Historie v časovém rozmezí
      query = await WorkoutLog.findDateRangeLogs(
        userId,
        new Date(startDate),
        new Date(endDate)
      );
    } else {
      // Poslední tréninky
      query = await WorkoutLog.findUserLogs(userId, limit);
    }

    const logs = await query.exec();
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

    // Vytvoříme log tréninku
    const workoutLog = await WorkoutLog.create({
      userId,
      workoutId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      exercises: exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map(set => ({
          ...set,
          completedAt: set.completedAt ? new Date(set.completedAt) : undefined
        }))
      }))
    });

    // Okamžitě načteme vytvořený log pro získání vypočítaných polí
    const savedLog = await WorkoutLog.findById(workoutLog._id);

    return NextResponse.json({ data: savedLog });
  } catch (error) {
    console.error('Error saving workout log:', error);
    return NextResponse.json(
      { error: 'Failed to save workout log' },
      { status: 500 }
    );
  }
}

// DELETE - Smazání logu tréninku (volitelné, může být potřeba pro opravu chyb)
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

    // Zajistíme, že uživatel může smazat pouze své vlastní logy
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
