import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixalara Career Hub", // 🎯 Updated Title to match your Brand
  description: "Admin, Student, and Job Seeker Dashboard",
  icons: {
    icon: "/icon.png", // 🎯 Explicitly points to your new Target icon
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}