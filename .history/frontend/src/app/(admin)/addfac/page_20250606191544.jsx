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
  const [startProcessLoad, SetstartProcessLoad] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }

    if (user?.role !== "admin") {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    fetch(`${API_URL}/facilities`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setFacilities(data))
      .catch((error) => console.error("Error fetching facilities:", error));
  }, []);

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
    SetstartProcessLoad(true);
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
      SetstartProcessLoad(false);
      setMessage(data.error);
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
    SetstartProcessLoad(true);
    setEditingFacility(null);
    setNewFacilityName("");
  };

  if (isLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
    <>
      <div className="fac-container-admin">
        <div className="input-group-admin">
          <label>สิ่งอำนวยความสะดวกทั้งหมด</label>
        </div>
        <div className="factcon-admin">
          {facilities.map((fac) => (
            <div key={fac.fac_id} className="facility-item-admin">
              <div className="input-group-checkbox-admin">
                <label>{fac.fac_name}</label>
              </div>
              <button
                className="editbtn-admin"
                type="button"
                onClick={() => {
                  setEditingFacility(fac);
                  setNewFacilityName(fac.fac_name);
                }}
              >
                แก้ไข
              </button>
              <button
                className="deletebtn-admin"
                type="button"
                onClick={() => confirmDeleteFacility(fac.fac_id)}
              >
                ลบ
              </button>
            </div>
          ))}
        </div>

        {editingFacility && (
          <div className="edit-form-fac">
            <input
              type="text"
              maxLength={50}
              placeholder="ชื่อสิ่งอำนวยความสะดวก"
              value={newFacilityName}
              onChange={(e) => setNewFacilityName(e.target.value)}
            />
            <div className="form-actions-admin">
              <button className="savebtn-admin" onClick={editFacility}>
                บันทึก
              </button>
              <button
                className="cancelbtn-admin"
                onClick={() => {
                  setEditingFacility(null);
                  setNewFacilityName("");
                }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {showConfirmModal && (
          <div className="confirm-modal-type">
            <div className="modal-content-type">
              <p>คุณแน่ใจหรือไม่ว่าต้องการลบสิ่งอำนวยความสะดวกนี้?</p>
              <div className="modal-actions-type">
                <button className="confirmbtn-type" onClick={deleteFacility}>
                  ยืนยัน
                </button>
                <button
                  className="cancelbtn-type"
                  onClick={() => setShowConfirmModal(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="addfaccon-admin">
          {!showNewFacilityInput ? (
            <button
              className="addfac-admin"
              type="button"
              onClick={() => setShowNewFacilityInput(true)}
            >
              + เพิ่มสิ่งอำนวยความสะดวกใหม่
            </button>
          ) : (
            <div className="add-facility-form-admin">
              <input
                type="text"
                maxLength={50}
                placeholder="ชื่อสิ่งอำนวยความสะดวก"
                value={newFacility}
                onChange={(e) => setNewFacility(e.target.value)}
              />
              <div className="form-actions-admin">
                <button
                  className="savebtn-admin"
                  type="button"
                  onClick={addNewFacility}
                >
                  บันทึก
                </button>
                <button
                  className="canbtn-admin"
                  type="button"
                  onClick={() => setShowNewFacilityInput(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}
        </div>

        {message && (
          <div className={`message-box ${messageType}`}>
            <p>{message}</p>
          </div>
        )}
      </div>
    </>
  );
}
