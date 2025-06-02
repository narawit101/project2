"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { split } from "postcss/lib/list";
import "@/app/css/orderDetail.css"

export default function BookingDetail() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { user, isLoading } = useAuth();
  const [booking, setMybooking] = useState([]);
  const router = useRouter();
  const { booking_id } = useParams();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [message, setMessage] = useState(""); //
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!booking_id) return;

        const res = await fetch(
          `${API_URL}/booking/bookings-detail/${booking_id}`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();

        if (data.success) {
          setMybooking(data.data);
          console.log(" Booking Data:", data.data);
        } else {
          console.log(" Booking fetch error:", data.error);
        }
      } catch (error) {
        console.error(" Fetch error:", error);
      }
    };

    fetchData();
  }, [booking_id, API_URL]);

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

  const calTotalHours = (total_hours) => {
    const hour = Math.floor(total_hours);
    const minutes = (total_hours % 1) * 100;

    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${hour}:${formattedMinutes}`;
  };
  const openConfirmModal = (status) => {
    setNewStatus(status); // ตั้งค่าสถานะใหม่ที่ต้องการเปลี่ยน
    setShowConfirmModal(true); // เปิดโมดอล
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false); // ปิดโมดอล
  };

  const updateStatus = async (status, booking_id) => {
    try {
      const res = await fetch(
        `${API_URL}/booking/booking-status/${booking_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking_status: status }),
          credentials: "include",
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessage(`อัพเดทสถานะเป็น: ${status}`);
        setMessageType("success");

        const updatedRes = await fetch(
          `${API_URL}/booking/bookings-detail/${booking_id}`,
          {
            credentials: "include",
          }
        );
        const updatedData = await updatedRes.json();
        if (updatedData.success) {
          setMybooking(updatedData.data);
        }
      } else {
        setMessage(`เกิดข้อผิดพลาด: ${data.error}`);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setMessage("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
      setMessageType("error");
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

  const cancelBooking = async (booking_id) => {
    const confirmCancel = window.confirm(
      "คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?"
    );
    if (!confirmCancel) return;

    try {
      const res = await fetch(
        `${API_URL}/booking/cancel-bookings/${booking_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cancel_time: new Date().toISOString(),
          }),
          credentials: "include",
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        router.back();
      } else {
        alert(data.message || "ยกเลิกไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Cancel Booking Error:", error);
      alert("เกิดข้อผิดพลาดในการยกเลิกการจอง");
    }
  };

  return (
    <div className="order-detail">
      <h1 className="order-detail-title">รายละเอียดการจอง</h1>

      {!booking || Object.keys(booking).length === 0 ? (
        <p className="order-detail-empty">ไม่พบคำสั่งจอง</p>
      ) : (
        <li className="booking-card-order-detail">
          <p>
            <strong>ชื่อผู้จอง:</strong> {booking.first_name}{" "}
            {booking.last_name}
          </p>
          <p>
            <strong>วันที่:</strong> {formatDate(booking.start_date)}
          </p>
          <p>
            <strong>เวลา:</strong> {booking.start_time} - {booking.end_time}
          </p>
          <p>
            <strong>ชั่วโมงรวม:</strong> {calTotalHours(booking.total_hours)} น.
          </p>
          <p>
            <strong>ยกเลิกได้ถึงเวลา:</strong>{" "}
            {getCancelDeadlineTime(
              booking.start_date,
              booking.start_time,
              booking.cancel_hours
            )}{" "}
            น.
          </p>
          <p>
            <strong>สนาม:</strong> {booking.field_name}
          </p>
          <p>
            <strong>สนามย่อย:</strong> {booking.sub_field_name}
          </p>
          <p>
            <strong>กิจกรรม:</strong> {booking.activity}
          </p>
          <p>
            <strong>มัดจำ:</strong> {booking.price_deposit}
          </p>
          <div>
            <img src={`${API_URL}/${booking.deposit_slip}`} alt="สลิป" />
          </div>
          <p>
            <strong>ยอดค้างชำระ:</strong> {booking.total_remaining}
          </p>

          {(user?.user_id === booking.field_user_id ||
            user?.role === "admin") && (
            <div className="status-buttons-order-detail">
              <button
                className="approve-btn-order-detail"
                onClick={() => openConfirmModal("approved")}
              >
                อนุมัติ
              </button>
              <button
                className="reject-btn-order-detail"
                onClick={() => openConfirmModal("rejected")}
              >
                ไม่อนุมัติ
              </button>
            </div>
          )}

          <button
            className="cancel-booking-btn-order-detail"
            onClick={() => cancelBooking(booking.booking_id)}
          >
            ยกเลิกการจอง
          </button>
        </li>
      )}
      {showConfirmModal && (
        <StatusChangeModal
          newStatus={newStatus}
          onConfirm={() => {
            updateStatus(newStatus, booking.booking_id);
            closeConfirmModal();
          }}
          onClose={closeConfirmModal}
        />
      )}
    </div>
  );
}
