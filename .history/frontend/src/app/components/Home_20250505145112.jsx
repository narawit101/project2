"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const [imageIndexes, setImageIndexes] = useState({});

  useEffect(() => {
    fetch(`${API_URL}/posts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "ไม่มีโพส") {
          setPostData([]);
        } else if (data.error) {
          console.error("Backend error:", data.error);
        } else {
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
      .querySelector(".section-title-home")
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
    }, 5000);

    return () => clearInterval(interval);
  }, [postData]);

  return (
    <>
      <div className="banner-container">
        <img
          src="/images/baner-img.png"
          alt="ศูนย์กีฬา"
          className="banner-video"
        />

        <div className="banner-text">
          <h1>Online Sports Venue Booking Platform</h1>
          <h2>แพลตฟอร์มจองสนามกีฬาออนไลน์</h2>
          <div className="home-btn">
            <button onClick={scrollToBookingSection}>จองเลย</button>
          </div>
        </div>
      </div>

      <div className="homepage">
        <div className="news-section">
          <div className="title-notice">
            <h1>ข่าวสาร</h1>
          </div>
          {postData.map((post) => (
            <div key={post.post_id} className="post-card-home">
              <h2 className="post-title-home">{post.content}</h2>
              {post.title.length > 100 ? (
                <details>
                  <summary>
                    {post.title.substring(0, 100)}... ดูเพิ่มเติม
                  </summary>
                  <p className="post-text-home">{post.title}</p>
                </details>
              ) : (
                <p className="post-text-home">{post.title}</p>
              )}
              <div className="time-home">
                {dayjs(post.created_at).fromNow()}
              </div>
              {post.images && post.images.length > 0 && (
                <div className="ig-carousel-container-home">
                  <div className="ig-carousel-track-wrapper-home">
                    <div className="ig-carousel-track-home">
                      <img
                        src={`${API_URL}/${
                          post.images[imageIndexes[post.post_id] || 0].image_url
                        }`}
                        alt="รูปโพสต์"
                        className="ig-carousel-image-home"
                      />
                    </div>
                    <button
                      className="arrow-btn left-home"
                      onClick={() =>
                        handlePrev(post.post_id, post.images.length)
                      }
                    >
                      ❮
                    </button>
                    <button
                      className="arrow-btn right-home"
                      onClick={() =>
                        handleNext(post.post_id, post.images.length)
                      }
                    >
                      ❯
                    </button>
                  </div>
                  <div className="dot-indicators-home">
                    {post.images.map((_, dotIdx) => (
                      <span
                        key={dotIdx}
                        className={`dot ${
                          (imageIndexes[post.post_id] || 0) === dotIdx
                            ? "active-home"
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
              {post.title.length > 100 ? (
                <details>
                  <summary>
                    {post.title.substring(0, 100)}... ดูเพิ่มเติม
                  </summary>
                  <p className="post-text-home">{post.title}</p>
                </details>
              ) : (
                <p className="post-text-home">{post.title}</p>
              )}

              <button
                type="button"
                className="view-post-btn-home"
                onClick={() =>
                  router.push(
                    `/profile/${post.field_id}?highlight=${post.post_id}`
                  )
                }
              >
                ดูโพสต์
              </button>
            </div>
          ))}
        </div>
        <Category></Category>
      </div>
    </>
  );
}
