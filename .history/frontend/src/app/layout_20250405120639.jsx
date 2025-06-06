import { Kanit } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

const kanitFont = Kanit({
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "600"],
});

export const metadata = {
  title: "แพลตฟอร์มจองสนามกีฬาออนไลน์",
  description: "Generated by create next app",
  icons: {
    icon: "./favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${kanitFont.variable} antialiased`}>
        <div className="body">
        {children}
        </div>
       
        <footer>
          <Footer></Footer>
        </footer>
      </body>
    </html>
  );
}
