import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // console.log("middleware");
}

// Define for which paths this middleware should be called
export const config = {
  matcher: [], // ["/about/:path*"]
};
