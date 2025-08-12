"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/home-page.css";
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
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

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
        const res = await fetch(`${API_URL}/posts`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();
        if (data.message === "ไม่มีโพส") {
          setPostData([]);
        } else if (res.ok) {
          setPostData(data.data);
          console.log(data.data);
        } else {
          console.error("Backend error:", data.error);
          setMessage("ไม่สามารถดึงข้อมูลได้", data.error);
          setMessageType("error");
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
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
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
            <h1>ประกาศ</h1>
          </div>
          {dataLoading && (
            <div className="loading-data">
              <div className="loading-data-spinner"></div>
            </div>
          )}
          {postData.map((post) => (
            <div key={post.post_id} className="post-card-home">
              <div className="inline-name-field">
                <img
                  src={
                    post.img_field
                      ? `${post.img_field}`
                      : "https://www.nstru.ac.th/resources/news/thumbnail/221.jpg"
                  }
                  alt={post.field_name}
                  className="post-img-field-home"
                />
                <div className="field-name-created-at-home">
                  <h2 className="post-field-name-home">{post.field_name}</h2>
                  <div className="time-home">
                    {dayjs(post.created_at).fromNow()}
                  </div>
                </div>
              </div>
              <h2 className="post-title-home">{post.content}</h2>

              {post.images && post.images.length > 0 && (
                <div className="ig-carousel-container-home">
                  <div className="ig-carousel-track-wrapper-home">
                    <div className="ig-carousel-track-home">
                      <img
                        src={`${
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
                        className={`dot-home ${
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
