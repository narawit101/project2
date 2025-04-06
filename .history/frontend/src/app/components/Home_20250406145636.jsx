"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ใช้ Next.js navigation
import "@/app/css/HomePage.css";
import Category from "@/app/components/SportType";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";

dayjs.extend(relativeTime);
dayjs.locale("th");

export default function HomePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [postData, setPostData] = useState([]);
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
  }, [router]);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndexes((prevIndexes) => {
        const newIndexes = { ...prevIndexes };
        postData.forEach((post) => {
          const currentIdx = prevIndexes[post.post_id] || 0;
          const total = post.images?.length || 0;
          if (total > 0) {
            newIndexes[post.post_id] = (currentIdx + 1) % total;
          }
        });
        return newIndexes;
      });
    }, 3000); 
  
    return () => clearInterval(interval); 
  }, [postData]);
  

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
        <div className="news-section">
          <div className="title-notice">ข่าวสาร !!!</div>
          {postData.map((post) => (
            <div key={post.post_id} className="post-card">
              <h2 className="post-title">{post.content}</h2>
              <div className="time">{dayjs(post.created_at).fromNow()}</div>
              {post.images && post.images.length > 0 && (
                <div className="ig-carousel-container">
                  <div className="ig-carousel-track-wrapper">
                    <div className="ig-carousel-track">
                      <img
                        src={`${API_URL}/${
                          post.images[imageIndexes[post.post_id] || 0].image_url
                        }`}
                        alt="รูปโพสต์"
                        className="ig-carousel-image"
                      />
                    </div>
                    <button
                      className="arrow-btn left"
                      onClick={() =>
                        handlePrev(post.post_id, post.images.length)
                      }
                    >
                      ❮
                    </button>
                    <button
                      className="arrow-btn right"
                      onClick={() =>
                        handleNext(post.post_id, post.images.length)
                      }
                    >
                      ❯
                    </button>
                  </div>
                  <div className="dot-indicators">
                    {post.images.map((_, dotIdx) => (
                      <span
                        key={dotIdx}
                        className={`dot ${
                          (imageIndexes[post.post_id] || 0) === dotIdx
                            ? "active"
                            : ""
                        }`}
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
              <button
                type="button"
                className="view-post-btn"
                onClick={() =>
                  router.push(
                    `/profile/${post.field_id}?highlight=${post.post_id}`
                  )
                }
              >
                ไปที่โพส
              </button>
            </div>
          ))}
        </div>
        <Category></Category>
      </div>
    </>
  );
}
