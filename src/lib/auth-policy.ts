export function verifiedGoogleEmail(
  account: { provider?: string } | null | undefined,
  profile?: { email?: unknown; email_verified?: unknown },
) {
  return account?.provider === "google" &&
    profile?.email_verified === true &&
    typeof profile.email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
    ? profile.email.trim().toLowerCase()
    : null;
}
