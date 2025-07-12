import "@/app/css/rate-limited.css";
import Link from "next/link";
export default function RateLimitedPage() {
  return (
    <div className="rate-limited-container">
      <img
        src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1751729703/warning-sign-icon-transparent-background-free-png_ls18v9.webp"
        alt=""
        width={300}
        height={300}
      />
      <h1>คุณส่งคำขอจำนวนมากเกินไปในระยะเวลาที่กำหนด</h1>
      <p>กรุณารอสักครู่แล้วลองใหม่อีกครั้ง</p>
      <Link href="/" legacyBehavior>
        <a>← กลับไปหน้าหลัก</a>
      </Link>
    </div>
  );
}
