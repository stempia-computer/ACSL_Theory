import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { sessionConfigured, otpConfigured, verifyOtp } from "@/lib/otp";
import Google from "next-auth/providers/google";
import { verifiedGoogleEmail } from "@/lib/auth-policy";
export function googleConfigured() {
  return (
    sessionConfigured() &&
    !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
  );
}
export function loginConfigured() {
  return sessionConfigured();
}
export const { handlers, auth } = NextAuth({
  providers: [
    Credentials({
      id: "email-otp",
      name: "Email OTP",
      credentials: {
        email: { type: "email" },
        challenge: { type: "text" },
        code: { type: "text" },
      },
      async authorize(credentials) {
        if (!otpConfigured()) return null;
        return verifyOtp(
          credentials.email,
          credentials.challenge,
          credentials.code,
        );
      },
    }),
    Google({
      checks: ["pkce", "state", "nonce"],
      authorization: {
        params: { scope: "openid email profile", prompt: "select_account" },
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    signIn({ account, profile, user }) {
      if (account?.provider === "email-otp")
        return otpConfigured() && !!user.id && !!user.email;
      return googleConfigured() && !!verifiedGoogleEmail(account, profile);
    },
    jwt({ token, account, profile, user }) {
      if (account) {
        token.email =
          account.provider === "email-otp"
            ? user.email
            : verifiedGoogleEmail(account, profile);
        token.verified = !!token.email;
      }
      return token;
    },
    session({ session, token }) {
      // Only a provider-verified email may become a server-side actor. No role is trusted from the JWT.
      session.user.email =
        token.verified === true && typeof token.email === "string"
          ? token.email
          : "";
      return session;
    },
  },
});
