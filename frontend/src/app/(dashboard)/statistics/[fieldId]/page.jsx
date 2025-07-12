"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { io } from "socket.io-client";
import "@/app/css/my-order.css";
import "@/app/css/field-statistics.css";

export default function Statistics() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { user, isLoading } = useAuth();
  const [booking, setMybooking] = useState([]);
  const [filters, setFilters] = useState({
    bookingDate: "",
    startDate: "",
    endDate: "",
    status: "",
  });
  const socketRef = useRef(null);
  const [bookingId, setBookingId] = useState("");
  const router = useRouter();
  const { fieldId } = useParams();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [useDateRange, setUseDateRange] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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

  const fetchData = useCallback(async () => {
    if (!fieldId) return;
    try {
      const token = localStorage.getItem("auth_mobile_token");

      const queryParams = new URLSearchParams();
      if (filters.bookingDate)
        queryParams.append("bookingDate", filters.bookingDate);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      if (filters.status) queryParams.append("status", filters.status);
      const res = await fetch(
        `${API_URL}/statistics/${fieldId}?${queryParams.toString()}`,
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
        setFieldName(data.fieldInfo?.field_name || "");
        console.log("Booking data:", data.data);
        if (data.stats) {
          console.log("Stats:", data.stats);
        }
      } else {
        // ดักกรณีสนามยังไม่ผ่าน
        if (data.fieldInfo) {
          setFieldName(data.fieldInfo.field_name || "");
          setMessage(
            `สนาม ${data.fieldInfo.field_name} ${data.fieldInfo.field_status}`
          );
          setMessageType("error");
          setTimeout(() => {
            router.replace("/my-field");
          }, 2000);
        }
        console.log("Booking fetch error:", data.error);
        setMessage(data.error);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
    } finally {
      setDataLoading(false);
    }
  }, [fieldId, API_URL, filters, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    socketRef.current = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log(" Socket connected:", socket.id);
    });

    socket.on("slot_booked", () => {
      console.log(" slot_booked received");
      fetchData(); // reload เมื่อมีจองใหม่
    });

    socket.on("connect_error", (err) => {
      console.error(" Socket connect_error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [API_URL, fetchData]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // รีเซ็ตหน้าทันทีเมื่อกรอง
  };

  // เพิ่มฟังก์ชันสำหรับ Clear Filters
  const clearFilters = () => {
    setFilters({ startDate: "", endDate: "", status: "", bookingDate: "" });
    setCurrentPage(1); // รีเซ็ตหน้าทันทีเมื่อกรอง
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // คำนวณสถิติจากข้อมูลที่ได้
  const calculateStats = () => {
    const stats = {
      total: booking.length,
      pending: booking.filter((item) => item.status === "pending").length,
      approved: booking.filter((item) => item.status === "approved").length,
      rejected: booking.filter((item) => item.status === "rejected").length,
      complete: booking.filter((item) => item.status === "complete").length,
      totalRevenue: booking

        .filter((item) => item.status === "complete")
        .reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0),
      totalDeposit: booking
        .filter((item) => item.status === "approved")
        .reduce((sum, item) => sum + parseFloat(item.price_deposit || 0), 0),
    };
    return stats;
  };

  const stats = calculateStats();
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const bookingPerPage = 10;

  const filteredBookings = booking.filter((item) => {
    if (!filters.status) return true;
    return item.status === filters.status;
  });

  const indexOfLastBooking = currentPage * bookingPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingPerPage;
  const currentBookings = filteredBookings.slice(
    indexOfFirstBooking,
    indexOfLastBooking
  );

  const getPaginationRange = (current, total) => {
    const delta = 2; // จำนวนหน้าที่แสดงก่อน/หลังหน้าปัจจุบัน
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="myorder-container">
        <h1>สถิติการจองสนาม {fieldName}</h1>
        {useDateRange && (
          <div className="filters-order">
            <label>
              วันที่จอง:
              {filters.bookingDate && <>{formatDate(filters.bookingDate)}</>}
              <input
                type="date"
                name="bookingDate"
                value={filters.bookingDate}
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
                <option value="complete">การจองสำเร็จ</option>
              </select>
            </label>
            <button onClick={clearFilters} className="clear-filters-btn">
              ล้างตัวกรอง
            </button>
            <button
              className="swip-mode-order"
              type="button"
              onClick={() => {
                setUseDateRange((prev) => !prev);
                // เคลียร์ค่าที่ไม่ได้ใช้
                setFilters((prev) => ({
                  ...prev,
                  bookingDate: useDateRange ? prev.bookingDate : "",
                  startDate: useDateRange ? "" : prev.startDate,
                  endDate: useDateRange ? "" : prev.endDate,
                  status: useDateRange ? "" : prev.status,
                }));
              }}
            >
              {!useDateRange ? "ใช้วันที่อย่างเดียว" : "ใช้ช่วงวัน"}
            </button>
            {stats.totalRevenue >= 0 && (
              <div className="revenue-summary">
                <div className="revenue-card">
                  <h3>รายได้รวม (การจองสำเร็จ)</h3>
                  <p className="revenue-amount">
                    {stats.totalRevenue.toLocaleString()} บาท
                  </p>
                </div>
                {/* <div className="revenue-card">
                <h3>ค่ามัดจำรวม</h3>
                <p className="revenue-amount">{stats.totalDeposit.toLocaleString()} บาท</p>
              </div> */}
              </div>
            )}
          </div>
        )}

        {!useDateRange && (
          <div className="filters-order">
            <div className="date-range-filter">
              <label>
                วันที่เริ่ม:
                {(filters.startDate || filters.endDate) && (
                  <>{filters.startDate && formatDate(filters.startDate)}</>
                )}
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </label>

              <label>
                ถึงวันที่:
                {(filters.startDate || filters.endDate) && (
                  <>{filters.endDate && formatDate(filters.endDate)}</>
                )}
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  min={filters.startDate} // ป้องกันเลือกวันที่สิ้นสุดก่อนวันที่เริ่มต้น
                />
              </label>
            </div>

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
                <option value="complete">การจองสำเร็จ</option>
              </select>
            </label>

            <button onClick={clearFilters} className="clear-filters-btn">
              ล้างตัวกรอง
            </button>
            <button
              className="swip-mode-order"
              type="button"
              onClick={() => {
                setUseDateRange((prev) => !prev);
                // เคลียร์ค่าที่ไม่ได้ใช้
                setFilters((prev) => ({
                  ...prev,
                  bookingDate: useDateRange ? prev.bookingDate : "",
                  startDate: useDateRange ? "" : prev.startDate,
                  endDate: useDateRange ? "" : prev.endDate,
                  status: useDateRange ? "" : prev.status,
                }));
              }}
            >
              {!useDateRange ? "ใช้วันที่อย่างเดียว" : "ใช้ช่วงวัน"}
            </button>
            {stats.totalRevenue >= 0 && (
              <div className="revenue-summary">
                <div className="revenue-card">
                  <h3>รายได้รวม (การจองสำเร็จ)</h3>
                  <p className="revenue-amount">
                    {stats.totalRevenue.toLocaleString()} บาท
                  </p>
                </div>
                {/* <div className="revenue-card">
                <h3>ค่ามัดจำรวม</h3>
                <p className="revenue-amount">{stats.totalDeposit.toLocaleString()} บาท</p>
              </div> */}
              </div>
            )}
          </div>
        )}

        {/* แสดงสถิติ */}
        {booking.length > 0 && (
          <div className="stats-summary">
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-inline">
                  รายการทั้งหมด:{" "}
                  <span className="stat-number">{stats.total}</span>
                </p>
              </div>
              <div className="stat-card pending">
                <p className="stat-inline">
                  รอตรวจสอบ:{" "}
                  <span className="stat-number">{stats.pending}</span>
                </p>
              </div>
              <div className="stat-card approved">
                <p className="stat-inline">
                  อนุมัติแล้ว:{" "}
                  <span className="stat-number">{stats.approved}</span>
                </p>
              </div>
              <div className="stat-card rejected">
                <p className="stat-inline">
                  ไม่อนุมัติ:{" "}
                  <span className="stat-number">{stats.rejected}</span>
                </p>
              </div>
              <div className="stat-card approved">
                <p className="stat-inline">
                  เสร็จสมบูรณ์:{" "}
                  <span className="stat-number">{stats.complete}</span>
                </p>
              </div>
            </div>
          </div>
        )}
        {/* ส่วนสถิติ */}
        {dataLoading ? (
          <div className="load-container-order">
            <div className="loading-data">
              <div className="loading-data-spinner"></div>
            </div>
          </div>
        ) : currentBookings.length > 0 ? (
          <div>
            <table className="table-stat">
              <thead>
                <tr>
                  <th>วันที่จอง</th>
                  <th>ชื่อผู้จอง</th>
                  <th>สนาม</th>
                  <th>สนามย่อย</th>
                  <th>เวลา</th>
                  <th>กิจกรรม</th>
                  <th>มัดจำ</th>
                  <th>ราคารวมสุทธิ</th>
                  <th>สิ่งอำนวยความสะดวก</th>
                  <th>คะแนนรีวิว</th>
                  <th>คอมเมนต์</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {currentBookings.map((item, index) => (
                  <tr key={index} className="booking-data-table-stat">
                    <td>
                      {formatDate(item.start_date)}{" "}
                      <a
                        href={`/bookingDetail/${item.booking_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          marginLeft: "8px",
                          color: "blue",
                          cursor: "pointer",
                          textDecoration: "none",
                        }}
                      >
                        ↗
                      </a>
                    </td>

                    <td>
                      {item.first_name} {item.last_name}
                    </td>
                    <td>{item.field_name}</td>
                    <td>{item.sub_field_name}</td>
                    <td>
                      {item.start_time} - {item.end_time}
                    </td>
                    <td>{item.activity}</td>
                    <td>{item.price_deposit}</td>
                    <td>{item.total_price}</td>
                    <td>
                      {Array.isArray(item.facilities) &&
                      item.facilities.length > 0
                        ? item.facilities.map((fac, i) => (
                            <span key={i}>
                              {fac.fac_name}
                              {i < item.facilities.length - 1 ? ", " : ""}
                            </span>
                          ))
                        : "ไมได้เลือก"}
                    </td>
                    <td>
                      {item.status !== "complete"
                        ? "ยังไม่มีคะแนน"
                        : item.rating != null
                        ? item.rating
                        : "ไม่มีรีวิว"}
                    </td>
                    <td>
                      {item.status !== "complete"
                        ? "ยังไม่มีคอมเมนต์"
                        : item.comment != null
                        ? item.comment
                        : "ไม่มีรีวิว"}
                    </td>
                    <td className={`status-text-detail-stat ${item.status}`}>
                      {item.status === "pending"
                        ? "รอตรวจสอบ"
                        : item.status === "approved"
                        ? "อนุมัติแล้ว"
                        : item.status === "rejected"
                        ? "ไม่อนุมัติ"
                        : item.status === "complete"
                        ? "การจองสำเร็จ"
                        : "ไม่ทราบสถานะ"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBookings.length > bookingPerPage && (
              <div className="pagination-container-stat">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  «
                </button>

                {getPaginationRange(
                  currentPage,
                  Math.ceil(filteredBookings.length / bookingPerPage)
                ).map((page, index) =>
                  page === "..." ? (
                    <span key={index} className="pagination-dots-stat">
                      ...
                    </span>
                  ) : (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(page)}
                      className={page === currentPage ? "active-page-stat" : ""}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      prev < Math.ceil(filteredBookings.length / bookingPerPage)
                        ? prev + 1
                        : prev
                    )
                  }
                  disabled={
                    currentPage >=
                    Math.ceil(filteredBookings.length / bookingPerPage)
                  }
                >
                  »
                </button>
              </div>
            )}
          </div>
        ) : (
          <h1 className="booking-list">ไม่พบคำสั่งจอง</h1>
        )}
        {/* ส่วนสถิติ */}
      </div>
    </>
  );
}
