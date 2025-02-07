import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@/lib/firebase-admin';
import { ExerciseModel } from '@/models/exercise';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    await connectDB();

    // Všichni přihlášení uživatelé mohou číst systémové cviky
    const exercises = await ExerciseModel.find({ isSystem: true }).sort({ category: 1, name: 1 });
    return NextResponse.json({ data: exercises });
  } catch (error) {
    console.error('System exercise fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system exercises' },
      { status: 500 }
    );
  }
}
