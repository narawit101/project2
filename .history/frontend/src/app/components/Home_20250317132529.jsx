"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ใช้ Next.js navigation
import "../css/HomePage.css";

export default function HomePage() {
  const router = useRouter();

  const images = [
    {
      url: "https://scontent.fkkc2-1.fna.fbcdn.net/v/t39.30808-6/481161556_617689281017883_1575621303415186579_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=833d8c&_nc_ohc=urtAfET3SCgQ7kNvgFK6bEM&_nc_oc=AdiUxpNkTTBB2pQ-Q4U6gDPQr-uv13EgZa6Je6-5I_gXrlV9Vh1NOh8xzQuWLPJR0yPZGTQvzIQ4p1zuwA45yTJJ&_nc_zt=23&_nc_ht=scontent.fkkc2-1.fna&_nc_gid=AwjtOpqmAWUuGnm_5Q9NDem&oh=00_AYEkGqL9S-RTYZ-_rePWAPED-YxXyyCNiXcYbHMNGOaE0w&oe=67D89356",
      name: "สนามฟุตบอล A",
      link: "/",
    },
    {
      url: "https://scontent.fkkc2-1.fna.fbcdn.net/v/t39.30808-6/481975401_627441850042626_2673511310682541741_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=833d8c&_nc_ohc=fkGkf3EaaLsQ7kNvgF_oHQt&_nc_oc=AdjWvBMwv3UbpW3E0SNaDximTgZ9Q-FmaB-lMS5JslrrLwCLXMGNZdYJyvgZ38Q4COKr1Fl9X-1oTZhfyaEPxIF7&_nc_zt=23&_nc_ht=scontent.fkkc2-1.fna&_nc_gid=Akzxhs25IP_uJSuOmgtmvta&oh=00_AYF2NnBuB7oeGgyOVCPC41sheyBFaKi5fixzxp8K6ldb4w&oe=67D8A3FA",
      name: "สนามบาสเกตบอล B",
      link: "/",
    },
    {
      url: "https://scontent.fkkc2-1.fna.fbcdn.net/v/t39.30808-6/481975045_627441870042624_8501074694572073198_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=833d8c&_nc_ohc=VioEsPj53igQ7kNvgGeN9fW&_nc_oc=Adgs-E1r1e4CNCwfPWFgGXjaYn3PAA_ErxiRgRpGoqZ2GoINdVcVE1D_pjJTZ7P-Qs0yDnUS7hCpXUfGLUn7_DB0&_nc_zt=23&_nc_ht=scontent.fkkc2-1.fna&_nc_gid=ANHc_4wVm8ckv0TS0x5v9Oe&oh=00_AYFye2hZqYTWraGyv5en6l6WoEkHLSDA9X2iya6oKWpk3w&oe=67D89533",
      name: "สนามเทนนิส C",
      link: "/",
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
    <>
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
              onClick={() => router.push(`/`)}
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
    v
  );
}
