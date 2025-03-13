<div className="carousel-box">
  <div className="carousel-content">
    {/* ข้อความประกาศ */}
    <div className="announcement">
      <h1>📢 ประกาศต่างๆ จากสนาม</h1>
      <ul>
        <li>⚽ เปิดจองสนามฟุตบอลรอบใหม่แล้ววันนี้!</li>
        <li>🏀 โปรโมชั่นลด 20% สำหรับสมาชิก VIP</li>
        <li>🎾 สนามเทนนิสปรับปรุงใหม่ พร้อมให้บริการ</li>
        <li>📅 อัปเดตตารางแข่งประจำสัปดาห์</li>
      </ul>
    </div>

    {/* รูปภาพสนามกีฬา */}
    <div className="carousel">
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
