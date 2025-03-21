"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/add.css"

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

  const isFacilityNameDuplicate = async (name) => {
    const result = await fetch(`${API_URL}/facilities/checkNameDuplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fac_name: name }),
    });
  
    const data = await result.json();
    return data.isDuplicate;
  };
  



  // ฟังก์ชันเพิ่มสิ่งอำนวยความสะดวกใหม่
  const addNewFacility = async () => {
    if (!newFacility.trim()) {
      alert("กรุณากรอกชื่อสิ่งอำนวยความสะดวก");
      return;
    }
  
    if (selectedFacilities[newFacility] === undefined || selectedFacilities[newFacility] < 0) {
      alert("กรุณากรอกราคาเป็นตัวเลขบวก");
      return;
    }
  
    if (await isFacilityNameDuplicate(newFacility)) {
      alert("สิ่งอำนวยความสะดวกนี้มีอยู่แล้ว");
      return;
    }
  
    const res = await fetch(`${API_URL}/facilities/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fac_name: newFacility, price: selectedFacilities[newFacility] }),
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
  
  const updateFacility = async (facId, updatedName, updatedPrice) => {
    if (!updatedName.trim()) {
      alert("กรุณากรอกชื่อสิ่งอำนวยความสะดวก");
      return;
    }
  
    if (updatedPrice === undefined || updatedPrice < 0) {
      alert("กรุณากรอกราคาเป็นตัวเลขบวก");
      return;
    }
  
    if (await isFacilityNameDuplicate(updatedName)) {
      alert("สิ่งอำนวยความสะดวกนี้มีอยู่แล้ว");
      return;
    }
  
    const res = await fetch(`${API_URL}/facilities/${facId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fac_name: updatedName, price: updatedPrice }),
    });
  
    const data = await res.json();
    if (data.error) {
      console.error("Error:", data.error);
      return;
    }
  
    setFacilities(
      facilities.map((facility) =>
        facility.fac_id === facId ? { ...facility, fac_name: updatedName, price: updatedPrice } : facility
      )
    );
  };

  const deleteFacilityWithConfirm = (facId) => {
    if (window.confirm("คุณแน่ใจว่าจะลบสิ่งอำนวยความสะดวกนี้?")) {
      fetch(`${API_URL}/facilities/delete/${facId}`, { method: "DELETE" })
        .then((res) => res.json())
        .then((data) => {
          if (data.message) {
            alert(data.message);
            setFacilities(facilities.filter((fac) => fac.fac_id !== facId));
          }
        })
        .catch((error) => alert("ไม่สามารถลบสิ่งอำนวยความสะดวกได้"));
    }
  };
  
  // ฟังก์ชันเพิ่มประเภทกีฬาที่ใหม่
  const addNewSport = async () => {
    if (!newSport.trim()) return;

    if (isSportNameDuplicate(newSport)) {
      alert("ประเภทกีฬานี้มีอยู่แล้ว");
      return;
    }

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
  // ฟังก์ชันตรวจสอบชื่อประเภทกีฬาซ้ำ
  const isSportNameDuplicate = (name) => {
    return sports.some((sport) => sport.sport_name === name);
  };
  
  
  const deleteSportWithConfirm = (sportId) => {
    if (window.confirm("คุณแน่ใจว่าจะลบประเภทกีฬานี้?")) {
      fetch(`${API_URL}/sports_types/delete/${sportId}`, { method: "DELETE" })
        .then((res) => res.json())
        .then((data) => {
          if (data.message) {
            alert(data.message);
            setSports(sports.filter((sport) => sport.sport_id !== sportId));
          }
        })
        .catch((error) => alert("ไม่สามารถลบประเภทกีฬาได้"));
    }
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
              <button onClick={() => deleteFacilityWithConfirm(fac.fac_id)} className="delete-btn">
                ลบ
              </button>
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
            <button
              className="savebtn"
              type="button"
              onClick={addNewFacility}
            >
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
<div className="facilities-list">
  {facilities.map((facility) => (
    <div key={facility.fac_id} className="facility-item">
      <p>
        <strong>{facility.fac_name}</strong>
      </p>
      <p>ราคา: {facility.price} บาท</p>
      <button onClick={() => deleteFacility(facility.fac_id)}>ลบ</button>
      <button
        onClick={() => updateFacility(facility.fac_id, facility.fac_name, facility.price)}
      >
        แก้ไข
      </button>
    </div>
  ))}
</div>
      {/* ประเภทกีฬา */}
      <div className="sports-section">
        <h2>ประเภทกีฬา</h2>
        <div className="sports-list">
          {sports.map((sport) => (
            <div key={sport.sport_id} className="sport-item">
              <label>{sport.sport_name}</label>
              <button onClick={() => deleteSportWithConfirm(sport.sport_id)} className="delete-btn">
                ลบ
              </button>
            </div>
          ))}
        </div>

        {!showNewSportInput ? (
          <button
            className="addsport"
            type="button"
            onClick={() => setShowNewSportInput(true)}
          >
            + เพิ่มประเภทกีฬาใหม่
          </button>
        ) : (
          <div>
            <input
              type="text"
              placeholder="ชื่อประเภทกีฬา"
              value={newSport}
              onChange={(e) => setNewSport(e.target.value)}
            />
            <button
              className="savebtn"
              type="button"
              onClick={addNewSport}
            >
              บันทึก
            </button>
            <button
              className="canbtn"
              type="button"
              onClick={() => setShowNewSportInput(false)}
            >
              ยกเลิก
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
