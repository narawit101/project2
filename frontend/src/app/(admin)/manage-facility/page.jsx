"use client";
import React, { useState, useEffect } from "react";
import "@/app/css/manage-fac-type.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

export default function RegisterFieldForm() {
  const router = useRouter("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [facilities, setFacilities] = useState([]);
  const [newFacility, setNewFacility] = useState("");
  const [showNewFacilityInput, setShowNewFacilityInput] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState(null);
  const [editingFacility, setEditingFacility] = useState(null);
  const [newFacilityName, setNewFacilityName] = useState("");
  const { user, isLoading } = useAuth();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const facilitiesPerPage = 12;
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
    const fetchFacilities = async () => {
      setDataLoading(true);
      try {
        const res = await fetch(`${API_URL}/facilities`, {
          credentials: "include",
        });

        const data = await res.json();

        if (res.ok) {
          setFacilities(data);
        } else {
          console.error("Fetch error:", data.error || "ไม่สามารถโหลดข้อมูลได้");
          setMessage(data.error);
          setMessageType("error");
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดระหว่างเซิร์ฟเวอร์", error);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  const indexOfLast = currentPage * facilitiesPerPage;
  const indexOfFirst = indexOfLast - facilitiesPerPage;
  const currentFacilities = facilities.slice(indexOfFirst, indexOfLast);

  const addNewFacility = async () => {
    if (!newFacility.trim()) return;
    SetstartProcessLoad(true);
    try {
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
      setMessage("เพิ่มสิ่งอำนวยคความสะดวกสำเร็จ");
      setMessageType("success");
    } catch (err) {
      console.error("Fetch error:", err);
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const confirmDeleteFacility = (id) => {
    setFacilityToDelete(id);
    setShowConfirmModal(true);
  };

  const deleteFacility = async () => {
    if (!facilityToDelete) return;
    SetstartProcessLoad(true);
    try {
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
        setMessage(data.error);
        setMessageType("error");
        return;
      }

      setFacilities(
        facilities.filter((fac) => fac.fac_id !== facilityToDelete)
      );
      setShowConfirmModal(false);
      setMessage("ลบสิ่งอำนวยคความสะดวกเรียบร้อย");
      setMessageType("success");
    } catch (err) {
      setShowConfirmModal(false);
      console.error("Fetch error:", err);
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setMessageType("error");
    } finally {
      setShowConfirmModal(false);
      SetstartProcessLoad(false);
    }
  };

  const editFacility = async () => {
    if (!newFacilityName.trim()) return;
    SetstartProcessLoad(true);

    try {
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
      setEditingFacility(null);
      setNewFacilityName("");
      setMessage("แก้ไขสิ่งอำนวยคความสะดวกสำเร็จ");
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
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="fac-container-admin">
        <div className="input-group-admin">
          <label className="add-fac-title">สิ่งอำนวยความสะดวกทั้งหมด</label>

          <div className="addfaccon-admin">
            {!showNewFacilityInput ? (
              <button
                className="addfac-admin"
                type="button"
                onClick={() => setShowNewFacilityInput(true)}
              >
                + เพิ่มสิ่งอำนวยความสะดวก
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
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
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
                    className="canbtn-admin"
                    type="button"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    onClick={() => setShowNewFacilityInput(false)}
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
                <button
                  className="savebtn-admin"
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  onClick={editFacility}
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
        </div>
        <div className="factcon-admin">
          {currentFacilities.length > 0 ? (
            currentFacilities.map((fac) => (
              <div key={fac.fac_id} className="facility-item-admin">
                <div className="input-group-checkbox-admin">
                  <label>{fac.fac_name}</label>
                </div>
                <div className="button-group-add">
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
              </div>
            ))
          ) : (
            <p className="no-sport-type">ไม่พบข้อมูล</p>
          )}
        </div>
        <div className="pagination-facilities">
          {Array.from(
            { length: Math.ceil(facilities.length / facilitiesPerPage) },
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
              <p>คุณแน่ใจหรือไม่ว่าต้องการลบสิ่งอำนวยความสะดวกนี้?</p>
              <div className="modal-actions-type">
                <button
                  className="confirmbtn-type"
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  onClick={deleteFacility}
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
    </>
  );
}
