import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to the home page without authentication
        if (req.nextUrl.pathname === "/") {
          return true;
        }
        // Require authentication for all other pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - icons (public icons)
     * - manifest.json
     * - sw.js
     * - workbox-*.js
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|icons|manifest.json|sw.js|workbox-).*)",
  ],
};
