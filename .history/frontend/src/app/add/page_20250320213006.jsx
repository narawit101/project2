"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterFieldForm() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter("");
  const [sports, setSports] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState({});
  const [subFields, setSubFields] = useState([]);
  const [newFacility, setNewFacility] = useState("");
  const [showNewFacilityInput, setShowNewFacilityInput] = useState(false);
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)

  //  โหลดสิ่งอำนวยความสะดวก
  useEffect(() => {
    fetch(`${API_URL}/facilities`)
      .then((res) => res.json())
      .then((data) => setFacilities(data))
      .catch((error) => console.error("Error fetching facilities:", error));
  }, []);

  //  ฟังก์ชันเลือก Checkbox สิ่งอำนวยความสะดวก
  const handleFacilityChange = (facId) => {
    setSelectedFacilities((prev) => {
      const updatedFacilities = { ...prev };
      if (updatedFacilities[facId] !== undefined) {
        delete updatedFacilities[facId];
      } else {
        updatedFacilities[facId] = "";
      }
      return updatedFacilities;
    });
  };

  //  ฟังก์ชันอัปเดตราคาสิ่งอำนวยความสะดวก
  const handleFacilityPriceChange = (facId, price) => {
    setSelectedFacilities((prev) => ({
      ...prev,
      [facId]: price,
    }));
  };

  //  ฟังก์ชันเพิ่มสิ่งอำนวยความสะดวกใหม่
  const addNewFacility = async () => {
    if (!newFacility.trim()) return;

    const res = await fetch(`${API_URL}/facilities/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fac_name: newFacility }),
    });

    const data = await res.json();
    if (data.error) {
      console.error("Error:", data.error);
      return;
    }

    setFacilities([...facilities, data]);
    setNewFacility("");
    setShowNewFacilityInput(false);
  };

  //  อัปเดตค่า Add-on
  const updateAddOn = (subIndex, addOnIndex, key, value) => {
    const updatedSubFields = [...subFields];
    updatedSubFields[subIndex].addOns[addOnIndex][key] = value;
    setSubFields(updatedSubFields);
  };

  // ลบ Add-on
  const removeAddOn = (subIndex, addOnIndex) => {
    const updatedSubFields = [...subFields];
    updatedSubFields[subIndex].addOns.splice(addOnIndex, 1);
    setSubFields(updatedSubFields);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      alert("กรุณาเข้าสู่ระบบก่อน!");
      return;
    }

    const userData = JSON.parse(storedUser);
    const userId = userData.user_id; // ดึง user_id ตอน Submit

    const selectedFacs = Object.keys(selectedFacilities); // ประกาศตัวแปร selectedFacs
    if (selectedFacs.length === 0) {
      setMessage("กรุณาเลือกสิ่งอำนวยความสะดวก");
      setMessageType("error-message");
      return;
    }
    for (const facId of selectedFacs) {
      if (selectedFacilities[facId] === "") {
        setMessage(`กรุณากรอกราคาสำหรับสิ่งอำนวยความสะดวก`);
        setMessageType("error-message");
        return;
      }
    }
  };

  return (
    <>
      <div className="input-group">
        <label>สิ่งอำนวยความสะดวก</label>
      </div>
      <div className="factcon">
        {facilities.map((fac) => (
          <div key={fac.fac_id} className="facility-item">
            {/* Checkbox เลือกสิ่งอำนวยความสะดวก */}
            <div className="input-group-checkbox">
              <input
                type="checkbox"
                checked={selectedFacilities[fac.fac_id] !== undefined}
                onChange={() => handleFacilityChange(fac.fac_id)}
              />
              <label>{fac.fac_name}</label>
            </div>

            {/* ป้อนราคาเมื่อเลือกสิ่งอำนวยความสะดวก */}
            {selectedFacilities[fac.fac_id] !== undefined && (
              <div className="input-group">
                <div className="input-group-checkbox">
                  <input
                    type="number"
                    placeholder="กำหนดราคา ถ้าไม่มีใส่ '0'"
                    value={selectedFacilities[fac.fac_id] || ""} // ตรวจสอบให้แน่ใจว่าไม่เป็น undefined หรือ null
                    onChange={(e) => {
                      // รับค่าที่กรอกจากผู้ใช้
                      let value = e.target.value;

                      // ตรวจสอบว่าเป็นตัวเลขและเป็นค่าบวกหรือ 0
                      if (value === "" || parseFloat(value) >= 0) {
                        handleFacilityPriceChange(fac.fac_id, value); // ส่งค่าใหม่ที่ผ่านการตรวจสอบ
                      } else {
                        handleFacilityPriceChange(fac.fac_id, 0); // ถ้าค่าติดลบให้เป็น 0
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {!showNewFacilityInput ? (
        <button
          className="addfac"
          type="button"
          onClick={() => setShowNewFacilityInput(true)}
        >
          + เพิ่มสิ่งอำนวยความสะดวกใหม่
        </button>
      ) : (
        <div>
          <input
            type="text"
            placeholder="ชื่อสิ่งอำนวยความสะดวก"
            value={newFacility}
            onChange={(e) => setNewFacility(e.target.value)}
          />
          <button className="savebtn" type="button" onClick={addNewFacility}>
            บันทึก
          </button>
          <button
            className="canbtn"
            type="button"
            onClick={() => setShowNewFacilityInput(false)}
          >
            ยกเลิก
          </button>
        </div>
      )}
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
    </>
  );
}
