'use client'
import React, { useState } from "react";
import "./FieldDetailsForm.css";

function FieldDetailsForm() {
  const [fieldDetails, setFieldDetails] = useState({
    name: "",
    address: "",
    gpsLink: "",
    numberOfFields: 0,
    sportType: "ฟุตบอล",
    fieldType: "หญ้าเทียม",
    otherDetails: "",
    openingDays: [],
    openingHours: { from: "", to: "" },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFieldDetails({ ...fieldDetails, [name]: value });
  };

  const handleDaysChange = (e) => {
    const { value, checked } = e.target;
    setFieldDetails((prevDetails) => {
      const updatedDays = checked
        ? [...prevDetails.openingDays, value]
        : prevDetails.openingDays.filter((day) => day !== value);
      return { ...prevDetails, openingDays: updatedDays };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ส่งข้อมูลไปยังฐานข้อมูล
    try {
      const response = await fetch("/api/fields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fieldDetails),
      });
      if (response.ok) {
        alert("ข้อมูลถูกส่งเรียบร้อยแล้ว!");
      } else {
        alert("เกิดข้อผิดพลาดในการส่งข้อมูล");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาด");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>รายละเอียดสนาม</h1>
      <div>
        <label>ชื่อสนาม:</label>
        <input
          type="text"
          name="name"
          value={fieldDetails.name}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label>ที่อยู่สนาม:</label>
        <input
          type="text"
          name="address"
          value={fieldDetails.address}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label>ตำแหน่งที่ตั้ง GPS:</label>
        <input
          type="text"
          name="gpsLink"
          value={fieldDetails.gpsLink}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label>จำนวนสนาม:</label>
        <input
          type="number"
          name="numberOfFields"
          value={fieldDetails.numberOfFields}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label>ประเภทของกีฬา:</label>
        <input
          type="text"
          name="sportType"
          value={fieldDetails.sportType}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label>ประเภทสนาม:</label>
        <input
          type="text"
          name="fieldType"
          value={fieldDetails.fieldType}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <label>รายละเอียดเพิ่มเติม:</label>
        <textarea
          name="otherDetails"
          value={fieldDetails.otherDetails}
          onChange={handleInputChange}
        ></textarea>
      </div>
      <div>
        <label>วันที่เปิดทำการ:</label>
        {["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"].map(
          (day) => (
            <label key={day}>
              <input
                type="checkbox"
                value={day}
                onChange={handleDaysChange}
              />
              {day}
            </label>
          )
        )}
      </div>
      <div>
        <label>เวลาเปิด-ปิด:</label>
        <input
          type="time"
          name="from"
          value={fieldDetails.openingHours.from}
          onChange={(e) =>
            setFieldDetails({
              ...fieldDetails,
              openingHours: {
                ...fieldDetails.openingHours,
                from: e.target.value,
              },
            })
          }
        />
        <input
          type="time"
          name="to"
          value={fieldDetails.openingHours.to}
          onChange={(e) =>
            setFieldDetails({
              ...fieldDetails,
              openingHours: {
                ...fieldDetails.openingHours,
                to: e.target.value,
              },
            })
          }
        />
      </div>
      <button type="submit">บันทึกข้อมูล</button>
    </form>
  );
}

export default FieldDetailsForm;
