"use client";
import { useEffect, useRef, useState, useCallback } from "react";
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
  const [message, setMessage] = useState(""); // State for messages
  const [messageType, setMessageType] = useState(""); // State for message type (error, success)
  const [userName, setUserName] = useState("");
  const [userInfo, setUserInfo] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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

  const fetchData = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      const token = localStorage.getItem("auth_mobile_token");

      const queryParams = new URLSearchParams();
      if (filters.date) queryParams.append("date", filters.date);
      if (filters.status) queryParams.append("status", filters.status);

      const res = await fetch(
        `${API_URL}/booking/my-bookings/${
          user.user_id
        }?${queryParams.toString()}`,
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
        setUserName(data.user?.user_name || "");
        setUserInfo(
          `${data.user?.first_name || ""} ${data.user?.last_name || ""}`
        );
        console.log("Booking Data:", data.data);
      } else {
        console.log("Booking fetch error:", data.error);
        setMessage(data.error);
        setMessageType("error");
      }
    } catch (error) {
      console.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setMessageType("error");
    } finally {
      setDataLoading(false);
    }
  }, [user?.user_id, filters, API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    console.log("API_URL:", API_URL);
    console.log(" connecting socket...");

    socketRef.current = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
    });

    socket.on("slot_booked", () => {
      console.log("slot_booked → reload my-bookings");
      fetchData(); // โหลดข้อมูลใหม่เมื่อมีคนจอง
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
    setCurrentPage(1);
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

  const getFacilityNetPrice = (item) => {
    const totalFac = (item.facilities || []).reduce(
      (sum, fac) => sum + (parseFloat(fac.fac_price) || 0),
      0
    );
    return Math.abs(totalFac - (parseFloat(item.total_remaining) || 0));
  };
  const bookingPerPage = 4;

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

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="myorder-container">
        <h1 className="head-title-my-order">รายการจองสนามของคุณ {userName}</h1>

        <div className="filters-order">
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
              <option value="complete">การจองสำเร็จ</option>
            </select>
          </label>
        </div>
        {dataLoading ? (
          <div className="load-container-order">
            <div className="loading-data">
              <div className="loading-data-spinner"></div>
            </div>
          </div>
        ) : currentBookings.length > 0 ? (
          <>
            <ul className="booking-list">
              {currentBookings.map((item, index) => (
                <li key={index} className="booking-card">
                  <div className="booking-detail">
                    <p>
                      <strong>ชื่อผู้จอง: </strong>
                      {userInfo}
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
                        {item.cancel_hours > 0 && (
                          <p>
                            <strong> สามารถยกเลิกก่อนเวลาเริ่ม: </strong>
                            {item.cancel_hours} ชม.
                          </p>
                        )}

                      </div>
                      {item.cancel_hours > 0 && (
                        <div className="total-date-order">
                        <hr className="divider-order" />

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
                      )}
                    </div>
                    <div className="compact-price-box-order">
                      {/* กิจกรรม */}
                      <div className="line-item-order">
                        <span>กิจกรรม:</span>
                        <span>{item.activity}</span>
                      </div>

                      {/* สนาม */}
                      <div className="line-item-order">
                        <span>ราคาสนาม:</span>
                        <span>
                          {item.total_price -
                            item.price_deposit -
                            (item.facilities?.reduce(
                              (sum, f) => sum + f.fac_price,
                              0
                            ) || 0)}{" "}
                          บาท
                        </span>
                      </div>

                      {/* สิ่งอำนวยความสะดวก */}
                      {Array.isArray(item.facilities) &&
                        item.facilities.length > 0 && (
                          <div className="line-item-order">
                            <span>ราคาสิ่งอำนวยความสะดวก:</span>
                            <span>
                              {item.facilities.reduce(
                                (sum, f) => sum + f.fac_price,
                                0
                              )}{" "}
                              บาท
                            </span>
                          </div>
                        )}

                      <hr className="divider-order" />

                      {/* รวมที่ต้องจ่าย (ไม่รวมมัดจำ) */}
                      <div className="line-item-order remaining">
                        <span className="total-remaining-order">
                          รวมที่ต้องจ่าย(ยอดคงเหลือ):
                        </span>
                        <span className="total-remaining-order">
                          +{item.total_remaining} บาท
                        </span>
                      </div>

                      {/* มัดจำ */}
                      <div className="line-item-order plus">
                        <span className="total_deposit-order">มัดจำ:</span>
                        <span>+{item.price_deposit} บาท</span>
                      </div>

                      <hr className="divider-order" />

                      {/* สุทธิทั้งหมด */}
                      <div className="line-item-order total">
                        <span>สุทธิ:</span>
                        <span>{item.total_price} บาท</span>
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
                          : item.status === "complete"
                          ? "การจองสำเร็จ"
                          : "ไม่ทราบสถานะ"}
                      </span>
                    </p>
                  </div>

                  <button
                    className="detail-button"
                    onClick={() =>
                      window.open(`/bookingDetail/${item.booking_id}`, "_blank")
                    }
                  >
                    ดูรายละเอียด
                  </button>
                </li>
              ))}
            </ul>
            {filteredBookings.length > bookingPerPage && (
              <div className="pagination-container-order">
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
                    <span key={index} className="pagination-dots-order">
                      ...
                    </span>
                  ) : (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(page)}
                      className={
                        page === currentPage ? "active-page-order" : ""
                      }
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
          </>
        ) : (
          <h1 className="booking-list">ไม่พบคำสั่งจอง</h1>
        )}
      </div>
    </>
  );
}
