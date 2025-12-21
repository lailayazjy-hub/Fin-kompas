import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import users from "@/data/users.json";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = users.find(
          (u: any) => {
            // Decode the stored password from Base64
            const decodedPassword = Buffer.from(u.password, "base64").toString(
              "utf-8"
            );
            return (
              u.username === credentials.username &&
              decodedPassword === credentials.password
            );
          }
        );

        if (user) {
          return { id: "1", name: "Laila", email: user.username };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "secret-key-change-me",
});

export { handler as GET, handler as POST };
