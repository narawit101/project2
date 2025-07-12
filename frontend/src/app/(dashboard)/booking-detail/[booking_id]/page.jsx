"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

import "@/app/css/order-detail.css";
import { io } from "socket.io-client";

const getStatusLabel = (status) => {
  switch (status) {
    case "approved":
      return { text: "อนุมัติ", className: "status-approved" };
    case "rejected":
      return { text: "ไม่อนุมัติ", className: "status-rejected" };
    case "pending":
      return { text: "รอตรวจสอบ", className: "status-pending" };
    case "complete":
      return { text: "การจองสำเร็จ", className: "status-complete" };
    default:
      return { text: "ไม่ทราบสถานะ", className: "status-unknown" };
  }
};

const StatusChangeModal = ({
  newStatus,
  onConfirm,
  onClose,
  reasoning,
  setReasoning,
}) => {
  const { text, className } = getStatusLabel(newStatus);

  return (
    <div className="modal-overlay-order-detail">
      <div className="modal-content-order-detail">
        <div className="modal-header-order-detail">
          <h2>เปลี่ยนสถานะการจอง</h2>
          <div className={`status-label-order-detail ${className}`}>
            <strong>{text}</strong>
          </div>
          {newStatus === "rejected" && (
            <div className="resoning-booking-detail">
              <textarea
                placeholder="กรุณาใส่เหตุผลที่ไม่ผ่านการอนุมัติ"
                required
                maxLength={300}
                value={reasoning}
                onChange={(e) => {
                  setReasoning(e.target.value);
                }}
              />
            </div>
          )}
        </div>
        <div className="modal-actions-order-detail">
          <button
            style={
              reasoning.length === 0 && newStatus === "rejected"
                ? { cursor: "not-allowed" }
                : { cursor: "pointer" }
            }
            disabled={reasoning.length === 0 && newStatus === "rejected"}
            className="modal-confirm-btn-order-detail"
            onClick={onConfirm}
          >
            ยืนยัน
          </button>
          <button className="modal-cancel-btn-order-detail" onClick={onClose}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};

export default function BookingDetail() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { user, isLoading } = useAuth();
  const [booking, setMybooking] = useState([]);
  const router = useRouter();
  const { booking_id } = useParams();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [message, setMessage] = useState(""); //
  const [messageType, setMessageType] = useState("");
  const socketRef = useRef(null);
  const [bookingId, setBookingId] = useState("");
  const [depositSlip, setDepositSlip] = useState(null);
  const [totalSlip, setTotalSlip] = useState(null);
  const [imgPreviewTotal, setImgPreviewTotal] = useState("");
  const [imgPreviewDeposit, setImgPreviewDeposit] = useState("");
  const [disabledButtons, setDisabledButtons] = useState({
    approved: false,
    rejected: false,
  });
  const [dataLoading, setDataLoading] = useState(true);

  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [canUploadslip, setCanUploadslip] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const handleOpenReviewModal = () => setShowReviewModal(true);
  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setRating(0);
    setComment("");
  };
  const [reviewData, setReviewData] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [reasoning, setReasoning] = useState("");

  usePreventLeave(startProcessLoad);

  const [fieldId, setFieldId] = useState("");
  useEffect(() => {
    if (isLoading || !booking_id) return;

    console.log("BookingDetail Debug → booking_id:", booking_id);
    console.log("BookingDetail Debug → user:", user);
    console.log("BookingDetail Debug → isLoading:", isLoading);

    if (!user) {
      const encoded = encodeURIComponent(`/bookingDetail/${booking_id}`);
      router.push(`/login?redirectTo=${encoded}`);
    } else if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }
  }, [user, isLoading, booking_id]);

  //  1. fetchData แยกไว้เพื่อใช้ซ้ำได้
  const fetchData = useCallback(async () => {
    try {
      if (!booking_id) return;
      const token = localStorage.getItem("auth_mobile_token");

      const res = await fetch(
        `${API_URL}/booking/bookings-detail/${booking_id}`,
        {
          credentials: "include",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setMybooking(data.data);
        setFieldId(data.data.field_id);
        console.log(" Booking Data:", data.data);
      } else {
        console.log("Booking fetch error:", data.error);
        // setMessage(data.error);
        // setMessageType("error");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setMessageType("error");
    } finally {
      setDataLoading(false);
    }
  }, [booking_id, API_URL]);

  // 2. โหลดข้อมูลรอบแรก
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 3. เชื่อม socket แล้วฟัง slot_booked เฉพาะ booking นี้
  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
    });

    socket.on("slot_booked", (data) => {
      if (data.bookingId === booking_id) {
        console.log("ได้ slot ของตัวเอง → รีโหลดข้อมูล");
        fetchData();
      }
    });

    socket.on("review_posted", (data) => {
      if (String(data.bookingId) === String(booking_id)) {
        console.log("ได้รีวิวใหม่ → โหลดรีวิวใหม่");
        fetchReview(); // โหลดรีวิวใหม่
      }
    });

    socket.on("connect_error", (err) => {
      console.error(" Socket connect_error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [API_URL, booking_id, fetchData]);

  useEffect(() => {
    console.log("BookingDetail Debug - user:", user);
    console.log("BookingDetail Debug - isLoading:", isLoading);
  }, [user, isLoading]);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCancelDeadlineTime = (start_date, start_time, cancel_hours) => {
    if (
      !start_date ||
      !start_time ||
      cancel_hours === undefined ||
      cancel_hours === null
    ) {
      return "-";
    }

    const cleanDate = start_date.includes("T")
      ? start_date.split("T")[0]
      : start_date;

    const bookingDateTime = new Date(`${cleanDate}T${start_time}+07:00`);

    if (isNaN(bookingDateTime.getTime())) {
      console.log(" Invalid Date from:", cleanDate, start_time);
      return "-";
    }

    bookingDateTime.setHours(bookingDateTime.getHours() - cancel_hours);

    return bookingDateTime.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const calTotalHours = (totalHours) => {
    if (totalHours === 0.5) {
      return "30 นาที";
    } else if (totalHours % 1 === 0.5) {
      return `${Math.floor(totalHours)} ชั่วโมง 30 นาที`;
    } else {
      return `${totalHours} ชั่วโมง`;
    }
  };

  const openConfirmModal = (status) => {
    setNewStatus(status); // ตั้งค่าสถานะใหม่ที่ต้องการเปลี่ยน
    setShowConfirmModal(true); // เปิดโมดอล
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false); // ปิดโมดอล
    setReasoning("");
  };

  const updateStatus = async (status, booking_id, reasoning) => {
    console.log("Booking:", booking);

    if (!booking_id || isNaN(Number(booking_id))) {
      setMessage("booking_id ไม่ถูกต้อง");
      setMessageType("error");
      return;
    }
    if (status === "rejected" && reasoning.length === 0) {
      setMessage("กรุณาใส่เหตุผลที่ไม่อนุมัติ");
      setMessageType("error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      const token = localStorage.getItem("auth_mobile_token");

      const res = await fetch(
        `${API_URL}/booking/booking-status/${booking_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            booking_status: status,
            reasoning: reasoning,
          }),
          credentials: "include",
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(
          `อัปเดตสถานะเป็น ${
            status === "approved"
              ? "อนุมัติแล้ว"
              : status === "rejected"
              ? "ไม่อนุมัติ"
              : status === "complete"
              ? "การจองสำเร็จ"
              : status
          }`
        );
        setMessageType(status === "approved" ? "success" : "error");

        const updatedRes = await fetch(
          `${API_URL}/booking/bookings-detail/${booking_id}`,
          {
            credentials: "include",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        const updatedData = await updatedRes.json();
        if (updatedData.success) {
          setMybooking(updatedData.data);
        }
      } else {
        setMessage(`เกิดข้อผิดพลาด: ${data.error || "ไม่สามารถอัปเดตได้"}`);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setMessage("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
      setReasoning("");
    }
  };

  const CancelBookingModal = ({ onConfirm, onClose }) => (
    <div className="modal-overlay-order-detail">
      <div className="modal-content-order-detail">
        <div className="modal-header-order-detail">
          <h2>ยกเลิกการจอง</h2>
        </div>
        <div className="modal-actions-order-detail">
          <button
            className="modal-confirm-btn-order-detail"
            style={{
              cursor: startProcessLoad ? "not-allowed" : "pointer",
            }}
            disabled={startProcessLoad}
            onClick={onConfirm}
          >
            ยืนยัน
          </button>
          <button
            className="modal-cancel-btn-order-detail"
            style={{
              cursor: startProcessLoad ? "not-allowed" : "pointer",
            }}
            disabled={startProcessLoad}
            onClick={onClose}
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );

  const confirmCancelBooking = async () => {
    SetstartProcessLoad(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const token = localStorage.getItem("auth_mobile_token");

      const res = await fetch(
        `${API_URL}/booking/cancel-bookings/${booking.booking_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            cancel_time: new Date().toISOString(),
          }),
          credentials: "include",
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setMessageType("success");
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setMessage(data.message || "ยกเลิกไม่สำเร็จ");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Cancel Booking Error:", error);
      setMessage("เกิดข้อผิดพลาดในการยกเลิกการจอง");
      setMessageType("error");
    } finally {
      setShowCancelModal(false);
      SetstartProcessLoad(false);
    }
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const handleDepositSlip = (e) => {
    const file = e.target.files[0];
    if (file.size > MAX_FILE_SIZE) {
      setMessage("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)");
      setMessageType("error");
      e.target.value = null;
      return;
    }

    if (file) {
      if (file.type.startsWith("image/")) {
        setDepositSlip(file);
        setCanUploadslip(true);
        setImgPreviewDeposit(URL.createObjectURL(file));
      } else {
        e.target.value = null;
        setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพเท่านั้น");
        setMessageType("error");
      }
    }
  };

  const handleTotalSlip = (e) => {
    const file = e.target.files[0];
    if (file.size > MAX_FILE_SIZE) {
      setMessage("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)");
      setMessageType("error");
      e.target.value = null;
      return;
    }

    if (file) {
      if (file.type.startsWith("image/")) {
        setTotalSlip(file);
        setCanUploadslip(true);
        setImgPreviewTotal(URL.createObjectURL(file));
      } else {
        e.target.value = null;
        setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพเท่านั้น");
        setMessageType("error");
      }
    }
  };

  const uploadSlip = async () => {
    if (!depositSlip && !totalSlip) {
      setMessage("กรุณาแนบสลิปอย่างน้อย 1 รายการ");
      setMessageType("error");
      return;
    }

    const formData = new FormData();
    if (depositSlip) formData.append("deposit_slip", depositSlip);
    //if (totalSlip) formData.append("total_slip", totalSlip);
    const token = localStorage.getItem("auth_mobile_token");

    SetstartProcessLoad(true);
    try {
      const res = await fetch(
        `${API_URL}/booking/upload-slip/${booking.booking_id}`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await res.json();
      if (data.success) {
        setMessage("อัปโหลดเรียบร้อยแล้ว");
        setMessageType("success");
        fetchData();
        setDepositSlip(null);
        setImgPreviewDeposit("");
        setTotalSlip(null);
        setImgPreviewTotal("");
        setQrCode(null);
      } else {
        setMessage(data.message || "อัปโหลดไม่สำเร็จ");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("เกิดข้อผิดพลาดในการอัปโหลด");
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const uploadTotalSlip = async () => {
    if (!totalSlip) {
      setMessage("กรุณาแนบสลิปอย่างน้อย 1 รายการ");
      setMessageType("error");
      return;
    }

    const formData = new FormData();

    if (totalSlip) formData.append("total_slip", totalSlip);
    SetstartProcessLoad(true);
    try {
      const token = localStorage.getItem("auth_mobile_token");

      const res = await fetch(
        `${API_URL}/booking/upload-slip/${booking.booking_id}`,
        {
          method: "PUT",
          body: formData,
          credentials: "include",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await res.json();
      if (data.success) {
        setMessage("อัปโหลดเรียบร้อยแล้ว");
        setMessageType("success");
        fetchData();
        setDepositSlip(null);
        setImgPreviewDeposit("");
        setTotalSlip(null);
        setImgPreviewTotal("");
        setQrCode(null);
      } else {
        setMessage(data.message || "อัปโหลดไม่สำเร็จ");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("เกิดข้อผิดพลาดในการอัปโหลด");
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const getFacilityNetPrice = (item) => {
    const totalFac = (item.facilities || []).reduce(
      (sum, fac) => sum + (parseFloat(fac.fac_price) || 0),
      0
    );
    return Math.abs(totalFac - (parseFloat(item.total_remaining) || 0));
  };

  const handleGenQR = async (booking_id, amount) => {
    SetstartProcessLoad(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const res = await fetch(`${API_URL}/booking/gen-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking_id, amount: amount }),
      });
      const data = await res.json();
      if (data.status === true) {
        setQrCode(data.qrCode);
        console.log("QR Code generated:", data.qr);
        // setMessage("สร้าง QR Code สำเร็จ");
        // setMessageType("success");
      } else {
        setMessage("เกิดข้อผิดพลาด: " + data.message);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error generating QR Code:", error);
      setMessage("ไม่สามารถสร้าง QR Code ได้");
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const formatPrice = (value) => new Intl.NumberFormat("th-TH").format(value);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchReview = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_mobile_token");

      const res = await fetch(`${API_URL}/reviews/get/${booking_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        setReviewData(data.data);
      } else {
        setMessage("เกิดข้อผิดพลาด: " + data.message);
        setMessageType("error");
      }
    } catch (error) {
      console.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setMessageType("error");
    } finally {
      setDataLoading(false);
    }
  }, [booking_id, API_URL]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const handleSubmitReview = async () => {
    if (!rating || rating < 1) {
      setMessage("กรุณาให้คะแนนการรีวิว");
      setMessageType("error");
      return;
    }

    if (!comment || comment.trim().length < 5) {
      setMessage("กรุณาเขียนรีวิวอย่างน้อย 5 ตัวอักษร");
      setMessageType("error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const token = localStorage.getItem("auth_mobile_token");

      const res = await fetch(`${API_URL}/reviews/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          booking_id: booking.booking_id,
          field_id: booking.field_id,
          rating,
          comment,
          user_id: user?.user_id,
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        setMessage("เขียนรีวิวสำเร็จ");
        setMessageType("success");
        handleCloseReviewModal();
        fetchData();
      } else {
        setMessage("เกิดข้อผิดพลาด: " + data.message);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("เกิดข้อผิดพลาด: " + error);
      setMessageType("error");
      console.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", error);
    } finally {
      SetstartProcessLoad(false);
    }
  };

  console.log("reviewData", reviewData);

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="order-detail">
        <h1 className="order-detail-title">รายละเอียดการจอง</h1>
        {dataLoading ? (
          <div className="loading-data">
            <div className="loading-data-spinner"></div>
          </div>
        ) : Object.keys(booking).length > 0 ? (
          <li className="booking-card-order-detail">
            <p>
              <strong>ชื่อผู้จอง:</strong> {booking.first_name}{" "}
              {booking.last_name}
            </p>
            <p>
              <strong>วันที่จอง:</strong> {formatDate(booking.start_date)}
            </p>
            <p>
              <strong>สนาม:</strong> {booking.field_name}
            </p>
            <p>
              <strong>สนามย่อย:</strong> {booking.sub_field_name}
            </p>

            <div className="hours-detail-box">
              {/* เวลาที่จอง */}
              <div className="line-item-hours-detail">
                <span>เวลา:</span>
                <span>
                  {booking.start_time} - {booking.end_time} น.
                </span>
              </div>
              <div className="line-item-hours-detail">
                <span>ชั่วโมงรวม:</span>
                <span>{calTotalHours(booking.total_hours)}</span>
              </div>

              <hr className="divider-hours-detail" />

              {/* ยกเลิกได้ถึง */}
              <div className="line-item-hours-detail cancel-info">
                <span>ยกเลิกได้ถึง:</span>
                <span>
                  {formatDate(booking.start_date)} เวลา:{" "}
                  {getCancelDeadlineTime(
                    booking.start_date,
                    booking.start_time,
                    booking.cancel_hours
                  )}{" "}
                  น.
                </span>
              </div>
            </div>

            <div className="booking-detail-box">
              <div className="line-item-detail">
                <span className="all-price-detail">กิจกรรม:</span>
                <span className="all-price-detail">{booking.activity}</span>
              </div>

              {/* สนาม */}
              <div className="line-item-detail">
                <span className="all-price-detail">ราคาสนาม:</span>
                <span className="all-price-detail">
                  {new Intl.NumberFormat("th-TH").format(
                    Number(booking.total_price || 0) -
                      Number(booking.price_deposit || 0) -
                      (booking.facilities?.reduce(
                        (sum, f) => sum + Number(f.fac_price || 0),
                        0
                      ) || 0)
                  )}{" "}
                  บาท
                </span>
              </div>

              {/* สิ่งอำนวยความสะดวก */}
              {Array.isArray(booking.facilities) && (
                <>
                  <div className="line-item-detail">
                    <span className="all-price-detail">
                      สิ่งอำนวยความสะดวก:
                    </span>
                    <span></span>
                  </div>
                  <ul className="facility-list-detail">
                    {booking.facilities.map((fac, index) => (
                      <li key={index}>
                        {fac.fac_name}{" "}
                        <span>{formatPrice(fac.fac_price)} บาท</span>
                      </li>
                    ))}
                  </ul>
                  <div className="line-item-detail">
                    <span className="all-price-detail">
                      รวมราคาสิ่งอำนวยความสะดวก:
                    </span>
                    <span className="all-price-detail">
                      {new Intl.NumberFormat("th-TH").format(
                        booking.facilities.reduce(
                          (sum, f) => sum + Number(f.fac_price || 0),
                          0
                        )
                      )}{" "}
                      บาท
                    </span>
                  </div>
                </>
              )}

              <hr className="divider-detail" />

              <div className="line-item-detail highlight">
                <span className="total-remianing-detail">
                  รวมที่ต้องจ่าย: (ยอดคงเหลือ)
                </span>
                <span>+{booking.total_remaining} บาท</span>
              </div>

              <div className="line-item-detail plus">
                <span className="total-deposit-detail">มัดจำ:</span>
                <span>+{formatPrice(booking.price_deposit)} บาท</span>
              </div>

              <hr className="divider-detail" />

              <div className="line-item-detail total">
                <span>ราคาสุทธิ:</span>
                <span>{formatPrice(booking.total_price)} บาท</span>
              </div>

              <div className="line-item-detail payment-method">
                <span>การชำระเงิน:</span>
                <span>{booking.pay_method}</span>
              </div>
            </div>

            {(() => {
              const today = new Date();
              const startDate = new Date(booking.start_date);

              today.setHours(0, 0, 0, 0);
              startDate.setHours(0, 0, 0, 0);

              if (startDate >= today) {
                if (booking?.status === "approved") {
                  return (
                    <div className="deposit-slip-container-order-detail">
                      {/*กรณีมี deposit_slip */}
                      {booking.deposit_slip || booking.total_slip ? (
                        <div>
                          {booking.deposit_slip ? (
                            <>
                              <strong>สลิปมัดจำ</strong>
                              <img
                                src={`${booking.deposit_slip}`}
                                alt="สลิปมัดจำ"
                                className="deposit-slip-order-detail"
                              />
                            </>
                          ) : (
                            <p>ไม่มีสลิปมัดจำ</p>
                          )}

                          {booking.total_slip ? (
                            <div>
                              <strong>สลิปยอดที่โอนส่วนที่เหลือ</strong>
                              <img
                                src={`${booking.total_slip}`}
                                alt="สลิปยอดคคงเหลือ"
                                className="deposit-slip-order-detail"
                              />
                            </div>
                          ) : (
                            booking?.user_id === user?.user_id &&
                            booking?.pay_method != "เงินสด" && (
                              <div>
                                <div className="create-qr-slip">
                                  {booking?.name_bank === "พร้อมเพย์" && (
                                    <button
                                      style={{
                                        cursor: qrCode
                                          ? "not-allowed"
                                          : "pointer",
                                      }}
                                      disabled={qrCode}
                                      onClick={() =>
                                        handleGenQR(
                                          booking_id,
                                          booking.total_remaining
                                        )
                                      }
                                    >
                                      สร้าง QR Code สำหรัับยอดคงเหลือ
                                    </button>
                                  )}
                                  {qrCode && (
                                    <div className="qr-code-container">
                                      <span>
                                        Qr Code ยอดคงเหลือ จำนวน {""}
                                        {formatPrice(
                                          booking.total_remaining
                                        )}{" "}
                                        บาท
                                      </span>
                                      <img
                                        src={qrCode}
                                        alt="QR Code"
                                        className="qr-code-detail"
                                      />
                                    </div>
                                  )}
                                </div>
                                <label className="file-label-order-detail">
                                  <input
                                    type="file"
                                    onChange={handleTotalSlip}
                                    accept="image/*"
                                    className="file-input-hidden-order-detail"
                                  />
                                  อัปโหลดสลิปยอดคงเหลือ
                                </label>
                                <p>
                                  <strong>ชื่อเจ้าของบัญชี</strong>{" "}
                                  {booking.account_holder}
                                </p>
                                <p>
                                  <strong>ชื่อธนาคาร</strong>{" "}
                                  {booking.name_bank}
                                </p>
                                <p>
                                  <strong>เลขบัญชี</strong>{" "}
                                  {booking.number_bank}
                                </p>
                                {imgPreviewTotal && (
                                  <div className="preview-container-order-detail">
                                    <img
                                      src={imgPreviewTotal}
                                      alt="preview"
                                      className="deposit-slip-order-detail"
                                    />
                                  </div>
                                )}
                                <div className="confirm-upload-slip">
                                  <button
                                    disabled={startProcessLoad}
                                    style={{
                                      cursor: startProcessLoad
                                        ? "not-allowed"
                                        : "pointer",
                                    }}
                                    onClick={uploadTotalSlip}
                                  >
                                    อัพโหลด
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : booking?.price_deposit !== 0 ? (
                        booking?.user_id === user?.user_id ? (
                          <div className="create-qr-slip">
                            {booking?.name_bank === "พร้อมเพย์" && (
                              <button
                                style={{
                                  cursor: qrCode ? "not-allowed" : "pointer",
                                }}
                                disabled={qrCode}
                                onClick={() =>
                                  handleGenQR(booking_id, booking.price_deposit)
                                }
                              >
                                สร้าง QR code สำหรับค่ามัดจำ
                              </button>
                            )}
                            {qrCode && (
                              <div className="qr-code-container">
                                <span>
                                  Qr Code ค่ามัดจำ จำนวน {""}
                                  {formatPrice(booking.price_deposit)} บาท
                                </span>
                                <img
                                  src={qrCode}
                                  alt="QR Code"
                                  className="qr-code-detail"
                                />
                              </div>
                            )}
                            {imgPreviewTotal && (
                              <div className="preview-container-order-detail">
                                <img
                                  src={imgPreviewTotal}
                                  alt="preview"
                                  className="deposit-slip-order-detail"
                                />
                              </div>
                            )}
                            <p className="no-slip-message">
                              ยังไม่ได้อัปโหลดสลิปมัดจำ
                            </p>
                            <label className="file-label-order-detail">
                              <input
                                type="file"
                                onChange={handleDepositSlip}
                                accept="image/*"
                                className="file-input-hidden-order-detail"
                              />
                              อัปโหลดสลิปมัดจำ
                            </label>
                            {imgPreviewDeposit && (
                              <div className="preview-container-order-detail">
                                <img
                                  src={imgPreviewDeposit}
                                  alt="preview"
                                  className="deposit-slip-order-detail"
                                />
                              </div>
                            )}
                            {/* <div className="total-remaining-detail">
                            <p>
                              <strong>ราคาสุทธิ:</strong> {booking.total_price}{" "}
                              บาท
                            </p>
                          </div> */}
                            <p>
                              <strong>ชื่อเจ้าของบัญชี</strong>{" "}
                              {booking.account_holder}
                            </p>
                            <p>
                              <strong>ชื่อธนาคาร</strong> {booking.name_bank}
                            </p>
                            <p>
                              <strong>เลขบัญชี</strong> {booking.number_bank}
                            </p>
                            {canUploadslip && (
                              <div>
                                <button
                                  disabled={startProcessLoad}
                                  style={{
                                    cursor: startProcessLoad
                                      ? "not-allowed"
                                      : "pointer",
                                  }}
                                  onClick={uploadSlip}
                                >
                                  อัพโหลด
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="no-slip-message">
                            ยังไม่ได้อัปโหลดสลิป
                          </p>
                        )
                      ) : booking.pay_method === "โอนจ่าย" &&
                        booking.total_price > 0 &&
                        booking.user_id === user?.user_id ? (
                        <div>
                          <label className="file-label-order-detail">
                            <input
                              type="file"
                              onChange={handleTotalSlip}
                              accept="image/*"
                              className="file-input-hidden-order-detail"
                            />
                            อัปโหลดสลิปยอดคงเหลือ
                          </label>
                          {imgPreviewTotal && (
                            <div className="preview-container-order-detail">
                              <img
                                src={imgPreviewTotal}
                                alt="preview"
                                className="deposit-slip-order-detail"
                              />
                            </div>
                          )}
                          {canUploadslip && (
                            <div className="confirm-upload-slip">
                              <button
                                disabled={startProcessLoad}
                                style={{
                                  cursor: startProcessLoad
                                    ? "not-allowed"
                                    : "pointer",
                                }}
                                onClick={uploadTotalSlip}
                              >
                                อัพโหลด
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="no-slip-message">ไม่ต้องจ่ายค่ามัดจำ</p>
                      )}
                    </div>
                  );
                }
              }

              return null;
            })()}

            <p>
              <strong>สถานะการจอง:</strong>{" "}
              <span className={`status-text-order-detail ${booking.status}`}>
                {booking.status === "pending"
                  ? "รอตรวจสอบ"
                  : booking.status === "approved"
                  ? "อนุมัติแล้ว"
                  : booking.status === "rejected"
                  ? "ไม่อนุมัติ"
                  : booking.status === "complete"
                  ? "การจองสำเร็จ"
                  : "ไม่ทราบสถานะ"}
              </span>
            </p>
            {booking.status === "complete" &&
              booking.user_id === user?.user_id &&
              !reviewData && (
                <button
                  className="btn-review-detail"
                  onClick={handleOpenReviewModal}
                >
                  รีวิวการจองสนาม
                </button>
              )}

            {showReviewModal && (
              <div className="review-inline-wrapper-detail">
                <h3 className="review-title-detail">ให้คะแนนการจองสนาม</h3>

                <div className="stars-detail">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <span
                      key={num}
                      onClick={() => setRating(num)}
                      className={`star-detail ${num <= rating ? "active" : ""}`}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <textarea
                  maxLength={255}
                  rows={4}
                  placeholder="แสดงความคิดเห็น..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="review-textarea-detail"
                />

                <div className="review-buttons-detail">
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    onClick={handleSubmitReview}
                    className="review-submit-btn"
                  >
                    โพสต์รีวิว
                  </button>
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    onClick={handleCloseReviewModal}
                    className="review-cancel-btn"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}

            {reviewData && (
              <div className="review-result-detail">
                <strong className="score-detail">
                  คะแนนการจอง:
                  {[1, 2, 3, 4, 5].map((num) => (
                    <span
                      key={num}
                      className={`star-detail ${
                        num <= reviewData.rating ? "active" : ""
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </strong>
                <strong className="comment-detail">
                  ความคิดเห็น:
                  <p> {reviewData.comment}</p>
                </strong>
              </div>
            )}

            {startProcessLoad && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
              </div>
            )}
            {(() => {
              const today = new Date();
              const startDate = new Date(booking.start_date);

              today.setHours(0, 0, 0, 0);
              startDate.setHours(0, 0, 0, 0);

              if (
                startDate >= today &&
                user?.user_id === booking.field_user_id
              ) {
                return (
                  <div className="status-buttons-order-detail">
                    {booking?.status !== "approved" &&
                      booking?.status !== "complete" && (
                        <button
                          className="approve-btn-order-detail"
                          style={{
                            cursor: startProcessLoad
                              ? "not-allowed"
                              : "pointer",
                          }}
                          disabled={startProcessLoad}
                          onClick={() => openConfirmModal("approved")}
                        >
                          อนุมัติ
                        </button>
                      )}
                    {booking?.status !== "rejected" &&
                      booking?.status !== "complete" && (
                        <button
                          className="reject-btn-order-detail"
                          style={{
                            cursor: startProcessLoad
                              ? "not-allowed"
                              : "pointer",
                          }}
                          disabled={startProcessLoad}
                          onClick={() => openConfirmModal("rejected")}
                        >
                          ไม่อนุมัติ
                        </button>
                      )}
                  </div>
                );
              }

              return null;
            })()}
            {booking?.status === "approved" && (
              <button
                className="complete-btn-order-detail"
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                onClick={() => openConfirmModal("complete")}
              >
                การจองสำเร็จ
              </button>
            )}
            {(() => {
              const today = new Date();
              const startDate = new Date(booking.start_date);

              // ตั้งเวลาให้เท่ากันเพื่อเปรียบเทียบเฉพาะวัน
              today.setHours(0, 0, 0, 0);
              startDate.setHours(0, 0, 0, 0);

              return startDate >= today;
            })() && (
              <button
                className="cancel-booking-btn-order-detail"
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                onClick={() => setShowCancelModal(true)}
              >
                ยกเลิกการจอง
              </button>
            )}

            {showConfirmModal && (
              <StatusChangeModal
                newStatus={newStatus}
                onConfirm={() => {
                  updateStatus(newStatus, booking.booking_id, reasoning);
                  closeConfirmModal();
                }}
                reasoning={reasoning}
                setReasoning={setReasoning}
                onClose={closeConfirmModal}
              />
            )}
            {showCancelModal && (
              <CancelBookingModal
                onConfirm={confirmCancelBooking}
                onClose={() => setShowCancelModal(false)}
              />
            )}
          </li>
        ) : (
          <p className="order-detail-empty">ไม่พบรายละเอียด</p>
        )}
      </div>
    </>
  );
}
