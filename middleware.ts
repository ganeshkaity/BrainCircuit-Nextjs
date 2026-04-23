import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/home"];
const ADMIN_PATHS = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all public paths
  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  // Allow static assets and Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/api") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Read auth cookie that we set on login
  const authToken = request.cookies.get("bc-auth-token")?.value;

  if (!authToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin guard — in production, verify a custom claim via firebase-admin
  const isAdmin = request.cookies.get("bc-admin")?.value === "true";
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) && !isAdmin) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
