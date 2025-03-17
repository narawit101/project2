import React from "react";
import "../css/footer.css";

export default function Footer() {
  return (
    <div>
      <footer className="footer">
        <div className="social-icons">
          <a href="#">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="#">
            <i className="fab fa-instagram"></i>
          </a>
          <a href="#">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="#">
            <i className="fab fa-google"></i>
          </a>
          <a href="#">
            <i className="fab fa-youtube"></i>
          </a>
        </div>

        <ul className="footer-links">
          <li>
            <a href="#">Home</a>
          </li>
          <li>
            <a href="#">News</a>
          </li>
          <li>
            <a href="#">About</a>
          </li>
          <li>
            <a href="#">Contact Us</a>
          </li>
          <li>
            <a href="#">Our Team</a>
          </li>
        </ul>

        <p className="copyright">
          Copyright ©2024, Designed by <span>YOUR NAME</span>
        </p>
      </footer>
    </div>
  );
}
