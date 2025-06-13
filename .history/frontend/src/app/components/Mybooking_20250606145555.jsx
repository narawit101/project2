"use client";
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import "@/app/css/myOrder.css";
import { io } from "socket.io-client";
export default function Mybooking() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { user, isLoading } = useAuth();
  const [booking, setMybooking] = useState([]);
  const [filters, setFilters] = useState({ date: "", status: "" });
  const router = useRouter();
  const socketRef = useRef(null);
  const [bookingId, setBookingId] = useState("");

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
    console.log("API_URL:", API_URL);
    console.log(" connecting socket...");

    socketRef.current = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log(" Socket connected:", socket.id);
    });

    socket.on("slot_booked", (data) => {
      console.log("booking_id:", data.bookingId);
      setBookingId(data.bookingId);
    });

    socket.on("connect_error", (err) => {
      console.error(" Socket connect_error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.user_id) return;

        const queryParams = new URLSearchParams();
        if (filters.date) queryParams.append("date", filters.date);
        if (filters.status) queryParams.append("status", filters.status);

        const res = await fetch(
          `${API_URL}/booking/my-bookings/${
            user.user_id
          }?${queryParams.toString()}`,
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
  }, [user?.user_id, filters, API_URL, bookingId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

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

  return (
    <div className="myorder-container">
      <h1>รายการจองสนามของคุณ {booking[0]?.user_name || " - "}</h1>
      <div className="filters">
        <label>
          วันที่:
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
          />
        </label>

        <label>
          สถานะ:
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">ทั้งหมด</option>
            <option value="pending">รอตรวจสอบ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ไม่อนุมัติ</option>
          </select>
        </label>
      </div>
      {booking.length === 0 ? (
        <h1 className="booking-list">ไม่พบคำสั่งจอง</h1>
      ) : (
        <ul className="booking-list">
          {booking.map((item, index) => (
            <li key={index} className="booking-card">
              <div className="booking-detail">
                <p>
                  <strong>ชื่อผู้จอง: </strong>
                  {item.first_name} {item.last_name}
                </p>
                <p>
                  <strong>วันที่จอง: </strong>
                  {formatDate(item.start_date)}
                </p>
                <p>
                  <strong>สนาม: </strong>
                  {item.field_name}
                </p>
                <p>
                  <strong>สนามย่อย: </strong>
                  {item.sub_field_name}
                </p>
                <div className="hours-container-my-order">
                  <div className="total-hours-order">
                    <p>
                      <strong> เวลา: </strong>
                      {item.start_time} - {item.end_time}
                    </p>
                    <p>
                      <strong> สามารถยกเลิกก่อนเวลาเริ่ม: </strong>
                      {item.cancel_hours} ชม.
                    </p>
                  </div>
                  <div className="total-date-order">
                    <p>
                      ยกเลิกได้ถึง <strong>วันที่:</strong>{" "}
                      {formatDate(item.start_date)} <br />
                      <strong> ** เวลา:</strong>{" "}
                      {getCancelDeadlineTime(
                        item.start_date,
                        item.start_time,
                        item.cancel_hours
                      )}{" "}
                      น. **
                    </p>
                  </div>
                </div>

                <div className="price-container-my-order">
                  <strong>{item.activity}</strong>
                  <div className="price-deposit-order">
                    <p>
                      <strong>มัดจำ: </strong>
                      {item.price_deposit} บาท
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>ราคาหลังหักค่ามัดจำ: </strong>
                      {item.total_remaining} บาท
                    </p>
                  </div>
                  <div className="total-remaining-order">
                    <p>
                      <strong>ราคารวมสุทธิ: </strong>
                      {item.total_price} บาท
                    </p>
                  </div>
                </div>
                <p>
                  <strong>สถานะ:</strong>{" "}
                  <span className={`status-text-detail ${item.status}`}>
                    {item.status === "pending"
                      ? "รอตรวจสอบ"
                      : item.status === "approved"
                      ? "อนุมัติแล้ว"
                      : item.status === "rejected"
                      ? "ไม่อนุมัติ"
                      : "ไม่ทราบสถานะ"}
                  </span>
                </p>
              </div>

              <button
                className="detail-button"
                onClick={() => router.push(`/bookingDetail/${item.booking_id}`)}
              >
                ดูรายละเอียด
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
