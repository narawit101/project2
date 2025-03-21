"use client";
import React, { useState, useEffect } from "react";
import "@/app/css/add.css";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";

export default function RegisterFieldForm() {
    const router = useRouter("");
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const [showConfirmModal, setShowConfirmModal] = useState(false); // สำหรับการแสดงโมดอล
    const [sports, setSports] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState(""); // State สำหรับข้อความ
    const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)
    const [editSport, setEditSport] = useState(null); // สำหรับเก็บข้อมูลสิ่งอำนวยความสะดวกที่กำลังแก้ไข
    const [newSportName, setNewSportName] = useState(""); // สำหรับเก็บชื่อใหม่ของสิ่งอำนวยความสะดวก
  
    const [SportTypeToDelete, setSportTypeToDelete] = useState(null); // เก็บข้อมูลสิ่งอำนวยความสะดวกที่จะลบ
    const [showNewSportInput, setShowNewSportInput] = useState(false); // ฟอร์มสำหรับเพิ่มประเภทกีฬาใหม่
    const [newSport, setNewSport] = useState(""); // ชื่อประเภทกีฬาที่จะเพิ่ม
const [editingFacility, setEditingFacility] = useState(null); // สำหรับเก็บข้อมูลสิ่งอำนวยความสะดวกที่กำลังแก้ไข
  const [newFacilityName, setNewFacilityName] = useState(""); // สำหรับเก็บชื่อใหม่ของสิ่งอำนวยความสะดวก

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const expiresAt = localStorage.getItem("expiresAt");

    if (
      !token ||
      !storedUser ||
      !expiresAt ||
      Date.now() > parseInt(expiresAt)
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("expiresAt");
      router.push("/login");
      return;
    }

    const user = JSON.parse(storedUser);
    setCurrentUser(user);

    if (user.role !== "admin") {
      router.push("/");
    }

    setIsLoading(false);
  }, []);

  //  โหลดสิ่งอำนวยความสะดวก
  // โหลดประเภทกีฬา
  useEffect(() => {
    fetch(`${API_URL}/sports_types`)
      .then((res) => res.json())
      .then((data) => setSports(data))
      .catch((error) => console.error("Error fetching sports:", error));
  }, []);

  // ฟังก์ชันเพิ่มสิ่งอำนวยความสะดวกใหม่
  const addNewFacility = async () => {
    if (!newFacility.trim()) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/facilities/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fac_name: newFacility }),
    });

    const data = await res.json();

    if (data.error) {
      setMessage(data.error);
      setMessageType("error");
      return;
    }

    setFacilities([...facilities, data]);
    setNewFacility("");
    setShowNewFacilityInput(false);
  };

  const confirmDeleteFacility = (id) => {
    setFacilityToDelete(id);
    setShowConfirmModal(true);
  };

  // ฟังก์ชันลบสิ่งอำนวยความสะดวกจริงๆ
  const deleteFacility = async () => {
    if (!facilityToDelete) return;
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_URL}/facilities/delete/${facilityToDelete}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (data.error) {
      console.error("Error:", data.error);
      return;
    }

    setFacilities(facilities.filter((fac) => fac.fac_id !== facilityToDelete)); // ลบสิ่งอำนวยความสะดวกจาก state
    setShowConfirmModal(false); // ซ่อนโมดอล
  };

  // ฟังก์ชันแก้ไขชื่อสิ่งอำนวยความสะดวก
  const editFacility = async () => {
    if (!newFacilityName.trim()) return;
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_URL}/facilities/update/${editingFacility.fac_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fac_name: newFacilityName }),
      }
    );

    const data = await res.json();

    if (data.error) {
      setMessage(data.error); // แสดงข้อผิดพลาดหากชื่อซ้ำ
      setMessageType("error");
      return;
    }

    setFacilities(
      facilities.map((fac) =>
        fac.fac_id === editingFacility.fac_id
          ? { ...fac, fac_name: newFacilityName }
          : fac
      )
    );
    setEditingFacility(null); // รีเซ็ตการแก้ไข
    setNewFacilityName(""); // รีเซ็ตชื่อใหม่
  };
  if (isLoading)
    return (
      <div className="load">
        <span className="spinner"></span> กำลังโหลด...
      </div>
    );

  return (
    <>
      <div className="navbar">
        <Navbar></Navbar>
      </div>
      {/* สิ่งอำนวยความสะดวก */}
      <div className="input-group">
        <label>สิ่งอำนวยความสะดวก</label>
      </div>

      <div className="container">
        {/* Display List of Facilities */}
        <div className="factcon">
        {sports.length > 0 ? (
            sports.map((sport) => (
              <div key={sport.sport_id}>
                <div className="sportname">{sport.sport_name}</div>
                <button
                  className="editbtn"
                  type="button"
                  onClick={() => {
                    setEditSport(sport);
                    setNewSportName(sport.sport_name);
                  }}
                >
                  แก้ไข
                </button>
                <button
                  className="deletebtn"
                  type="button"
                  onClick={() => confirmDeleteSportType(sport.sport_id)}
                >
                  ลบ
                </button>
              </div>
            ))
          ) : (
            <p>ไม่มีข้อมูล</p>
          )}
        </div>

        {/* ฟอร์มสำหรับแก้ไขสิ่งอำนวยความสะดวก */}
        {editingFacility && (
          <div className="edit-form">
            <input
              type="text"
              placeholder="ชื่อสิ่งอำนวยความสะดวก"
              value={newFacilityName}
              onChange={(e) => setNewFacilityName(e.target.value)}
            />
            <div className="form-actions">
              <button className="savebtn" onClick={editFacility}>
                บันทึก
              </button>
              <button
                className="cancelbtn"
                onClick={() => {
                  setEditingFacility(null);
                  setNewFacilityName(""); // รีเซ็ตการแก้ไข
                }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {/* โมดอลคอนเฟิร์มสำหรับการลบ */}
        {showConfirmModal && (
          <div className="confirm-modal">
            <div className="modal-content">
              <p>คุณแน่ใจหรือไม่ว่าต้องการลบสิ่งอำนวยความสะดวกนี้?</p>
              <div className="modal-actions">
                <button className="confirmbtn" onClick={deleteFacility}>
                  ยืนยัน
                </button>
                <button
                  className="cancelbtn"
                  onClick={() => setShowConfirmModal(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ฟอร์มสำหรับเพิ่มสิ่งอำนวยความสะดวกใหม่ */}
        <div className="addfaccon">
          {!showNewFacilityInput ? (
            <button
              className="addfac"
              type="button"
              onClick={() => setShowNewFacilityInput(true)}
            >
              + เพิ่มสิ่งอำนวยความสะดวกใหม่
            </button>
          ) : (
            <div className="add-facility-form">
              <input
                type="text"
                placeholder="ชื่อสิ่งอำนวยความสะดวก"
                value={newFacility}
                onChange={(e) => setNewFacility(e.target.value)}
              />
              <div className="form-actions">
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
            </div>
          )}
        </div>

        {/* ข้อความแสดงผล */}
        {message && (
          <div className={`message-box ${messageType}`}>
            <p>{message}</p>
          </div>
        )}
      </div>
    </>
  );
}
