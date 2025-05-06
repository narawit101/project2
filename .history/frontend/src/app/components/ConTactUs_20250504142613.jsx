import React from "react";
import "@/app/css/contacUs.css";

export default function ConTactUs() {
  return (
    <div>
      <div className="contact-container">
        <div className="title-contact">
          <h1>ติดต่อ</h1>
        </div>
        <div className="admin-contact">
          <div>
            <span>
              <label>Email: </label>
              <strong>narawit.so@rmuti.ac.th</strong>
            </span>
            <span style="margin-left: 20px;">
              <label>Phone: </label>
              <strong>081-234-5678</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
