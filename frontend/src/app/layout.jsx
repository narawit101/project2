import { Kanit } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { AuthProvider } from "@/app/contexts/AuthContext";

const kanitFont = Kanit({
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "600"],
});

export const metadata = {
  title: "แพลตฟอร์มจองสนามกีฬาออนไลน์",
  description: "แพลตฟอร์มจองสนามกีฬาออนไลน์",
  icons: {
    icon: "https://res.cloudinary.com/dlwfuul9o/image/upload/v1750926494/logo2_jxtkqq.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <AuthProvider>
        <body className={`${kanitFont.variable} antialiased`}>
            <div className="navbar">
              <Navbar></Navbar>
            </div>
            <div className="body">{children}</div>
            <footer>
              <Footer></Footer>
            </footer>
        </body>
      </AuthProvider>
    </html>
  );
}
