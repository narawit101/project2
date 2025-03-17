import React from "react";
import "../css/footer.css";

export default function Footer() {
  return (
    <div>
      <footer className="footer">
        <div className="social-icons">
          <a href="#">
            <img src="/" alt="Facebook" />
          </a>
          <a href="#">
            <img src="instagram.svg" alt="Instagram" />
          </a>
          <a href="#">
            <img src="twitter.svg" alt="Twitter" />
          </a>
          <a href="#">
            <img src="google.svg" alt="Google" />
          </a>
          <a href="#">
            <img src="youtube.svg" alt="YouTube" />
          </a>
        </div>

        <p className="copyright">
          Copyright ©2024, Designed by <span>XD</span>
        </p>
      </footer>
    </div>
  );
}
