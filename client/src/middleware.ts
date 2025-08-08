import {
  clerkMiddleware,
  createRouteMatcher,
  clerkClient,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/onboarding"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl.clone();
  const { pathname } = url;

  if (isProtectedRoute(req))
    await auth.protect({
      unauthenticatedUrl: new URL("/auth/login", req.url)?.toString(),
      unauthorizedUrl: new URL("/auth/login", req.url)?.toString(),
    });

  if (userId) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId || "");
    const publicMetadata = user.publicMetadata;

    if (pathname.startsWith("/onboarding") && publicMetadata.onboarded) {
      url.pathname = "/dashboard";
    } else {
      return NextResponse.next();
    }

    if (pathname.startsWith("/auth")) {
      url.pathname = "/dashboard";
    }

    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
