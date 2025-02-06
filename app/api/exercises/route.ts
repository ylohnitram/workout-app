import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@/lib/firebase-admin';
import { ExerciseModel } from '@/models/exercise';

/**
 * API Endpoint pro správu uživatelských cviků
 * 
 * Tento endpoint slouží výhradně pro práci s vlastními cviky uživatele (isSystem: false).
 * Pro práci se systémovými cviky slouží endpoint /api/admin/exercises.
 * 
 * Architektura endpointů pro cviky:
 * - /api/exercises - vlastní cviky uživatele
 * - /api/admin/exercises - systémové cviky (vyžaduje admin práva)
 * 
 * V editoru tréninku se používají oba endpointy:
 * 1. /api/admin/exercises pro načtení systémových cviků
 * 2. /api/exercises pro načtení vlastních cviků uživatele
 */

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

    await connectDB();

    // Vždy vracíme pouze vlastní cviky uživatele (kde userId odpovídá a isSystem je false)
    const query = { userId, isSystem: false };

    console.log('Fetching user exercises with query:', query);
    const exercises = await ExerciseModel.find(query).sort({ name: 1 });
    console.log('Found user exercises:', exercises.length);

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

    await connectDB();

    const data = await req.json();
    if (!data.name) {
      return NextResponse.json(
        { error: 'Exercise name is required' },
        { status: 400 }
      );
    }

    // Vytvoříme vždy uživatelský cvik bez ohledu na to, zda je uživatel admin
    const exerciseData = {
      name: data.name,
      category: data.category,
      description: data.description,
      isSystem: false, // Vždy false - systémové cviky se vytvářejí přes /api/admin/exercises
      userId
    };

    console.log('Creating user exercise:', exerciseData);

    const exercise = await ExerciseModel.create(exerciseData);
    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error saving exercise:', error);
    if (error.code === 11000) { // MongoDB duplicate key error
      return NextResponse.json(
        { error: 'Exercise with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { 
        error: 'Failed to save exercise', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
