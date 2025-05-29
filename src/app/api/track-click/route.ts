import { NextRequest, NextResponse } from 'next/server';
import { updateMallClickCount } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mallId } = body;

    if (!mallId) {
      return NextResponse.json(
        { error: 'Mall ID is required' },
        { status: 400 }
      );
    }

    // In a real application, this would update the database
    // For now, we'll just simulate the update
    const updatedMall = updateMallClickCount(mallId);

    if (!updatedMall) {
      return NextResponse.json(
        { error: 'Mall not found' },
        { status: 404 }
      );
    }

    // Log the click for analytics (in a real app, this would go to analytics service)
    console.log(`Click tracked for mall: ${mallId} at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      mallId,
      newClickCount: updatedMall.clickCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error tracking click:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}