import { NextResponse } from 'next/server';
import { Exercise } from '@/models/exercise';
import { connectDB } from '@/lib/mongodb';
import { adminMiddleware } from '@/middleware/adminAuth';

export async function GET(req: Request) {
  try {
    await adminMiddleware(req);
    await connectDB();
    
    const exercises = await Exercise.find({ isSystem: true }).sort({ name: 1 });
    return NextResponse.json({ data: exercises });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    
    console.error('Admin exercises fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await adminMiddleware(req);
    await connectDB();
    
    const data = await req.json();
    data.isSystem = true;  // Zajistíme, že jde o systémový cvik
    
    const exercise = await Exercise.create(data);
    return NextResponse.json(exercise);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    
    console.error('Admin exercise creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    );
  }
}

// app/api/admin/exercises/[id]/route.ts může být ve zvláštním souboru
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await adminMiddleware(req);
    await connectDB();
    
    const data = await req.json();
    data.isSystem = true;
    
    const exercise = await Exercise.findByIdAndUpdate(
      params.id,
      data,
      { new: true }
    );
    
    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(exercise);
  } catch (error) {
    if (error instanceof NextResponse) return error;
    
    console.error('Admin exercise update error:', error);
    return NextResponse.json(
      { error: 'Failed to update exercise' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await adminMiddleware(req);
    await connectDB();
    
    const exercise = await Exercise.findOneAndDelete({
      _id: params.id,
      isSystem: true
    });
    
    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    
    console.error('Admin exercise deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete exercise' },
      { status: 500 }
    );
  }
}
