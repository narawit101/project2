"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ใช้ Next.js navigation
import "../css/HomePage.css";

export default function HomePage() {
  const router = useRouter();

  const images = [
    { url: "https://co.lnwfile.com/_/co/_raw/n8/pf/nw.jpg", name: "สนามฟุตบอล A", link: "/posts/1" },
    { url: "https://www.cloudroom.me/wp-content/uploads/2021/08/CLR-Blog-Sport.jpg", name: "สนามบาสเกตบอล B", link: "/posts/2" },
    { url: "https://www.chula.ac.th/wp-content/uploads/2019/09/shutterstock_1315841174.jpg", name: "สนามเทนนิส C", link: "/posts/3" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="homepage">
      {/* กล่องแบนเนอร์ */}
      <div className="banner-box">
        <div className="banner">
          <h1>แพลฟอร์มจองสนามกีฬาออนไลน์</h1>
        </div>
      </div>

      {/* กล่องรูปสนามกีฬา */}
      <div className="carousel-box">
        <div className="carousel">
          <img
            src={images[currentIndex].url}
            alt={images[currentIndex].name}
            className="carousel-img"
            onClick={() => router.push(images[currentIndex].link)}
          />
          {/* จุดเปลี่ยนรูป */}
          <div className="dots">
            {images.map((_, index) => (
              <span
                key={index}
                className={`dot ${currentIndex === index ? "active" : ""}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>

    
    </div>
  );
}
