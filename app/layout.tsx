import "./globals.css";

export const metadata = {
  title: "Pixalara Dashboard",
  description: "Growth School & Job Assistance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        {children}
      </body>
    </html>
  );
}
