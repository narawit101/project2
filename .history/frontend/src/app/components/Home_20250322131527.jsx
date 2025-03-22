"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ใช้ Next.js navigation
import "@/app/css/HomePage.css";

export default function HomePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token"); 

    fetch(`${API_URL}/field/allow/preview`, {
      method: "GET", 
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, 
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.log("ไม่พบข้อมูลสนามกีฬา");
        } else {
          console.log("ข้อมูลสนามกีฬที่ผ่านการอนุมัติ:", data); 
        }
      })
      .catch((error) => {
        console.error("Error fetching approved fields:", error);
        console.log("เกิดข้อผิดพลาดในการดึงข้อมูล");
      });
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBookingSection = () => {
    document
      .querySelector(".section-title")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div className="banner-container">
        <video autoPlay loop muted playsInline className="banner-video">
          <source src="/video/bannervideo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="banner-text">
          <h1>Online Sports Venue Booking Platform</h1>
          <h2>แพลตฟอร์มจองสนามกีฬาออนไลน์</h2>
          <div className="btn">
            <button onClick={scrollToBookingSection}>จองเลย</button>
          </div>
        </div>
      </div>

      <div className="homepage">
        <h2 className="title-notice">ข่าวสาร</h2>
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
        <div className="container">
          <div className="section-title-container">
            <h2 className="section-title">สนามที่แนะนำ</h2>
          </div>
          <div className="grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card" onClick={() => router.push(`/`)}>
                <img
                  src="https://cdn.discordapp.com/attachments/1319952402282971238/1321164679908954112/image.png?ex=67d3bbbd&is=67d26a3d&hm=95527c33516190f870962964ec2c283c4e2160768bcd6ecacdd2f0a7088ec130&"
                  alt="สนามกีฬา"
                  className="card-img"
                />
                <div className="card-body">
                  <h3>สนามกีฬา #{i}</h3>
                  <p>สถานที่ยอดนิยมสำหรับกีฬา</p>
                  <p>สถานที่ยอดนิยมสำหรับกีฬา</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
