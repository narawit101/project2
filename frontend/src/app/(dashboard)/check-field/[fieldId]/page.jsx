"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/app/css/check-field.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

const StatusChangeModal = ({
  newStatus,
  onConfirm,
  onClose,
  reasoning,
  setReasoning,
  startProcessLoad,
}) => (
  <div className="confirm-modal-check-field">
    <div className="modal-content-check-field">
      <div className="newstatus">
        คุณแน่ใจว่าจะเปลี่ยนสถานะเป็น:
        <h2
          className={`newstatus-text ${
            newStatus === "ผ่านการอนุมัติ"
              ? "status-approve"
              : newStatus === "ไม่ผ่านการอนุมัติ"
              ? "status-reject"
              : "status-pending"
          }`}
        >
          {newStatus} ?
        </h2>
      </div>
      {newStatus === "ไม่ผ่านการอนุมัติ" && (
        <div className="resoning-check-field">
          <textarea
            placeholder="กรุณาใส่เหตุผลที่ไม่ผ่านการอนุมัติ"
            required
            disabled={startProcessLoad}
            maxLength={500}
            value={reasoning}
            onChange={(e) => {
              setReasoning(e.target.value);
            }}
          />
        </div>
      )}
      <div className="modal-actions-check-field">
        <button
          style={{
            cursor: startProcessLoad ? "not-allowed" : "pointer",
          }}
          disabled={startProcessLoad}
          className="confirmbtn"
          onClick={onConfirm}
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
          style={{
            cursor: startProcessLoad ? "not-allowed" : "pointer",
          }}
          disabled={startProcessLoad}
          className="cancelbtn"
          onClick={onClose}
        >
          ยกเลิก
        </button>
      </div>
    </div>
  </div>
);

export default function CheckFieldDetail() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { fieldId } = useParams();
  const [fieldData, setFieldData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const { user, isLoading } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [reasoning, setReasoning] = useState("");
  const router = useRouter();
  usePreventLeave(startProcessLoad);

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
      try {
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
        setDataLoading(false);
      }
    };

    fetchFieldData();
  }, [fieldId, router]);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await fetch(`${API_URL}/facilities/${fieldId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch facilities");
        }

        const data = await response.json();
        setFacilities(data.data);
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

  const openConfirmModal = (status) => {
    setReasoning("");
    setNewStatus(status);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setReasoning("");
  };

  const updateFieldStatus = async (fieldId, newStatus) => {
    if (newStatus === "ไม่ผ่านการอนุมัติ" && reasoning.length === 0) {
      setMessage("กรุณาเลือกเหตุผลการปฏิเสธ");
      setMessageType("error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      const response = await fetch(
        `${API_URL}/field/update-status/${fieldId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status: newStatus, reasoning: reasoning }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setFieldData({ ...fieldData, status: newStatus });
        setMessage(`อัพเดทสถานะเป็น: ${newStatus}`);
        {
          newStatus === "ผ่านการอนุมัติ"
            ? setMessageType("success")
            : setMessageType("error");
        }
        console.log("สถานะสนามกีฬาอัพเดทสำเร็จ:", reasoning);
        closeConfirmModal();
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
      setReasoning("");
    }
  };

  const daysInThai = {
    Mon: "จันทร์",
    Tue: "อังคาร",
    Wed: "พุธ",
    Thu: "พฤหัสบดี",
    Fri: "ศุกร์",
    Sat: "เสาร์",
    Sun: "อาทิตย์",
  };
  const formatPrice = (value) => new Intl.NumberFormat("th-TH").format(value);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  if (dataLoading)
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
        {fieldData?.img_field ? (
          <div className="image-container">
            <img
              src={`${fieldData.img_field}`}
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
              <p>
                {fieldData?.open_days
                  ?.map((day) => daysInThai[day])
                  ?.join(", ")}
              </p>
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
              <strong>ค่ามัดจำ:</strong> {formatPrice(fieldData?.price_deposit)}{" "}
              บาท
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
        {fieldData?.documents ? (
          (Array.isArray(fieldData.documents)
            ? fieldData.documents
            : fieldData.documents.split(",")
          ).map((doc, i) => (
            <div className="document-container" key={i}>
              <a
                href={`${doc.trim()}`}
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
                  <strong>{facility.fac_name}</strong>{" "}
                  <p>{formatPrice(facility.fac_price)} บาท</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <h1>สนามย่อย</h1>
        <div className="sub-fields-container-check-field">
          {fieldData?.sub_fields && fieldData.sub_fields.length > 0 ? (
            fieldData.sub_fields.map((sub) => (
              <div
                key={sub.sub_field_id}
                className="sub-field-card-check-field"
              >
                <p>
                  <strong>ชื่อสนามย่อย:</strong> {sub?.sub_field_name}
                </p>
                <p>
                  <strong>ราคา:</strong> {formatPrice(sub?.price)} บาท
                </p>
                <p>
                  <strong>ประเภทกีฬา:</strong> {sub?.sport_name}
                </p>
                <p>
                  <strong>ผู้เล่นต่อฝั่ง:</strong> {sub?.players_per_team} คน
                </p>
                <p>
                  <strong>ความกว้างของสนาม</strong>{" "}
                  {formatPrice(sub?.wid_field)} เมตร
                </p>
                <p>
                  <strong>ความยาวของสนาม</strong>{" "}
                  {formatPrice(sub?.length_field)} เมตร
                </p>
                <p>
                  <strong>ประเภทของพื้นสนาม</strong> {sub?.field_surface}
                </p>
                {sub.add_ons && sub.add_ons.length > 0 ? (
                  <div className="add-ons-container-check-field">
                    <h3>ราคาสำหรับจัดกิจกรรมพิเศษ</h3>
                    {sub.add_ons.map((addon) => (
                      <p key={addon.add_on_id}>
                        {addon.content} - {formatPrice(addon.price)} บาท
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
              {fieldData?.status !== "ผ่านการอนุมัติ" && (
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="approve-btn"
                  onClick={() => openConfirmModal("ผ่านการอนุมัติ")}
                >
                  ผ่านการอนุมัติ
                </button>
              )}
              {fieldData?.status !== "ไม่ผ่านการอนุมัติ" && (
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="reject-btn"
                  onClick={() => openConfirmModal("ไม่ผ่านการอนุมัติ")}
                >
                  ไม่ผ่านการอนุมัติ
                </button>
              )}
            </>
          )}
        </div>
        {showConfirmModal && (
          <StatusChangeModal
            newStatus={newStatus}
            onConfirm={() => {
              updateFieldStatus(fieldId, newStatus, reasoning);
            }}
            startProcessLoad={startProcessLoad}
            reasoning={reasoning}
            setReasoning={setReasoning}
            onClose={closeConfirmModal}
          />
        )}
      </div>
    </>
  );
}
