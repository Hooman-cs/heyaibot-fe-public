import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import AppleProvider from "next-auth/providers/apple";
import { getUserByEmail, createUser, getUserById } from "../../../app/model/user-db"; 
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import { getPlanById } from "../../../app/model/plan-db";



// ✅ FIX 1: Define this helper function at the top level
const enrichWithPlanName = async (planId) => {
  if (!planId || planId === 'none') return "None";
  try {
    const plan = await getPlanById(planId);
    return plan ? plan.plan_name : "Unknown Plan";
  } catch (e) {
    console.error("Plan Fetch Error:", e);
    return "Unknown";
  }
};

export const authOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      tenantId: process.env.MICROSOFT_TENANT_ID, 
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID || "",
      clientSecret: process.env.APPLE_CLIENT_SECRET || "", 
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) throw new Error("Missing inputs");
        
        const user = await getUserByEmail(credentials.email);
        if (!user) throw new Error("User not found");
        
        // If user has no password (social login), block credentials login
        if (!user.password) throw new Error("Please use your social login");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid password");

        return { 
          id: user.user_id,
          name: user.user_name, 
          email: user.user_email, 
          isSuperAdmin: user.isSuperAdmin || false
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider !== "credentials") {
        const existingUser = await getUserByEmail(user.email);
        if (!existingUser) {
          await createUser({
            name: user.name || profile?.name || "User",
            email: user.email,
            authProvider: account.provider,
            password: null 
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // 1. Initial Sign In
      if (user) {
        const dbUser = await getUserByEmail(user.email);
        if (dbUser) {
          token.id = dbUser.user_id;
          token.isSuperAdmin = dbUser.isSuperAdmin || false;
          token.name = dbUser.user_name;
          token.plan = dbUser.plan;
          // ✅ FIX 1: Now this function exists and won't crash
          token.planName = await enrichWithPlanName(dbUser.plan);
        }
      } 
      // 2. Subsequent Checks (Refetch to keep data fresh)
      else if (token.id) {
        try {
          const freshUser = await getUserById(token.id);
          if (freshUser) {
            token.plan = freshUser.plan; 
            token.isSuperAdmin = freshUser.isSuperAdmin;
            token.planName = await enrichWithPlanName(freshUser.plan);
          }
        } catch (error) {
          console.error("Error refreshing user token data:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isSuperAdmin = token.isSuperAdmin;
        session.user.name = token.name;
        session.user.plan = token.plan;
        session.user.planName = token.planName; 
      }
      return session;
    }
  },
  pages: { 
    signIn: "/login",
    error: "/login" 
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);