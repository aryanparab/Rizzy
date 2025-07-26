import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isAuth = !!token;
  const { pathname } = req.nextUrl;

  // ✅ Redirect if user tries to access protected route without logging in
  if (!isAuth && pathname.startsWith("/chat")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ✅ If user is logged in and tries to access the homepage, send them to /newPersona
  if (isAuth && pathname === "/") {
    return NextResponse.redirect(new URL("/newPersona", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/chat/:path*",        // protect /chat/[id]
    "/newPersona",         // optional: protect /newPersona if needed
    "/"                    // redirect homepage if already logged in
  ],
};
