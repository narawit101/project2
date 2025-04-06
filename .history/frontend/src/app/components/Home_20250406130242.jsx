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
  const [imageIndexes, setImageIndexes] = useState({}); // เก็บ index ของแต่ละโพส


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

  const handlePrev = (postId, length) => {
    setImageIndexes((prev) => ({
      ...prev,
      [postId]:
        (prev[postId] || 0) - 1 < 0 ? length - 1 : (prev[postId] || 0) - 1,
    }));
  };

  const handleNext = (postId, length) => {
    setImageIndexes((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1 >= length ? 0 : (prev[postId] || 0) + 1,
    }));
  };

  const scrollToBookingSection = () => {
    document
      .querySelector(".section-title")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % postData.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + postData.length) % postData.length);
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
        <div>
      {postData.map((post) => (
        <div key={post.post_id} className="post-card">
          <h2 className="post-title">{post.content}</h2>


          {post.images && post.images.length > 0 && (
            <div className="ig-carousel-container">
              <div className="ig-carousel-track-wrapper">
                <div
                  className="ig-carousel-track"
                
                >
                  {post.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={`${API_URL}/${img.image_url}`}
                      alt="รูปโพสต์"
                      className="ig-carousel-image"
                      style={{ cursor: "zoom-in" }}
                    />
                  ))}
                </div>
                <button
                  className="arrow-btn left"
                  onClick={() => {
                    const len = post.images.length;
                    setImageIndexes((prev) => ({
                      ...prev,
                      [post.post_id]:
                        (prev[post.post_id] || 0) - 1 < 0
                          ? len - 1
                          : (prev[post.post_id] || 0) - 1,
                    }));
                  }}
                >
                  ❮
                </button>
                <button
                  className="arrow-btn right"
                  onClick={() => {
                    const len = post.images.length;
                    setImageIndexes((prev) => ({
                      ...prev,
                      [post.post_id]:
                        (prev[post.post_id] || 0) + 1 >= len
                          ? 0
                          : (prev[post.post_id] || 0) + 1,
                    }));
                  }}
                >
                  ❯
                </button>
              </div>
              <div className="dot-indicators">
                {post.images.map((_, dotIdx) => (
                  <span
                    key={dotIdx}                  
                    onClick={() =>
                      setImageIndexes((prev) => ({
                        ...prev,
                        [post.post_id]: dotIdx,
                      }))
                    }
                  ></span>
                ))}
              </div>
            </div>
          )}

          <p className="post-text">{post.title}</p>
        </div>
      ))}
    </div>
       <Category></Category>
      </div>
    </>
  );
}
