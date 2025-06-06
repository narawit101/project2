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

  const handleEditFacility = (facId, currentName, currentPrice) => {
    const newName = prompt("แก้ไขชื่อสิ่งอำนวยความสะดวก", currentName);
    const newPrice = prompt("แก้ไขราคา", currentPrice);
  
    if (newName !== null && newPrice !== null) {
      // ส่งข้อมูลที่แก้ไขไปยัง backend
      fetch(`${API_URL}/facilities/update/${facId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fac_name: newName, price: newPrice }),
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("Error:", data.error);
          return;
        }
        // อัปเดตข้อมูลสิ่งอำนวยความสะดวกใน state
        setFacilities(facilities.map((fac) =>
          fac.fac_id === facId ? { ...fac, fac_name: newName, price: newPrice } : fac
        ));
      })
      .catch((error) => {
        console.error("Error updating facility:", error);
      });
    }
  };
  
  // ฟังก์ชันการอัปเดตราคา
  const handleFacilityPriceChange = (facId, price) => {
    setSelectedFacilities((prev) => ({
      ...prev,
      [facId]: price,
    }));
  };

  // ฟังก์ชันตรวจสอบชื่อสิ่งอำนวยความสะดวกซ้ำ
  const isFacilityNameDuplicate = (name) => {
    return facilities.some((facility) => facility.fac_name === name);
  };

  // ฟังก์ชันตรวจสอบชื่อประเภทกีฬาซ้ำ
  const isSportNameDuplicate = (name) => {
    return sports.some((sport) => sport.sport_name === name);
  };

  // ฟังก์ชันเพิ่มสิ่งอำนวยความสะดวกใหม่
  const addNewFacility = async () => {
    if (!newFacility.trim() || !newPrice) return;
  
    if (isFacilityNameDuplicate(newFacility)) {
      alert("สิ่งอำนวยความสะดวกนี้มีอยู่แล้ว");
      return;
    }
  
    const res = await fetch(`${API_URL}/facilities/add/price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fac_name: newFacility, price: newPrice }),
    });
  
    const data = await res.json();
    if (data.error) {
      console.error("Error:", data.error);
      return;
    }
  
    setFacilities([...facilities, data]);
    setNewFacility("");
    setNewPrice("");
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
          <label>{fac.fac_name}</label>
        </div>

        {/* ช่องใส่ราคา */}
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

        {/* ปุ่มแก้ไข */}
        <button
          className="edit-btn"
          onClick={() => handleEditFacility(fac.fac_id, fac.fac_name, selectedFacilities[fac.fac_id])}
        >
          แก้ไข
        </button>

        {/* ปุ่มลบ */}
        <button
          onClick={() => deleteFacilityWithConfirm(fac.fac_id)}
          className="delete-btn"
        >
          ลบ
        </button>
      </div>
    ))}
  </div>

  {/* ปุ่มเพิ่มสิ่งอำนวยความสะดวกใหม่ */}
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
      <input
        type="number"
        placeholder="ราคา"
        value={newPrice || ""}
        onChange={(e) => setNewPrice(e.target.value)}
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
