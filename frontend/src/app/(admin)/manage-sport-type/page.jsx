"use client";
import React, { useState, useEffect } from "react";
import "@/app/css/manage-fac-type.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

export default function RegisterFieldForm() {
  const router = useRouter("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sports, setSports] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [editSport, setEditSport] = useState(null);
  const [newSportName, setNewSportName] = useState("");
  const [SportTypeToDelete, setSportTypeToDelete] = useState(null);
  const [showNewSportInput, setShowNewSportInput] = useState(false);
  const [newSport, setNewSport] = useState("");
  const { user, isLoading } = useAuth();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const sportTypePerPage = 4;
  usePreventLeave(startProcessLoad);

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

  const indexOfLast = currentPage * sportTypePerPage;
  const indexOfFirst = indexOfLast - sportTypePerPage;
  const currentsportType = sports.slice(indexOfFirst, indexOfLast);

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

      setSports([...sports, data]);
      setNewSport("");
      setShowNewSportInput(false);
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
      setSports(sports.filter((sport) => sport.sport_id !== SportTypeToDelete));
      setShowConfirmModal(false);
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
        setMessage(data.error);
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
      setEditSport(null);
      setNewSportName("");
      setShowEditModal(false);
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

  if (isLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
    <div>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="fac-container-admin">
        <div className="input-group-admin">
          <label className="add-sport-title">ประเภทกีฬาทั้งหมด</label>

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
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    type="button"
                    onClick={addType}
                  >
                    {startProcessLoad ? (
                      <span className="dot-loading">
                        <span className="dot one">●</span>
                        <span className="dot two">●</span>
                        <span className="dot three">●</span>
                      </span>
                    ) : (
                      "บันทึก"
                    )}
                  </button>
                  <button
                    className="cancelbtn-admin"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    type="button"
                    onClick={() => setShowNewSportInput(false)}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>
          {dataLoading && (
            <div className="loading-data">
              <div className="loading-data-spinner"></div>
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
                  <button
                    className="confirmbtn-type"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    onClick={editSportType}
                  >
                    {startProcessLoad ? (
                      <span className="dot-loading">
                        <span className="dot one">●</span>
                        <span className="dot two">●</span>
                        <span className="dot three">●</span>
                      </span>
                    ) : (
                      "บันทึกการแก้ไข"
                    )}
                  </button>
                  <button
                    className="cancelbtn-type"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    onClick={() => setShowEditModal(false)}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="typecon-admin">
          {currentsportType.length > 0 ? (
            currentsportType.map((sport) => (
              <div key={sport.sport_id} className="typename-admin">
                <div className="sportname-admin">{sport.sport_name}</div>
                <div className="button-group-add">
                  <button
                    className="editbtn-admin"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
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
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    onClick={() => {
                      setSportTypeToDelete(sport.sport_id);
                      setShowConfirmModal(true);
                    }}
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-sport-type">ไม่พบข้อมูล</p>
          )}
        </div>
        <div className="pagination-facilities">
          {Array.from(
            { length: Math.ceil(sports.length / sportTypePerPage) },
            (_, i) => (
              <button
                key={i}
                className={currentPage === i + 1 ? "active" : ""}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            )
          )}
        </div>
        {showConfirmModal && (
          <div className="confirm-modal-type">
            <div className="modal-content-type">
              <p>คุณแน่ใจหรือไม่ว่าต้องการลบประเภทกีฬานี้?</p>
              <div className="modal-actions-type">
                <button
                  className="confirmbtn-type"
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  onClick={deleteSportType}
                >
                  {startProcessLoad ? (
                    <span className="dot-loading">
                      <span className="dot one">●</span>
                      <span className="dot two">●</span>
                      <span className="dot three">●</span>
                    </span>
                  ) : (
                    "ยืนยัน"
                  )}
                </button>
                <button
                  className="cancelbtn-type"
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  onClick={() => setShowConfirmModal(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
