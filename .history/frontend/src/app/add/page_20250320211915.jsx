"use client";
import { useState, useEffect } from "react";


export default function AdminPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState({});
  const [newFacility, setNewFacility] = useState("");
  const [showNewFacilityInput, setShowNewFacilityInput] = useState(false);


  // ดึงข้อมูลสิ่งอำนวยความสะดวก
  useEffect(() => {
    fetch(`${API_URL}/facilities`)
      .then((res) => res.json())
      .then((data) => setFacilities(data))
      .catch((error) => console.error("Error fetching facilities:", error));
  }, []);


  
  // ฟังก์ชันการอัปเดตราคา
  const handleFacilityPriceChange = (facId, price) => {
    setSelectedFacilities((prev) => ({
      ...prev,
      [facId]: price,
    }));
  };

  // ฟังก์ชันเพิ่มสิ่งอำนวยความสะดวกใหม่
  const addNewFacility = async () => {
    if (!newFacility.trim()) return;

    const res = await fetch(`${API_URL}/facilities/add/price`, {
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

 

  return (
    <div className="admin-container">
      <h1>จัดการสิ่งอำนวยความสะดวกและประเภทกีฬา</h1>

      {/* สิ่งอำนวยความสะดวก */}
      <div className="facilities-section">
        <h2>สิ่งอำนวยความสะดวก</h2>
        <div className="factcon">
          {facilities.map((fac) => (
            <div key={fac.fac_id} className="facility-item">
              {selectedFacilities[fac.fac_id] !== undefined && (
                <div className="input-group">
                  <input
                    type="number"
                    placeholder="กำหนดราคา ถ้าไม่มีใส่ '0'"
                    value={selectedFacilities[fac.fac_id] || ""}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (value === "" || parseFloat(value) >= 0) {
                        handleFacilityPriceChange(fac.fac_id, value);
                      } else {
                        handleFacilityPriceChange(fac.fac_id, 0);
                      }
                    }}
                  />
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
      </div>
    </div>
  );
}
