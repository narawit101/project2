import "./css/HomePage.css";

export default function HomePage() {
  return (
    <div className="homepage">
      {/* แบนเนอร์หลัก */}
      <div className="banner">
        <div className="banner-content">
          <h1>จองสนามกีฬาออนไลน์</h1>
          <p>ง่าย รวดเร็ว พร้อมใช้งาน</p>
          <button className="btn-primary">เริ่มจองสนาม</button>
        </div>
      </div>

      {/* ส่วนแสดงสนามยอดนิยม */}
      <div className="container">
        <h2 className="section-title">สนามยอดนิยม</h2>
        <div className="grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card">
              <img
                src={`https://source.unsplash.com/400x300/?sports,stadium${i}`}
                alt="สนามกีฬา"
                className="card-img"
              />
              <div className="card-body">
                <h3>สนามกีฬา #{i}</h3>
                <p>สถานที่ยอดนิยมสำหรับกีฬา</p>
                <button className="btn-secondary">จองเลย</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ส่วน Footer */}
      <footer className="footer">
        <p>&copy; 2025 ระบบจองสนามกีฬาออนไลน์ | All Rights Reserved</p>
      </footer>
    </div>
  );
}
