"use client";
import { useState, useEffect } from "react";
import "../css/HomePage.css";

export default function HomePage() {
  const images = [
    { url: "https://co.lnwfile.com/_/co/_raw/n8/pf/nw.jpg", name: "สนามฟุตบอล A" },
    { url: "https://www.cloudroom.me/wp-content/uploads/2021/08/CLR-Blog-Sport.jpg", name: "สนามบาสเกตบอล B" },
    { url: "https://www.chula.ac.th/wp-content/uploads/2019/09/shutterstock_1315841174.jpg", name: "สนามเทนนิส C" },
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
      {/* รูปโพสต์ของสนามกีฬา */}
      

      {/* แบนเนอร์หลัก */}
      <div className="banner">
        <img src={images[currentIndex].url} alt="สนามกีฬา" className="banner-img" />
        <div className="banner-content">
          <h1>จองสนามกีฬาออนไลน์</h1>
          <p>ง่าย รวดเร็ว พร้อมใช้งาน</p>
        </div>
      </div>

      {/* ส่วนแสดงสนามยอดนิยม */}
      <div className="container">
        <div className="section-title-container">
          <h2 className="section-title">สนามยอดนิยม</h2>
        </div>
        <div className="grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card">
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
