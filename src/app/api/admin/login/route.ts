import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Admin password (in production, this should be in environment variables)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123!@#';

// Simple session storage (in production, use Redis or database)
const activeSessions = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Check password
    if (password !== ADMIN_PASSWORD) {
      // Log failed attempt
      console.log(`Failed admin login attempt at ${new Date().toISOString()}`);
      
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    activeSessions.add(sessionToken);

    // Log successful login
    console.log(`Admin login successful at ${new Date().toISOString()}`);

    // Set session expiry (1 hour from now)
    setTimeout(() => {
      activeSessions.delete(sessionToken);
    }, 60 * 60 * 1000); // 1 hour

    return NextResponse.json({
      success: true,
      sessionToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// Verify session endpoint
export async function GET(request: NextRequest) {
  const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!sessionToken || !activeSessions.has(sessionToken)) {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true });
}

// Export active sessions for middleware
export { activeSessions };