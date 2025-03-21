"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [facilities, setFacilities] = useState([]);
  const [sports, setSports] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState({});
  const [newFacility, setNewFacility] = useState("");
  const [newSport, setNewSport] = useState("");
  const [showNewFacilityInput, setShowNewFacilityInput] = useState(false);
  const [showNewSportInput, setShowNewSportInput] = useState(false);
  const router = useRouter();

  // ดึงข้อมูลสิ่งอำนวยความสะดวก
  useEffect(() => {
    fetch(`${API_URL}/facilities`)
      .then((res) => res.json())
      .then((data) => setFacilities(data))
      .catch((error) => console.error("Error fetching facilities:", error));
  }, []);

  // ดึงข้อมูลประเภทกีฬา
  useEffect(() => {
    fetch(`${API_URL}/sports_types`)
      .then((res) => res.json())
      .then((data) => setSports(data))
      .catch((error) => console.error("Error fetching sports:", error));
  }, []);

  // ฟังก์ชันการเลือกสิ่งอำนวยความสะดวก
  const handleFacilityChange = (facId) => {
    setSelectedFacilities((prev) => {
      const newSelection = { ...prev };
      if (newSelection[facId] !== undefined) {
        delete newSelection[facId]; // ลบเมื่อเลือกออก
      } else {
        newSelection[facId] = 0; // เพิ่มเมื่อเลือก
      }
      return newSelection;
    });
  };

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

  // ฟังก์ชันเพิ่มประเภทกีฬาพร้อมการยืนยัน
  const addNewSport = async () => {
    if (!newSport.trim()) return;

    const res = await fetch(`${API_URL}/sports_types/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sport_name: newSport }),
    });

    const data = await res.json();
    if (data.error) {
      console.error("Error:", data.error);
      return;
    }

    setSports([...sports, data]);
    setNewSport("");
    setShowNewSportInput(false);
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
              <div className="input-group-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFacilities[fac.fac_id] !== undefined}
                  onChange={() => handleFacilityChange(fac.fac_id)}
                />
                <label>{fac.fac_name}</label>
              </div>
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
