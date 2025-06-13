import { Kanit } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { AuthProvider } from "@/app/contexts/AuthContext";
import PageTransitionLoader from "@/app/components/PageTransitionLoader";

const kanitFont = Kanit({
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "600"],
});

export const metadata = {
  title: "แพลตฟอร์มจองสนามกีฬาออนไลน์",
  description: "แพลตฟอร์มจองสนามกีฬาออนไลน์",
  icons: {
    icon: "./favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <AuthProvider>
        <body className={`${kanitFont.variable} antialiased`}>
          <PageTransitionLoader>
            <div className="navbar">
              <Navbar></Navbar>
            </div>
            <div className="body">{children}</div>
            <footer>
              <Footer></Footer>
            </footer>
          </PageTransitionLoader>
        </body>
      </AuthProvider>
    </html>
  );
}
