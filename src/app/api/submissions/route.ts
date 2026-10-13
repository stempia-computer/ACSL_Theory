// Retire anonymous name-based submissions: old clients must sign in and use the new API.
export function GET() {
  return Response.json(
    {
      configured: false,
      error: "Sign in at /login to use account-based homework.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export function POST() {
  return Response.json(
    {
      error: "Anonymous submissions are no longer accepted. Sign in at /login.",
    },
    { status: 401 },
  );
}
