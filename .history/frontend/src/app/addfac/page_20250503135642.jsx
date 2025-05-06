"use client";
import React, { useState, useEffect, use } from "react";
import "@/app/css/add.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

export default function RegisterFieldForm() {
  const router = useRouter("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [facilities, setFacilities] = useState([]);
  const [newFacility, setNewFacility] = useState("");
  const [showNewFacilityInput, setShowNewFacilityInput] = useState(false);
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)
  const [showConfirmModal, setShowConfirmModal] = useState(false); // สำหรับการแสดงโมดอล
  const [facilityToDelete, setFacilityToDelete] = useState(null); // เก็บข้อมูลสิ่งอำนวยความสะดวกที่จะลบ
  const [editingFacility, setEditingFacility] = useState(null); // สำหรับเก็บข้อมูลสิ่งอำนวยความสะดวกที่กำลังแก้ไข
  const [newFacilityName, setNewFacilityName] = useState(""); // สำหรับเก็บชื่อใหม่ของสิ่งอำนวยความสะดวก
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    
    if (user?.status !== "ตรวจสอบแล้ว") {
      router.push("/verification");
    }

    if (user?.role !== "admin") {
      router.push("/");
    }
  }, [user, isLoading, router]);

  //  โหลดสิ่งอำนวยความสะดวก
  useEffect(() => {
    fetch(`${API_URL}/facilities`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setFacilities(data))
      .catch((error) => console.error("Error fetching facilities:", error));
  }, []);

  // ฟังก์ชันเพิ่มสิ่งอำนวยความสะดวกใหม่
  const addNewFacility = async () => {
    if (!newFacility.trim()) return;
    const res = await fetch(`${API_URL}/facilities/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
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

  const deleteFacility = async () => {
    if (!facilityToDelete) return;
    const res = await fetch(
      `${API_URL}/facilities/delete/${facilityToDelete}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
    const res = await fetch(
      `${API_URL}/facilities/update/${editingFacility.fac_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
      {/* สิ่งอำนวยความสะดวก */}
      <div className="fac-container">
        <div className="input-group">
          <label>สิ่งอำนวยความสะดวกทั้งหมด</label>
        </div>
        {/* Display List of Facilities */}
        <div className="factcon">
          {facilities.map((fac) => (
            <div key={fac.fac_id} className="facility-item">
              <div className="input-group-checkbox">
                <label>{fac.fac_name}</label>
              </div>

              {/* ปุ่มแก้ไข */}
              <button
                className="editbtn"
                type="button"
                onClick={() => {
                  setEditingFacility(fac);
                  setNewFacilityName(fac.fac_name);
                }}
              >
                แก้ไข
              </button>

              {/* ปุ่มลบ */}
              <button
                className="deletebtn"
                type="button"
                onClick={() => confirmDeleteFacility(fac.fac_id)}
              >
                ลบ
              </button>
            </div>
          ))}
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
