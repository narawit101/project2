"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/app/css/checkField.css";
import { useAuth } from "@/app/contexts/AuthContext";

export default function CheckFieldDetail() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { fieldId } = useParams(); // รับค่า field_id จาก URL
  const [fieldData, setFieldData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // เปิดหรือปิดโมดอลยืนยัน
  const [newStatus, setNewStatus] = useState(""); // เก็บสถานะใหม่ที่จะเปลี่ยน
  const router = useRouter();
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)
  const { user, isLoading } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.push("/verification");
    }

    if (user?.role !== "admin" && user?.role !== "field_owner") {
      router.push("/");
    }
  }, [user, isLoading, , router]);

  useEffect(() => {
    const fetchFieldData = async () => {
      if (!fieldId) return;
      setDataLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 200));
        const res = await fetch(`${API_URL}/field/${fieldId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await res.json();

        if (data.error) {
          setMessage("ไม่พบข้อมูลสนามกีฬา", data.error);
          setMessageType("error");
          router.push("/");
        } else {
          console.log("ข้อมูลสนามกีฬา:", data);
          setFieldData(data);
        }
      } catch (error) {
        console.error("Error fetching field data:", error);
        setMessage("เกิดข้อผิดพลาดในการดึงข้อมูลสนามกีฬา", error);
        setMessageType("error");
      } finally {
        setDataLoading(false); // จบการโหลด
      }
    };

    fetchFieldData();
  }, [fieldId, router]);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await fetch(`${API_URL}/facilities/${fieldId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch facilities");
        }

        const data = await response.json();
        setFacilities(data);
      } catch (err) {
        console.log(err);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", err);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchFacilities();
  }, [fieldId]);

  // ฟังก์ชันเปิดโมดอลการยืนยันการเปลี่ยนสถานะ
  const openConfirmModal = (status) => {
    setNewStatus(status); // ตั้งค่าสถานะใหม่ที่ต้องการเปลี่ยน
    setShowConfirmModal(true); // เปิดโมดอล
  };

  // ฟังก์ชันปิดโมดอล
  const closeConfirmModal = () => {
    setShowConfirmModal(false); // ปิดโมดอล
  };

  // ฟังก์ชันอัปเดตสถานะสนามกีฬา
  const updateFieldStatus = async (fieldId, newStatus) => {
    SetstartProcessLoad(true);
    try {
      const response = await fetch(`${API_URL}/field/${fieldId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (response.ok) {
        setFieldData({ ...fieldData, status: newStatus });
        setMessage(`อัพเดทสถานะเป็น: ${newStatus}`);
        setMessageType("succes");
      } else {
        setMessage(`เกิดข้อผิดพลาด: ${data.error}`);
        setMessageType("error");
      }
    } catch (error) {
      console.error(" Error updating status:", error);
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const StatusChangeModal = ({ newStatus, onConfirm, onClose }) => (
    <div className="confirm-modal-check-field">
      <div className="modal-content-check-field">
        <div className="newstatus">
          คุณแน่ใจว่าจะเปลี่ยนสถานะเป็น: <h2>{newStatus}?</h2>
        </div>
        <div className="modal-actions-check-field">
          <button className="confirmbtn" onClick={onConfirm}>
            ยืนยัน
          </button>
          <button className="cancelbtn" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3000);

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
      <div className="check-field-detail-container">
        <h1 className="h1">รายละเอียดสนามกีฬา</h1>
        {/*  รูปภาพสนาม */}
        {fieldData?.img_field ? (
          <div className="image-container">
            <img
              src={`${API_URL}/${fieldData.img_field}`}
              alt="รูปสนามกีฬา"
              className="check-field-image"
            />
          </div>
        ) : (
          <div className="loading-data">
            <div className="loading-data-spinner"></div>
          </div>
        )}
        <div className="check-field-info">
          <div className="check-field-under">
            <p>
              <strong>สถานะ: </strong>
              <span
                className={
                  fieldData?.status === "ผ่านการอนุมัติ"
                    ? "status-approved"
                    : "status-rejected"
                }
              >
                {fieldData?.status}
              </span>
            </p>
            <p>
              <strong>ชื่อสนาม:</strong> {fieldData?.field_name}
            </p>
            <p>
              <strong>ที่อยู่:</strong> {fieldData?.address}
            </p>
            <p>
              <strong>พิกัด GPS:</strong>{" "}
              <a
                href={fieldData?.gps_location}
                target="_blank"
                rel="noopener noreferrer"
              >
                {fieldData?.gps_location}
              </a>
            </p>
            <p>
              <strong>วันที่เปิดทำการ</strong>
            </p>
            {dataLoading ? (
              <div className="loading-data">
                <div className="loading-data-spinner"></div>
              </div>
            ) : (
              fieldData?.open_days?.map((day, index) => (
                <p key={index}>{day}</p>
              ))
            )}

            <p>
              <strong>เวลาทำการ:</strong> {fieldData?.open_hours} -{" "}
              {fieldData?.close_hours}
            </p>
            <p>
              <strong>เจ้าของ:</strong> {fieldData?.first_name}{" "}
              {fieldData?.last_name}
            </p>
            <p>
              <strong>ค่ามัดจำ:</strong> {fieldData?.price_deposit} บาท
            </p>
            <p>
              <strong>ธนาคาร:</strong> {fieldData?.name_bank}
            </p>
            <p>
              <strong>ชื่อเจ้าของบัญชี:</strong> {fieldData?.account_holder}
            </p>
            <p>
              <strong>เลขบัญชีธนาคาร:</strong> {fieldData?.number_bank}
            </p>
            <p>
              <strong>รายละเอียดสนาม:</strong>
            </p>
            <p className="detail-checkfield">{fieldData?.field_description}</p>
          </div>
        </div>
        {/* แสดงเอกสาร (PDF) ถ้ามี */}
        {fieldData?.documents ? (
          (Array.isArray(fieldData.documents)
            ? fieldData.documents
            : fieldData.documents.split(",")
          ) // แปลงจาก string เป็น array
            .map((doc, i) => (
              <div className="document-container" key={i}>
                <a
                  href={`${API_URL}/${doc.trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="document-link"
                >
                  <p>เอกสารที่แนบไว้ {i + 1}</p>
                </a>
              </div>
            ))
        ) : (
          <p>ไม่มีเอกสารแนบ</p>
        )}
        <h1>สิ่งอำนวยความสะดวก</h1>
        <div className="field-facilities-check-field">
          {facilities.length === 0 ? (
            <p>ยังไม่มีสิ่งอำนวยความสะดวกสำหรับสนามนี้</p>
          ) : (
            <div className="facbox-checkfield">
              {facilities.map((facility, index) => (
                <div
                  className="facitem-checkfield"
                  key={`${facility.fac_id}-${index}`}
                >
                  {" "}
                  {/* Unique key using both fac_id and index */}
                  <strong>{facility.fac_name}</strong>:{" "}
                  <p>{facility.fac_price} บาท</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* ข้อมูลสนามย่อย (sub_fields) */}
        <h1>สนามย่อย</h1>
        <div className="sub-fields-container-check-field">
          {fieldData?.sub_fields && fieldData.sub_fields.length > 0 ? (
            fieldData.sub_fields.map((sub) => (
              <div
                key={sub.sub_field_id}
                className="sub-field-card-check-field"
              >
                <p>
                  <strong>ชื่อสนามย่อย:</strong> {sub.sub_field_name}
                </p>
                <p>
                  <strong>ราคา:</strong> {sub.price} บาท
                </p>
                <p>
                  <strong>ประเภทกีฬา:</strong> {sub.sport_name}
                </p>
                {/*  แสดง Add-ons ถ้ามี */}
                {sub.add_ons && sub.add_ons.length > 0 ? (
                  <div className="add-ons-container-check-field">
                    <h3>ราคาสำหรับจัดกิจกรรมพิเศษ</h3>
                    {sub.add_ons.map((addon) => (
                      <p key={addon.add_on_id}>
                        {addon.content} - {addon.price} บาท
                      </p>
                    ))}
                  </div>
                ) : (
                  <p>ไม่มีราคาสำหรับจัดกิจกรรมพิเศษ</p>
                )}
              </div>
            ))
          ) : (
            <p>ไม่มีสนามย่อย</p>
          )}
        </div>
        <div className="status-buttons">
          {user?.role === "admin" && (
            <>
              <button
                className="approve-btn"
                onClick={() => openConfirmModal("ผ่านการอนุมัติ")}
              >
                ผ่านการอนุมัติ
              </button>
              <button
                className="reject-btn"
                onClick={() => openConfirmModal("ไม่ผ่านการอนุมัติ")}
              >
                ไม่ผ่านการอนุมัติ
              </button>
            </>
          )}
        </div>
        {startProcessLoad && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
        {/* โมดอลยืนยันการเปลี่ยนสถานะ */}
        {showConfirmModal && (
          <StatusChangeModal
            newStatus={newStatus}
            onConfirm={() => {
              updateFieldStatus(fieldId, newStatus);
              closeConfirmModal(); // ปิดโมดอลหลังจากยืนยัน
            }}
            onClose={closeConfirmModal}
          />
        )}
      </div>
    </>
  );
}
