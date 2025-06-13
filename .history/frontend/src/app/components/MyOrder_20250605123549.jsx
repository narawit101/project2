"use client";
import React, { useEffect, useState,useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { io } from "socket.io-client";
import "@/app/css/myOrder.css";

export default function Myorder() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { user, isLoading } = useAuth();
  const [booking, setMybooking] = useState([]);
  const [filters, setFilters] = useState({ date: "", status: "" });
  const socketRef = useRef(null);
  const [bookingId, setBookingId] = useState("");
  const router = useRouter();
  const { fieldId } = useParams();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user?.role === "customer") router.replace("/");
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
      if (!fieldId) return;
      try {
        const query = new URLSearchParams(filters).toString();
        const res = await fetch(
          `${API_URL}/booking/my-orders/${fieldId}?${query}`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();
        if (data.success) {
          setMybooking(data.data);
        } else {
          console.log("Booking fetch error:", data.error);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchData();
  }, [fieldId, API_URL, filters,bookingId]);

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
    if (!start_date || !start_time || cancel_hours == null) return "-";

    const cleanDate = start_date.includes("T")
      ? start_date.split("T")[0]
      : start_date;
    const bookingDateTime = new Date(`${cleanDate}T${start_time}+07:00`);
    if (isNaN(bookingDateTime.getTime())) return "-";

    bookingDateTime.setHours(bookingDateTime.getHours() - cancel_hours);

    return bookingDateTime.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="myorder-container">
      <h1>รายการจองสนามของคุณ</h1>

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
            <option value="approved">ตรวจสอบแล้ว</option>
            <option value="rejected">ปฏิเสธแล้ว</option>
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
                  <strong>วันที่: </strong>
                  {formatDate(item.start_date)}
                </p>
                <p>
                  <strong>เวลา: </strong>
                  {item.start_time} - {item.end_time}
                </p>
                <p>
                  <strong>สามารถยกเลิกก่อนเวลาเริ่ม: </strong>
                  {item.cancel_hours} ชม.
                </p>
                <p>
                  <strong>ยกเลิกได้ถึงเวลา: </strong>
                  {getCancelDeadlineTime(
                    item.start_date,
                    item.start_time,
                    item.cancel_hours
                  )}{" "}
                  น.
                </p>
                <p>
                  <strong>สนาม: </strong>
                  {item.field_name}
                </p>
                <p>
                  <strong>สนามย่อย: </strong>
                  {item.sub_field_name}
                </p>
                <p>
                  <strong>กิจกรรม: </strong>
                  {item.activity}
                </p>
                <p>
                  <strong>มัดจำ: </strong>
                  {item.price_deposit} บาท
                </p>
                <p>
                  <strong>ราคาหลังหักค่ามัดจำ: </strong>
                  {item.total_remaining} บาท
                </p>
                <p>
                  <strong>ราคารวมสุทธิ: </strong>
                  {item.total_price} บาท
                </p>
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