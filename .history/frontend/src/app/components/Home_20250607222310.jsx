"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/HomePage.css";
import { useAuth } from "@/app/contexts/AuthContext";
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
  const [expandedPosts, setExpandedPosts] = useState({});
  const { user, isLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState(""); // State for messages
  const [messageType, setMessageType] = useState(""); // State for message type (error, success)

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (user?.status !== "ตรวจสอบแล้ว") {
        router.push("/verification");
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // await new Promise((resolve) => setTimeout(resolve, 100));
        const res = await fetch(`${API_URL}/posts`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        if (data.message === "ไม่มีโพส") {
          setPostData([]);
        } else if (data.error) {
          console.error("Backend error:", data.error);
          setMessage("ไม่สามารถดึงข้อมูลได้", data.error);
          setMessageType("error");
        } else {
          setPostData(data);
        }
      } catch (error) {
        console.error("Error fetching post data:", error);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchPosts();
  }, []);

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

  const toggleExpanded = (postId) => {
    setExpandedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
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

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [message]);

  if (dataLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

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
        {message && (
          <div className={`message-box ${messageType}`}>
            <p>{message}</p>
          </div>
        )}
        <div className="news-section">
          <div className="title-notice">
            <h1>ข่าวสาร</h1>
          </div>
          {postData.map((post) => (
            <div key={post.post_id} className="post-card-home">
              <h2 className="post-title-home">{post.content}</h2>
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

              {post.title.length > 40 ? (
                <p className="post-text-home">
                  {expandedPosts[post.post_id]
                    ? post.title
                    : `${post.title.substring(0, 40).trim()}... `}
                  <span
                    onClick={() => toggleExpanded(post.post_id)}
                    className="see-more-button-home"
                  >
                    {expandedPosts[post.post_id] ? "ย่อ" : "ดูเพิ่มเติม"}
                  </span>
                </p>
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
