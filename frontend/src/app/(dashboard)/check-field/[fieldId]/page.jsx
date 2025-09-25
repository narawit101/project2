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
    const readNotifications = async () => {
      if (!API_URL || !fieldId) return;
      try {
        const res = await fetch(`${API_URL}/notification/read-notification`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key_id: Number(fieldId) }),
        });

        if (res.ok) {
          console.log("Notifications marked as read for booking:", fieldId);
          window.dispatchEvent(
            new CustomEvent("notifications-marked-read", {
              detail: { key_id: Number(fieldId) },
            })
          );
        } else {
          console.warn("Mark read failed:", await res.text());
        }
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
    };

    readNotifications();
  }, [API_URL, fieldId]);

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

  const getGoogleMapsLink = (gpsLocation) => {
    if (!gpsLocation) return "#";

    const cleaned = gpsLocation.replace(/\s+/g, "");

    if (cleaned.startsWith("http")) return cleaned;

    if (/^-?[0-9.]+,-?[0-9.]+$/.test(cleaned)) {
      return `https://www.google.com/maps/search/?api=1&query=${cleaned}`;
    }
    return "#";
  };

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
        <h1>รายละเอียดสนามกีฬา</h1>
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
          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>สถานะ:</strong>
              <div className="field-value-checkfield">
                <span
                  className={
                    fieldData?.status === "ผ่านการอนุมัติ"
                      ? "status-text-approved"
                      : fieldData?.status === "ไม่ผ่านการอนุมัติ"
                      ? "status-text-rejected"
                      : fieldData?.status === "รอตรวจสอบ"
                      ? "status-text-pending"
                      : ""
                  }
                >
                  {fieldData?.status || "ไม่มีข้อมูล"}
                </span>
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>ชื่อสนาม:</strong>
              <div className="field-value-checkfield">
                {fieldData?.field_name || "ไม่มีข้อมูล"}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>ที่อยู่:</strong>
              <div className="field-value-checkfield">
                {fieldData?.address || "ไม่มีข้อมูล"}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>พิกัด GPS:</strong>
              <div className="field-value-checkfield">
                {fieldData?.gps_location ? (
                  <a
                    href={getGoogleMapsLink(fieldData.gps_location)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {fieldData.gps_location}
                  </a>
                ) : (
                  "ไม่มีข้อมูล"
                )}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>วันที่เปิดทำการ:</strong>
              <div className="field-value-checkfield">
                {dataLoading ? (
                  <div className="loading-data">
                    <div className="loading-data-spinner"></div>
                  </div>
                ) : (
                  fieldData?.open_days
                    ?.map((day) => daysInThai[day])
                    ?.join(", ") || "ไม่มีข้อมูล"
                )}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>เวลาทำการ:</strong>
              <div className="field-value-checkfield">
                {fieldData?.open_hours && fieldData?.close_hours
                  ? `${fieldData.open_hours} - ${fieldData.close_hours}`
                  : "ไม่มีข้อมูล"}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>
                แบ่งช่วงเวลาในการจอง ช่วงละ " 30 นาที " หรือ "ช่วงละ 1 ชั่วโมง :
              </strong>
              <div className="field-value-checkfield">
                {fieldData?.slot_duration
                  ? Number(fieldData.slot_duration) === 30
                    ? "30 นาที"
                    : Number(fieldData.slot_duration) === 60
                    ? "1 ชั่วโมง"
                    : `${Number(fieldData.slot_duration)} นาที`
                  : "ไม่มีข้อมูล"}
              </div>
            </div>
          </div>
          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>เจ้าของ:</strong>
              <div className="field-value-checkfield">
                {fieldData?.first_name && fieldData?.last_name
                  ? `${fieldData.first_name} ${fieldData.last_name}`
                  : "ไม่มีข้อมูล"}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>ค่ามัดจำ:</strong>
              <div className="field-value-checkfield">
                {fieldData?.price_deposit
                  ? `${formatPrice(fieldData.price_deposit)} บาท`
                  : "ไม่มีข้อมูล"}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>ธนาคาร:</strong>
              <div className="field-value-checkfield">
                {fieldData?.name_bank || "ไม่มีข้อมูล"}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>ชื่อเจ้าของบัญชี:</strong>
              <div className="field-value-checkfield">
                {fieldData?.account_holder || "ไม่มีข้อมูล"}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>เลขบัญชีธนาคาร:</strong>
              <div className="field-value-checkfield">
                {fieldData?.number_bank || "ไม่มีข้อมูล"}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>รายละเอียดสนาม:</strong>
              <div
                className="field-value-checkfield"
                dangerouslySetInnerHTML={{
                  __html: fieldData?.field_description || "ไม่มีข้อมูล",
                }}
              />
            </div>
          </div>
        </div>

        {/* เอกสารแยกออกมาแสดงเต็มความกว้าง */}
        <div className="documents-section-full">
          <h2>เอกสารประกอบการสมัคร</h2>
          {fieldData?.documents ? (
            <div className="documents-grid">
              {(Array.isArray(fieldData.documents)
                ? fieldData.documents
                : fieldData.documents.split(",")
              ).map((doc, i) => {
                const docUrl = doc.trim();
                const fileName = docUrl.split("/").pop() || `เอกสาร ${i + 1}`;
                const fileExt = fileName.split(".").pop()?.toLowerCase();

                return (
                  <div className="document-card" key={i}>
                    <div className="document-icon">
                      {fileExt === "pdf" ? (
                        <div className="pdf-icon-display">
                          <div className="pdf-icon-large">📄</div>
                          <div className="pdf-text">PDF</div>
                        </div>
                      ) : fileExt === "jpg" ||
                        fileExt === "jpeg" ||
                        fileExt === "png" ||
                        fileExt === "gif" ? (
                        <div className="image-preview">
                          <img
                            src={docUrl}
                            alt={`เอกสาร ${i + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "4px",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                          <div
                            className="file-fallback"
                            style={{ display: "none" }}
                          >
                            IMG
                          </div>
                        </div>
                      ) : (
                        <span
                          className={`file-icon ${
                            fileExt === "doc" || fileExt === "docx"
                              ? "doc-icon"
                              : "file-icon"
                          }`}
                        >
                          {(fileExt === "doc" || fileExt === "docx") && "DOC"}
                          {![
                            "pdf",
                            "jpg",
                            "jpeg",
                            "png",
                            "gif",
                            "doc",
                            "docx",
                          ].includes(fileExt) && "FILE"}
                        </span>
                      )}
                    </div>
                    <div className="document-info">
                      <h4 className="document-name">
                        เอกสาร {i + 1}
                        <span
                          className={`file-type-inline ${
                            fileExt === "pdf"
                              ? "pdf-type"
                              : fileExt === "jpg" ||
                                fileExt === "jpeg" ||
                                fileExt === "png" ||
                                fileExt === "gif"
                              ? "image-type"
                              : fileExt === "doc" || fileExt === "docx"
                              ? "doc-type"
                              : "file-type"
                          }`}
                        >
                          {fileExt === "pdf" && "PDF"}
                          {(fileExt === "jpg" ||
                            fileExt === "jpeg" ||
                            fileExt === "png" ||
                            fileExt === "gif") &&
                            "รูป"}
                          {(fileExt === "doc" || fileExt === "docx") && "DOC"}
                          {![
                            "pdf",
                            "jpg",
                            "jpeg",
                            "png",
                            "gif",
                            "doc",
                            "docx",
                          ].includes(fileExt) && "FILE"}
                        </span>
                      </h4>
                      <p className="document-filename">{fileName}</p>
                      <div className="document-actions">
                        <button
                          className="btn-preview"
                          onClick={() => window.open(docUrl, "_blank")}
                        >
                          เปิด
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-documents">
              <div className="no-documents-icon">ไม่มีเอกสาร</div>
              <p>ไม่มีเอกสารแนบ</p>
            </div>
          )}
        </div>

        <div className="field-facilities-check-field">
          <h1>สิ่งอำนวยความสะดวกในสนาม: </h1>
          {facilities.length === 0 ? (
            <p>ยังไม่มีสิ่งอำนวยความสะดวกสำหรับสนามนี้</p>
          ) : (
            <div className="facilities-grid-simple-checkfield">
              {facilities.map((facility) => (
                <div
                  className="facility-card-simple-checkfield"
                  key={facility.field_fac_id}
                >
                  <div className="facility-image-simple-checkfield">
                    {facility.image_path ? (
                      <img
                        src={facility.image_path}
                        alt={facility.fac_name}
                        onError={(e) => {
                          e.target.src = "/images/placeholder-image.png";
                        }}
                      />
                    ) : (
                      <div className="facility-no-image-checkfield">
                        ยังไม่มีรูป
                      </div>
                    )}
                  </div>
                  <div className="facility-info-simple-checkfield">
                    <h4 className="facility-name-simple-checkfield">
                      {facility.fac_name}
                    </h4>

                    <div className="facility-details-simple-checkfield">
                      <div className="detail-row">
                        <span>ราคา: </span>
                        <span>{formatPrice(facility.fac_price)} บาท</span>
                      </div>
                      <div className="detail-row">
                        <span>จำนวน: </span>
                        <span>{facility.quantity_total} ชิ้น</span>
                      </div>
                      {facility.description && (
                        <div className="detail-row">
                          <span>รายละเอียด: </span>
                          <span>{facility.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="sub-fields-container-editfield">
          {fieldData?.sub_fields && fieldData.sub_fields.length > 0 ? (
            fieldData.sub_fields.map((sub) => (
              <div key={sub.sub_field_id} className="sub-field-card-editfield">
                <div className="sub-field-header">
                  <h3>สนามย่อย {sub?.sub_field_name}</h3>
                  <span className="sub-field-sport">{sub?.sport_name}</span>
                </div>

                <div className="sub-field-display">
                  <div className="field-info-grid">
                    <div className="info-item">
                      <span className="info-label">ราคา:</span>
                      <span className="info-value">
                        {sub?.price
                          ? `${formatPrice(sub.price)} บาท`
                          : "ไม่มีข้อมูล"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">ผู้เล่นต่อทีม:</span>
                      <span className="info-value">
                        {sub?.players_per_team
                          ? `${sub.players_per_team} คน`
                          : "ไม่มีข้อมูล"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">ขนาดสนาม:</span>
                      <span className="info-value">
                        {sub?.wid_field && sub?.length_field
                          ? `${formatPrice(sub.wid_field)} × ${formatPrice(
                              sub.length_field
                            )} เมตร`
                          : "ไม่มีข้อมูล"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">ประเภทพื้น:</span>
                      <span className="info-value">
                        {sub?.field_surface || "ไม่มีข้อมูล"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="addons-section">
                  <div className="addons-header">
                    <h4>กิจกรรมพิเศษ</h4>
                  </div>

                  {sub.add_ons && sub.add_ons.length > 0 ? (
                    <div className="addons-list">
                      {sub.add_ons.map((addon) => (
                        <div key={addon.add_on_id} className="addon-item">
                          <div className="addon-display">
                            <div className="addon-info">
                              <span className="addon-name">
                                {addon.content}
                              </span>
                              <span className="addon-price">
                                {formatPrice(addon.price)} บาท
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-addons">
                      <span>ไม่มีกิจกรรมพิเศษ</span>
                    </div>
                  )}
                </div>
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
