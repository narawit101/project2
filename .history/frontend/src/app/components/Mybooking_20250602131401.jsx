"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Mybooking() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { user, isLoading } = useAuth();
  const [booking, setMybooking] = useState([]);
  const router = useRouter();

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
        if (!user?.user_id) return;

        const res = await fetch(
          `${API_URL}/booking/my-bookings/${user.user_id}`,
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
  }, [user?.user_id, API_URL]);

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
  <h1>📋 รายการจองของคุณ</h1>

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
          <p><strong>ชื่อผู้จอง:</strong> {item.first_name} {item.last_name}</p>
          <p><strong>วันที่:</strong> {formatDate(item.start_date)}</p>
          <p><strong>เวลา:</strong> {item.start_time} - {item.end_time}</p>
          <p><strong>ยกเลิกได้ภายใน:</strong> {item.cancel_hours} น.</p>
          <p><strong>ยกเลิกได้ถึงเวลา:</strong> {getCancelDeadlineTime(item.start_date, item.start_time, item.cancel_hours)} น.</p>
          <p><strong>สนาม:</strong> {item.field_name}</p>
          <p><strong>สนามย่อย:</strong> {item.sub_field_name}</p>
          <p><strong>กิจกรรม:</strong> {item.activity}</p>
          <p><strong>มัดจำ:</strong> {item.price_deposit} บาท</p>
          <p><strong>ยอดค้างชำระ:</strong> {item.total_remaining} บาท</p>
        </li>
      ))}
    </ul>
  )}
</div>

  );
}
