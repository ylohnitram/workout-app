import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@/lib/firebase-admin';
import { ExerciseModel } from '@/models/exercise';
import { checkIsAdmin } from '@/middleware/adminAuth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Ujistíme se, že upravujeme jen systémový cvik
    const exercise = await ExerciseModel.findOneAndUpdate(
      { _id: params.id, isSystem: true },
      { 
        ...data,
        isSystem: true  // Zajistíme, že zůstane systémový
      },
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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
    
    // Ujistíme se, že mažeme jen systémový cvik
    const result = await ExerciseModel.findOneAndDelete({
      _id: params.id,
      isSystem: true
    });

    if (!result) {
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
