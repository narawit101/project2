"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import "@/app/css/myorder.css"

export default function Myorder() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { user, isLoading } = useAuth();
  const [booking, setMybooking] = useState([]);
  const [filters, setFilters] = useState({ date: "", status: "" });

  const router = useRouter();
  const { fieldId } = useParams();

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
      if (!fieldId) return;
      try {
        const query = new URLSearchParams(filters).toString();
        const res = await fetch(`${API_URL}/booking/my-orders/${fieldId}?${query}`, {
          credentials: "include",
        });
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
  }, [fieldId, API_URL, filters]);

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

    const cleanDate = start_date.includes("T") ? start_date.split("T")[0] : start_date;
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
  <h1>📋 รายการจองของคุณ</h1>

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
      </select>
    </label>
  </div>

  {booking.length === 0 ? (
    <p>ไม่พบคำสั่งจอง</p>
  ) : (
    <ul className="booking-list">
      {booking.map((item, index) => (
        <li
          key={index}
          className="booking-card"
          onClick={() => router.push(`/bookingDetail/${item.booking_id}`)}
        >
          <div className="booking-detail">
            <p><strong>👤 ชื่อผู้จอง:</strong><br />{item.first_name} {item.last_name}</p>
            <p><strong>📅 วันที่:</strong><br />{formatDate(item.start_date)}</p>
            <p><strong>⏰ เวลา:</strong><br />{item.start_time} - {item.end_time}</p>
            <p><strong>❌ ยกเลิกได้ภายใน:</strong><br />{item.cancel_hours} น.</p>
            <p><strong>🕓 ยกเลิกได้ถึงเวลา:</strong><br />{getCancelDeadlineTime(item.start_date, item.start_time, item.cancel_hours)} น.</p>
            <p><strong>🏟️ สนาม:</strong><br />{item.field_name}</p>
            <p><strong>🎯 สนามย่อย:</strong><br />{item.sub_field_name}</p>
            <p><strong>🎭 กิจกรรม:</strong><br />{item.activity}</p>
            <p><strong>💰 มัดจำ:</strong><br />{item.price_deposit} บาท</p>
            <p><strong>💳 ยอดค้างชำระ:</strong><br />{item.total_remaining} บาท</p>
          </div>
        </li>
      ))}
    </ul>
  )}
</div>

  );
}
