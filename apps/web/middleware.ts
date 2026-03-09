import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/app') {
    return NextResponse.redirect(new URL('/app/leaderboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app'],
};
