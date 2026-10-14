import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "English Learning Platform | CEFR A1–B2",
  description: "Functional English learning web application for Vietnamese learners mastering CEFR A1 to B2.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Query student profile
  let userLevel = "A1";
  let streak = 3;

  try {
    const user = await prisma.user.findFirst();
    if (user) {
      userLevel = user.currentCefr;
      streak = user.streakDays;
    }
  } catch (err) {
    console.error("Failed to load user in RootLayout:", err);
  }

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        <Navbar userLevel={userLevel} streak={streak} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <p>© EnglishPlatform A1–B2. Dedicated to functional learning quality and practical mastery.</p>
        </footer>
      </body>
    </html>
  );
}
