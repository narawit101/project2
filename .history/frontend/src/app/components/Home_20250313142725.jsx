import { useState, useEffect } from "react";
import "../css/HomePage.css";

export default function HomePage() {
  // TODO: เมื่อมีโพสต์ของสนามจริง ให้เปลี่ยนรูปในอาร์เรย์นี้
  const images = [
    { url: "https://images.pexels.com/photos/1432037/pexels-photo-1432037.jpeg", name: "สนามฟุตบอล A" },
    { url: "https://images.pexels.com/photos/35679/soccer-stadium-game-match.jpg", name: "สนามบาสเกตบอล B" },
    { url: "https://images.pexels.com/photos/61135/pexels-photo-61135.jpeg", name: "สนามเทนนิส C" }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // เลื่อนอัตโนมัติทุก 3 วินาที
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // เมื่อคลิกเปลี่ยนภาพ
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="homepage">
      {/* แบนเนอร์แบบเลื่อนอัตโนมัติ */}
      <div className="banner">
        <img src={images[currentIndex].url} alt={images[currentIndex].name} className="banner-img" />
        <div className="banner-content">
          <h1>{images[currentIndex].name}</h1>
          <p>ง่าย รวดเร็ว พร้อมใช้งาน</p>
          <button className="btn-primary">เริ่มจองสนาม</button>
        </div>
        {/* จุด Indicator สำหรับเปลี่ยนภาพ */}
        <div className="dots">
          {images.map((_, index) => (
            <span
              key={index}
              className={`dot ${currentIndex === index ? "active" : ""}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>

      {/* ส่วนแสดงสนามยอดนิยม */}
      <div className="container">
        <h2 className="section-title">สนามยอดนิยม</h2>
        <div className="grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card">
              <img
                src={`https://images.pexels.com/photos/${61130 + i}/pexels-photo-${61130 + i}.jpeg`}
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
