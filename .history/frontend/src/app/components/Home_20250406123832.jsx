"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ใช้ Next.js navigation
import "@/app/css/HomePage.css";
import Category from "@/app/components/SportType";

export default function HomePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [postData, setPostData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token"); 

    fetch(`${API_URL}/posts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "ไม่มีโพส") {
          console.log("No posts available");
          setPostData([]);
        } else if (data.error) {
          console.error("Backend error:", data.error);
        } else {
          console.log("Post data:", data);
          setPostData(data);
        }
      })
      .catch((error) => console.error("Error fetching post data:", error));
  }, [ router]);



  const scrollToBookingSection = () => {
    document
      .querySelector(".section-title")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
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
      {images.length > 0 ? (
        <>
          <img
            src={images[currentIndex].image_url}
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
          {/* ปุ่มเปลี่ยนรูปภาพ */}
          <button className="prev" onClick={handlePrevious}>Prev</button>
          <button className="next" onClick={handleNext}>Next</button>
        </>
      ) : (
        <p>ไม่มีรูปภาพในโพสต์</p>
      )}
    </div>;

       <Category></Category>
      </div>
    </>
  );
}
