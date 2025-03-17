import { Kanit } from "next/font/google";
import "./globals.css";

const kanitFont = Kanit({
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "600"],
});

export const metadata = {
  title: "แพลตฟอร์มจองสนามกีฬาออนไลน์",
  description: "Generated by create next app",
  icons: {
    icon:"./favicon.ico"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${kanitFont.variable} antialiased`}>{children}</body>
      <footer className="footer">
        <p>&copy; 2025 แพลตฟอร์มจองสนามกีฬาออนไลน์ | All Rights Reserved</p>
      </footer>
    </html>
  );
}
