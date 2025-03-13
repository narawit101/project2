"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ใช้ Next.js navigation
import "../css/HomePage.css";

export default function HomePage() {
  const router = useRouter();

  const images = [
    {
      url: "https://cdn.discordapp.com/attachments/1319952402282971238/1321164679908954112/image.png?ex=67d3bbbd&is=67d26a3d&hm=95527c33516190f870962964ec2c283c4e2160768bcd6ecacdd2f0a7088ec130&",
      name: "สนามฟุตบอล A",
      link: "/posts/1",
    },
    {
      url: "https://www.cloudroom.me/wp-content/uploads/2021/08/CLR-Blog-Sport.jpg",
      name: "สนามบาสเกตบอล B",
      link: "/posts/2",
    },
    {
      url: "https://www.chula.ac.th/wp-content/uploads/2019/09/shutterstock_1315841174.jpg",
      name: "สนามเทนนิส C",
      link: "/posts/3",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="homepage">
      <div className="banner-container">
        <div className="banner-text">
          <h1>Sport Booking Online Venue</h1>
          <h2>แพลตฟอร์มจองสนามกีฬาออนไลน์</h2>
        </div>

        <div className="banner-images">
          <img
            src={images[currentIndex].url}
            alt={images[currentIndex].name}
            className="carousel-img"
            onClick={() => router.push(images[currentIndex].link)}
          />
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

      <div className="container">
        <div className="section-title-container">
          <h2 className="section-title">สนามที่แนะนำ</h2>
        </div>
        <div className="grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="card"
              onClick={() => router.push(`/stadium/${i}`)}
            >
              <img
                src="https://cdn.discordapp.com/attachments/1319952402282971238/1321164679908954112/image.png?ex=67d3bbbd&is=67d26a3d&hm=95527c33516190f870962964ec2c283c4e2160768bcd6ecacdd2f0a7088ec130&"
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
