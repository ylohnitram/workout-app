import { NextResponse } from 'next/server';
import { Exercise } from '@/models/exercise';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@/lib/firebase-admin';
import { checkIsAdmin } from '@/middleware/adminAuth';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const exercises = await Exercise.find({ isSystem: true }).sort({ name: 1 });
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const isAdmin = await checkIsAdmin(decodedToken.email || '');

    return NextResponse.json({ data: exercises, isAdmin });
  } catch (error) {
    console.error('Exercises fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
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

    if (!await checkIsAdmin(decodedToken.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await connectDB();
    const data = await req.json();
    data.isSystem = true;
    
    const exercise = await Exercise.create(data);
    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Admin exercise creation error:', error);
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    if (!await checkIsAdmin(decodedToken.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await connectDB();
    const data = await req.json();
    data.isSystem = true;
    
    const exercise = await Exercise.findByIdAndUpdate(params.id, data, { new: true });
    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Admin exercise update error:', error);
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    if (!await checkIsAdmin(decodedToken.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await connectDB();
    const exercise = await Exercise.findOneAndDelete({
      _id: params.id,
      isSystem: true
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin exercise deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 });
  }
}
