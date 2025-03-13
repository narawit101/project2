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
          <h1>จองสนามกีฬาออนไลน์</h1>
          <p>ง่าย รวดเร็ว พร้อมใช้งาน</p>
        </div>
      </div>

      {/* กล่องรูปสนามกีฬา */}
      <div className="carousel-box">
        <div className="carousel">
        <div className="announcement">
            <h2>📢 ข่าวสารล่าสุด</h2>
            <ul>
              <li>⚽ เปิดจองสนามฟุตบอลรอบใหม่แล้ววันนี้!</li>
              <li>🏀 โปรโมชั่นลด 20% สำหรับสมาชิก VIP</li>
              <li>🎾 สนามเทนนิสปรับปรุงใหม่ พร้อมให้บริการ</li>
              <li>📅 อัปเดตตารางแข่งประจำสัปดาห์</li>
            </ul>
          </div>
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

      {/* ส่วนแสดงสนามยอดนิยม */}
      <div className="container">
        <div className="section-title-container">
          <h2 className="section-title">สนามยอดนิยม</h2>
        </div>
        <div className="grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card" onClick={() => router.push(`/stadium/${i}`)}>
              <img
                src="https://www.chula.ac.th/wp-content/uploads/2019/09/shutterstock_1315841174.jpg"
                alt="สนามกีฬา"
                className="card-img"
              />
              <div className="card-body">
                <h3>สนามกีฬา #{i}</h3>
                <p>สถานที่ยอดนิยมสำหรับกีฬา</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
