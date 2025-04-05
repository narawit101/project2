import React from "react";
import "@/app/css/footer.css";

export default function Footer() {
  return (
    <footer>
      <p>&copy; 2025 แพลตฟอร์มจองสนามกีฬาออนไลน์ | All Rights Reserved</p>

      {/* Social Icons (Optional) */}
      <div className="social-icons">
        <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
          <img src="img/fblogo.png" alt="Facebook" />
        </a>
        <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
          <img src="img/iglogo.png" alt="Instagram" />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <img src="img/xlogo.png" alt="Twitter" />
        </a>
        <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">
          <img src="img/gglogo.png" alt="Google" />
        </a>
        <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
          <img src="img/ytlogo.png" alt="YouTube" />
        </a>
      </div>
    </footer>
  );
}
