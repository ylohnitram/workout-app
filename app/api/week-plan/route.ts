import { NextResponse } from 'next/server';
import { WeekPlan } from '@/models/weekPlan';
import { connectDB } from '@/lib/mongodb';
import { auth } from '@/lib/firebase-admin';

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
    
    let weekPlan = await WeekPlan.findOne({ userId });

    if (!weekPlan) {
      weekPlan = await WeekPlan.create({
        userId,
        dayPlans: [
          "Pondělí", "Úterý", "Středa", "Čtvrtek", 
          "Pátek", "Sobota", "Neděle"
        ].map(day => ({ day, workoutId: null }))
      });
    }

    return NextResponse.json({ data: weekPlan });
  } catch (error) {
    console.error('Week plan fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch week plan' },
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
    const userId = decodedToken.uid;

    const { dayPlans } = await req.json();

    await connectDB();
    
    const weekPlan = await WeekPlan.findOneAndUpdate(
      { userId },
      { 
        userId,
        dayPlans 
      },
      { 
        new: true,
        upsert: true 
      }
    );

    return NextResponse.json({ data: weekPlan });
  } catch (error) {
    console.error('Week plan update error:', error);
    return NextResponse.json(
      { error: 'Failed to update week plan' },
      { status: 500 }
    );
  }
}
