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
      {/* กล่องแบนเนอร์แบบสองฝั่ง */}
      <div className="banner-container">
        {/* ด้านซ้าย: ข้อความประกาศ */}
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

        {/* ด้านขวา: รูปภาพสนามกีฬา */}
        <div className="banner-images">
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
