"use client";
import React, { useState, useEffect } from "react";
import "@/app/css/add.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

export default function RegisterFieldForm() {
  const router = useRouter("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [showConfirmModal, setShowConfirmModal] = useState(false); // โมดอลยืนยันลบ
  const [showEditModal, setShowEditModal] = useState(false); // โมดอลแก้ไข
  const [sports, setSports] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)
  const [editSport, setEditSport] = useState(null); // สำหรับเก็บข้อมูลประเภทกีฬาที่กำลังแก้ไข
  const [newSportName, setNewSportName] = useState(""); // สำหรับเก็บชื่อใหม่ของประเภทกีฬา
  const [SportTypeToDelete, setSportTypeToDelete] = useState(null); // เก็บข้อมูลประเภทกีฬาที่จะลบ
  const [showNewSportInput, setShowNewSportInput] = useState(false); // ฟอร์มสำหรับเพิ่มประเภทกีฬาใหม่
  const [newSport, setNewSport] = useState(""); // ชื่อประเภทกีฬาที่จะเพิ่ม
  const { user, isLoading } = useAuth();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

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
    const fetchSports = async () => {
      setDataLoading(true);
      try {
        // await new Promise((resolve) => setTimeout(resolve, 200));
        const res = await fetch(`${API_URL}/sports_types`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("ไม่สามารถโหลดประเภทกีฬาได้");
        }

        const data = await res.json();
        setSports(data);
      } catch (err) {
        console.error("Error fetching sports:", err);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", err);
        setMessageType("error");
        setError(err.message || "เกิดข้อผิดพลาด");
      } finally {
        setDataLoading(false);
      }
    };

    fetchSports();
  }, []);

  // ฟังก์ชันเพิ่มประเภทกีฬาใหม่
  const addType = async () => {
    if (!newSport.trim()) return;
    SetstartProcessLoad(true);
    try {
      const res = await fetch(`${API_URL}/sports_types/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ sport_name: newSport }),
      });

      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
        setMessageType("error");
        return;
      }

      setSports([...sports, data]); // เพิ่มประเภทกีฬาใหม่ใน state
      setNewSport(""); // รีเซ็ตชื่อประเภทกีฬา
      setShowNewSportInput(false); // ซ่อนฟอร์มการเพิ่ม
      setMessage("เพิ่มประเภทกีฬาสำเร็จ");
      setMessageType("success");
    } catch (err) {
      console.error("Fetch error:", err);
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", err);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  // ฟังก์ชันลบประเภทกีฬา
  const deleteSportType = async () => {
    if (!SportTypeToDelete) return;
    SetstartProcessLoad(true);
    try {
      const res = await fetch(
        `${API_URL}/sports_types/delete/${SportTypeToDelete}`,
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
        setMessage(data.error);
        setMessageType("error");
        return;
      }
      setSports(sports.filter((sport) => sport.sport_id !== SportTypeToDelete)); // ลบประเภทกีฬาจาก state
      setShowConfirmModal(false); // ซ่อนโมดอล
      setMessage("ลบประเภทกีฬาสำเร็จ");
      setMessageType("success");
    } catch (err) {
      console.error("Fetch error:", err);
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", err);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  // ฟังก์ชันแก้ไขชื่อประเภทกีฬา
  const editSportType = async () => {
    if (!newSportName.trim()) return;
    SetstartProcessLoad(true);
    try {
      const res = await fetch(
        `${API_URL}/sports_types/update/${editSport.sport_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ sport_name: newSportName }),
        }
      );

      const data = await res.json();

      if (data.error) {
        setMessage(data.error); // แสดงข้อผิดพลาดหากชื่อซ้ำ
        setMessageType("error");
        return;
      }

      setSports(
        sports.map((sport) =>
          sport.sport_id === editSport.sport_id
            ? { ...sport, sport_name: newSportName }
            : sport
        )
      );
      setEditSport(null); // รีเซ็ตการแก้ไข
      setNewSportName(""); // รีเซ็ตชื่อใหม่
      setShowEditModal(false); // ปิดโมดอลแก้ไข
      setMessage("แก้ไขประเภทกีฬาสำเร็จ");
      setMessageType("success");
    } catch (err) {
      console.error("Fetch error:", err);
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  // if (isLoading)
  //   return (
  //     <div className="load">
  //       <span className="spinner"></span>
  //     </div>
  //   );
  // if (dataLoading)
  //   return (
  //     <div className="load">
  //       <span className="spinner"></span>
  //     </div>
  //   );

  if (startProcessLoad)
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
      </div>
    );

  return (
    <div>
      <div className="fac-container-admin">
        <div className="input-group-admin">
          <label>ประเภทกีฬาทั้งหมด</label>
        </div>
        <div className="typecon-admin">
          {sports.length > 0 ? (
            sports.map((sport) => (
              <div key={sport.sport_id} className="typename-admin">
                <div className="sportname-admin">{sport.sport_name}</div>
                <button
                  className="editbtn-admin"
                  type="button"
                  onClick={() => {
                    setEditSport(sport);
                    setNewSportName(sport.sport_name);
                    setShowEditModal(true);
                  }}
                >
                  แก้ไข
                </button>
                <button
                  className="deletebtn-admin"
                  type="button"
                  onClick={() => {
                    setSportTypeToDelete(sport.sport_id);
                    setShowConfirmModal(true);
                  }}
                >
                  ลบ
                </button>
              </div>
            ))
          ) : (
            <p>ไม่มีข้อมูล</p>
          )}
        </div>

        {showConfirmModal && (
          <div className="confirm-modal-type">
            <div className="modal-content-type">
              <p>คุณแน่ใจหรือไม่ว่าต้องการลบประเภทกีฬานี้?</p>
              <div className="modal-actions-type">
                <button className="confirmbtn-type" onClick={deleteSportType}>
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

        {showEditModal && (
          <div className="edit-modal-type">
            <div className="modal-content-type">
              <input
                type="text"
                maxLength={50}
                value={newSportName}
                onChange={(e) => setNewSportName(e.target.value)}
                placeholder="แก้ไขชื่อประเภทกีฬา"
              />
              <div className="modal-actions-tpye">
                <button className="confirmbtn-type" onClick={editSportType}>
                  บันทึกการแก้ไข
                </button>
                <button
                  className="cancelbtn-type"
                  onClick={() => setShowEditModal(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="addsportcon-admin">
          {!showNewSportInput ? (
            <button
              className="addsport-admin"
              type="button"
              onClick={() => setShowNewSportInput(true)}
            >
              + เพิ่มประเภทกีฬาใหม่
            </button>
          ) : (
            <div className="add-sport-form">
              <input
                type="text"
                maxLength={50}
                placeholder="ชื่อประเภทกีฬา"
                value={newSport}
                onChange={(e) => setNewSport(e.target.value)}
              />
              <div className="form-actions-admin">
                <button
                  className="savebtn-admin"
                  type="button"
                  onClick={addType}
                >
                  บันทึก
                </button>
                <button
                  className="cancelbtn-admin"
                  type="button"
                  onClick={() => setShowNewSportInput(false)}
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
    </div>
  );
}
