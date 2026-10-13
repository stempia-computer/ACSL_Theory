import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { verifiedGoogleEmail } from "@/lib/auth-policy";
export function loginConfigured() {
  return !!(
    process.env.AUTH_GOOGLE_ID &&
    process.env.AUTH_GOOGLE_SECRET &&
    process.env.AUTH_URL &&
    process.env.AUTH_SECRET &&
    process.env.AUTH_SECRET.length >= 32 &&
    !process.env.AUTH_SECRET.startsWith("REPLACE")
  );
}
export const { handlers, auth } = NextAuth({
  providers: [
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
    signIn({ account, profile }) {
      return loginConfigured() && !!verifiedGoogleEmail(account, profile);
    },
    jwt({ token, account, profile }) {
      if (account) {
        token.email = verifiedGoogleEmail(account, profile);
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
