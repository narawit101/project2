import React from "react";
import "../css/footer.css";

export default function Footer() {
  return (
    <div>
      <footer className="footer">
        <div className="social-icons">
          <a href="#">
            <img src="img/fblogo.png" alt="Facebook" />
          </a>
          <a href="#">
            <img src="img/iglogo.png" alt="Instagram" />
          </a>
          <a href="#">
            <img src="img/xlogo.png" alt="Twitter" />
          </a>
          <a href="#">
            <img src="img/gglogo.png" alt="Google" />
          </a>
          <a href="#">
            <img src="img/ytlogo.png" alt="YouTube" />
          </a>
        </div>

        <p className="copyright">
          &copy; 2025 แพลตฟอร์มจองสนามกีฬาออนไลน์ | All Rights Reserved
        </p>
      </footer>
    </div>
  );
}
