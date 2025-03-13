"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ใช้ Next.js navigation
import "../css/HomePage.css";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="homepage">
      {/* ส่วนแบนเนอร์หลัก */}
      <div className="banner-container">
        {/* ด้านซ้าย: ข้อความ & ปุ่มดาวน์โหลด */}
        <div className="banner-text">
          <h1>Search. Book. Play!</h1>
          <p>
            จองสนามที่ใช่ พบเพื่อนใหม่ที่ชอบกีฬาคล้ายกัน 
            เติมเต็มความสนุกไปกับกีฬาที่คุณรัก แพลตฟอร์มเดียวครบทุกเรื่องกีฬา ดาวน์โหลดเลย!
          </p>
          <div className="download-buttons">
            <button className="app-store">
              <img src="/appstore.svg" alt="App Store" />
              Download from <strong>App Store</strong>
            </button>
            <button className="google-play">
              <img src="/googleplay.svg" alt="Google Play" />
              Download from <strong>Google Play</strong>
            </button>
          </div>
        </div>

        {/* ด้านขวา: รูปโทรศัพท์ */}
        <div className="banner-images">
          <img src="/phone1.png" alt="App Screenshot 1" className="phone-img phone1" />
          <img src="/phone2.png" alt="App Screenshot 2" className="phone-img phone2" />
        </div>
      </div>
    </div>
  );
}
