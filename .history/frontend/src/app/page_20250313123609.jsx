'use client'
import { useState, useEffect } from "react";
import "./css/HomePage.css";

export default function HomePage() {
  const images = [
    "https://co.lnwfile.com/_/co/_raw/n8/pf/nw.jpg",
    "https://www.cloudroom.me/wp-content/uploads/2021/08/CLR-Blog-Sport.jpg",
    "https://www.chula.ac.th/wp-content/uploads/2019/09/shutterstock_1315841174.jpg",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // เปลี่ยนภาพทุกๆ 3 วินาที
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="homepage">
      {/* แบนเนอร์แบบเลื่อนอัตโนมัติ */}
      <div className="banner">
        <img src={images[currentIndex]} alt="สนามกีฬา" className="banner-img" />
        <div className="banner-content">
          <h1>จองสนามกีฬาออนไลน์</h1>
          <p>ง่าย รวดเร็ว พร้อมใช้งาน</p>
          <button className="btn-primary">เริ่มจองสนาม</button>
        </div>
      </div>

      {/* ส่วนแสดงสนามยอดนิยม */}
      <div className="container">
        <h2 className="section-title">สนามยอดนิยม</h2>
        <div className="grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card">
              <img
                src={`https://www.chula.ac.th/wp-content/uploads/2019/09/shutterstock_1315841174.jpg`}
                alt="สนามกีฬา"
                className="card-img"
              />
              <div className="card-body">
                <h3>สนามกีฬา #{i}</h3>
                <p>สถานที่ยอดนิยมสำหรับกีฬา</p>
                <button className="btn-secondary">จองเลย</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2025 ระบบจองสนามกีฬาออนไลน์ | All Rights Reserved</p>
      </footer>
    </div>
  );
}
