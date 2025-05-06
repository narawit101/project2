"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/app/css/Booking.css";
import { useAuth } from "@/app/contexts/AuthContext";
export default function Booking() {
  const { subFieldId } = useParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [openHours, setOpenHours] = useState("");
  const [closeHours, setCloseHours] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]); // array เก็บ index ที่เลือก
  const [canBook, setCanBook] = useState(false);
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [totalHours, setTotalHours] = useState(0);
  const [price, setPrice] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [addOns, setAddOns] = useState([]);
  const [activity, setActivity] = useState("ราคาปกติ");
  const [facilities, setFacilities] = useState([]);
  const [selectPrice, setSelectPrice] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [priceDeposit, setPriceDeposit] = useState(0);
  const [sumFac, setSumFac] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [payMethod, setPayMethod] = useState("");
  const router = useRouter();
  const bookingDate = sessionStorage.getItem("booking_date");
  const bookingDateFormatted = new Date(bookingDate).toLocaleDateString(
    "en-CA"
  );
  const { user, isLoading } = useAuth();
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isBooked, setIsBooked] = useState(false); // ใช้ติดตามว่าเกิดการจองหรือยัง
  const [subFieldData, setSubFieldData] = useState([]);
  const field_id = localStorage.getItem("field_id");
  const nameBank = localStorage.getItem("name_bank");
  const numberBank = localStorage.getItem("number_bank");
  const accountHolder = localStorage.getItem("account_holder");
  const fieldName = localStorage.getItem("field_name");
  const [showFacilities, setShowFacilities] = useState(false);
  const [depositSlip, setDepositSlip] = useState(null); // เก็บไฟล์
  const [imgPreview, setImgPreview] = useState(""); // เก็บ URL
  const [message, setMessage] = useState(""); // ข้อความแสดงผลผิดพลาด
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.push("/verification");
    }
    if(!bookingDate)
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!bookingDate || !subFieldId) return;

    const fetchBookedSlots = async () => {
      try {
        console.log("Fetching booked slots...");
        const res = await fetch(
          `${API_URL}/booking/booked-time/${subFieldId}/${bookingDate}`
        );
        const data = await res.json();

        console.log("Data received:", data); // ตรวจสอบข้อมูลที่ได้จาก API

        if (!data.error) {
          setBookedSlots(data.data); // [{start_time, end_time}]
        } else {
          console.error("API returned error:", data.message);
        }
      } catch (error) {
        console.error("Failed to fetch booked slots:", error.message);
      }
    };

    fetchBookedSlots();

    if (isBooked) {
      fetchBookedSlots(); // เรียก fetchBookedSlots ใหม่เมื่อ isBooked เป็น true
      setIsBooked(false); // รีเซ็ตสถานะ isBooked หลังจากดึงข้อมูลแล้ว
    }
  }, [bookingDate, subFieldId, isBooked]); // เพิ่ม isBooked เป็น dependency

  useEffect(() => {
    if (!field_id) {
      console.log("field_id is not defined. Skipping fetch.");
      return; // ถ้าไม่มี field_id ก็ไม่ให้ทำงานต่อ
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/field/field-fac/${field_id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        // ตรวจสอบว่าไม่มี error ใน response
        if (!data.error && data.data) {
          const fac = data.data.filter((f) => f.fac_price !== 0); // ตรวจสอบว่า fac_price ไม่เป็น 0
          setFacilities(fac);
          console.log(fac); // แสดงข้อมูลที่ได้จาก API
        } else {
          console.error("Error fetching data:", data.message);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [field_id]); // ใช้ field_id เป็น dependency

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/field/field-data/${subFieldId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!data.error) {
          setOpenHours(data.data[0].open_hours);
          setCloseHours(data.data[0].close_hours);
          setPriceDeposit(data.data[0].price_deposit);
          const calculatedSlots = slotTimes(
            data.data[0].open_hours,
            data.data[0].close_hours
          );
          setSlots(calculatedSlots);

          const subField = data.data[0].sub_fields.find(
            (field) => field.sub_field_id == subFieldId
          );
          if (subField) {
            console.log("subField:", subField);
            setAddOns(subField.add_ons);
            setPrice(subField.price); // กำหนดราคาเริ่มต้น
            setNewPrice(subField.price);
          } else {
            console.log("ไม่พบ subField ตาม subFieldId");
          }
        } else {
          console.log("ไม่พบข้อมูลวันเปิดสนาม");
        }
      } catch (error) {
        router.push("/");
        console.error("Error fetching open days", error);
      }
    };
    fetchData();
  }, [subFieldId]);

  useEffect(() => {
    if (!subFieldId) {
      return;
    }
    const fetchData = async () =>
      await fetch(`${API_URL}/field/open-days/${subFieldId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application",
        },
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error("ไม่พบข้อมูล");
          } else {
            const selectedSubField =
              data[0].sub_fields.find(
                (subField) => subField.sub_field_id === parseInt(subFieldId)
              ) || "ไม่พบข้อมูล";
            setSubFieldData(selectedSubField);
            console.log("ข้อมูลสนาม", data);
          }
        })
        .catch((error) => {
          console.error("Error Fetching", error);
        });
    fetchData();
  }, [subFieldId]);

  function slotTimes(openHours, closeHours) {
    const slots = [];
    let [openHour, openMinute] = openHours.split(":").map(Number);
    let [closeHour, closeMinute] = closeHours.split(":").map(Number);

    if (openMinute > 0 && openMinute <= 30) {
      openMinute = 30;
    } else if (openMinute > 30) {
      openMinute = 0;
      openHour += 1;
    }

    if (closeMinute > 0 && closeMinute <= 30) {
      closeMinute = 0;
    } else if (closeMinute > 30) {
      closeMinute = 30;
    }

    const openDate = new Date(1970, 0, 1, openHour, openMinute);
    let closeDate = new Date(1970, 0, 1, closeHour, closeMinute);

    if (closeDate <= openDate) {
      closeDate.setDate(closeDate.getDate() + 1);
    }

    let currentTime = new Date(openDate);

    while (currentTime < closeDate) {
      const nextTime = new Date(currentTime);
      nextTime.setMinutes(currentTime.getMinutes() + 30);

      const slot = `${currentTime
        .getHours()
        .toString()
        .padStart(2, "0")}:${currentTime
        .getMinutes()
        .toString()
        .padStart(2, "0")} - ${nextTime
        .getHours()
        .toString()
        .padStart(2, "0")}:${nextTime
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      slots.push(slot);

      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return slots;
  }

  function getSlotStatus(slot) {
    const [slotStartStr, slotEndStr] = slot.split(" - ");
    const [slotStartHour, slotStartMinute] = slotStartStr
      .split(":")
      .map(Number);
    const [slotEndHour, slotEndMinute] = slotEndStr.split(":").map(Number);

    const slotStart = new Date(1970, 0, 1, slotStartHour, slotStartMinute);
    let slotEnd = new Date(1970, 0, 1, slotEndHour, slotEndMinute);
    if (slotEnd <= slotStart) slotEnd.setDate(slotEnd.getDate() + 1);

    for (let booking of bookedSlots) {
      if (!booking?.start_time || !booking?.end_time) continue;

      const [bookStartHour, bookStartMinute] = booking.start_time
        .split(":")
        .map(Number);
      const [bookEndHour, bookEndMinute] = booking.end_time
        .split(":")
        .map(Number);

      let bookingStart = new Date(1970, 0, 1, bookStartHour, bookStartMinute);
      let bookingEnd = new Date(1970, 0, 1, bookEndHour, bookEndMinute);
      if (bookingEnd <= bookingStart)
        bookingEnd.setDate(bookingEnd.getDate() + 1);

      if (slotStart < bookingEnd && slotEnd > bookingStart) {
        return booking.status; // คืนค่า 'approved' หรือ 'pending'
      }
    }

    return null;
  }

  function toggleSelectSlot(index) {
    if (selectedSlots.length === 0) {
      setSelectedSlots([index]);
      setCanBook(true);
    } else if (selectedSlots.length === 1) {
      setSelectedSlots((prev) => [...prev, index]);
      setCanBook(true);
    } else {
      setSelectedSlots([index]); // ถ้าเลือกครบแล้วให้เริ่มใหม่
      setCanBook(true);
    }
  }

  function calculateSelectedTimes() {
    if (selectedSlots.length === 0) {
      setTimeStart("");
      setTimeEnd("");
      setTotalHours(0);
      return;
    }

    const sorted = [...selectedSlots].sort((a, b) => a - b);
    const start = slots[sorted[0]].split("-")[0].trim();
    let end = slots[sorted[sorted.length - 1]].split("-")[1].trim();

    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    // ถ้าเป็น 00:00 ควรเพิ่มวันให้กับ end time
    if (endHour === 0 && endMinute === 0) {
      // ถ้าเป็น 00:00 ก็ถือว่าเป็นเวลาในวันถัดไป
      end = "23:59"; // เปลี่ยนเป็นเวลาสุดท้ายของวันถัดไป
    } else if (
      endHour < startHour ||
      (endHour === startHour && endMinute < startMinute)
    ) {
      setMessage("ไม่สามารถจองข้ามวันได้ กรุณาเลือกเวลาใหม่");
      setMessageType("error");
      setSelectedSlots([]);
      setTimeStart("");
      setTimeEnd("");
      setTotalHours(0);
      setCanBook(false);
      return;
    }

    setTimeStart(start);
    setTimeEnd(end);

    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    let minutes = endInMinutes - startInMinutes;

    if (minutes < 0) minutes += 24 * 60; // คำนวณกรณีข้ามวัน

    let hours = minutes / 60;
    if (hours % 1 === 0.5) {
      hours = Math.floor(hours) + 0.5;
    }

    setTotalHours(hours);
  }

  useEffect(() => {
    calculateSelectedTimes();
  }, [selectedSlots]);

  function resetSelection() {
    setShowFacilities(false);
    setCanBook(false);
    setSelectedSlots([]);
    setPayMethod("");
    setDepositSlip(null);
    setImgPreview("");
    setSelectedFacilities([]);
    setTimeStart("");
    setTimeEnd("");
    setTotalHours(0);
    setTotalPrice(0);
    setTotalRemaining(0);
  }

  const handlePriceOnChange = (e) => {
    const selectedValue = e.target.value;
    setSelectPrice(selectedValue);

    console.log("Selected Value:", selectedValue);

    // ถ้าเลือก "เล่นกีฬา"
    if (selectedValue === "subFieldPrice") {
      setNewPrice(price); // ใช้ราคา base ของ subField
      console.log("subField price:", price); // แสดงราคาที่เลือก
      setActivity("ราคาปกติ");
    } else {
      // หา add-on ที่เลือกจาก add_ons
      const selectedAddOn = addOns.find(
        (addOn) => addOn.add_on_id === parseInt(selectedValue)
      );
      console.log("Available AddOns:", addOns);

      if (selectedAddOn) {
        setNewPrice(selectedAddOn.price); // อัปเดตราคา
        console.log("Add-On price:", selectedAddOn.price);
        setActivity(selectedAddOn.content);
      } else {
        console.log("Add-On not found for selected value:", selectedValue);
      }
    }
  };

  const handleCheckBox = (facId, facPrice, facName) => {
    console.log("Selected Facilities before:", selectedFacilities);

    setSelectedFacilities((prev) => {
      const updatedFacilities = { ...prev };
      let newSumFac = sumFac;

      if (updatedFacilities[facId] !== undefined) {
        delete updatedFacilities[facId];
        newSumFac -= facPrice;
      } else {
        updatedFacilities[facId] = {
          field_fac_id: facId, // ✅ เปลี่ยนจาก facility_id → field_fac_id
          fac_name: facName, // ✅ เปลี่ยนจาก name → fac_name
          price: facPrice,
        };
        newSumFac += facPrice;
      }

      setSumFac(newSumFac);
      return updatedFacilities;
    });
  };

  const calculatePrice = (newPrice, totalHours, sumFac) => {
    if (sumFac === 0) {
      if (totalHours % 1 === 0.3) {
        totalHours = totalHours + 0.2;
      }
      const sum = newPrice * totalHours;
      const remaining = newPrice * totalHours - priceDeposit;
      setTotalPrice(sum);
      setTotalRemaining(remaining);
    } else {
      const sum = newPrice * totalHours + sumFac;
      const remaining = newPrice * totalHours + sumFac - priceDeposit;
      setTotalPrice(sum);
      setTotalRemaining(remaining);
    }
    return totalPrice;
  };

  useEffect(() => {
    console.log("คิดเงิน");
    console.log(newPrice);
    console.log(totalHours);
    console.log(sumFac);

    if (newPrice && totalHours) {
      calculatePrice(newPrice, totalHours, sumFac);
    }
  }, [newPrice, totalHours, sumFac]);

  const handleRadioChange = (e) => {
    setPayMethod(e.target.value);
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const handleimgChange = (e) => {
    const file = e.target.files[0];

    // ตรวจสอบขนาดไฟล์
    if (file.size > MAX_FILE_SIZE) {
      setMessage("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)");
      setMessageType("error");
      e.target.value = null;
      return;
    }

    // ตรวจสอบว่าไฟล์ที่เลือกเป็นรูปภาพหรือไม่
    if (file) {
      if (file.type.startsWith("image/")) {
        // ถ้าเป็นไฟล์รูปภาพ, เก็บข้อมูลลงในสถานะ
        setDepositSlip(file);
        setImgPreview(URL.createObjectURL(file)); // สร้าง URL สำหรับแสดงตัวอย่าง
      } else {
        e.target.value = null;
        setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพเท่านั้น");
        setMessageType("error");
      }
    }
  };

  const handleSubmit = async () => {
    const bookingData = new FormData();

    if (!timeStart || !timeEnd) {
      setMessage("กรุณาเลือกช่วงเวลา");
      setMessageType("error");
      return;
    }

    if (!payMethod) {
      setMessage("กรุณาเลือกช่องทางการชำระเงิน");
      setMessageType("error");
      return;
    }

    // if (priceDeposit > 0) {
    //   if (!depositSlip) {
    //     setMessage("กรุณาแนบสลิปหลักฐานการชำระเงินมัดจำก่อนทำการจอง");
    //     setMessageType("error");
    //     return;
    //   }
    // }

    const facilityList = Object.values(selectedFacilities).map((item) => ({
      field_fac_id: item.field_fac_id,
      fac_name: item.fac_name,
    }));

    bookingData.append("deposit_slip", depositSlip);
    bookingData.append(
      "data",
      JSON.stringify({
        fieldId: field_id,
        userId: user?.user_id,
        subFieldId: subFieldId,
        bookingDate: bookingDateFormatted,
        startTime: timeStart,
        endTime: timeEnd,
        totalHours: totalHours,
        totalPrice: totalPrice,
        payMethod: payMethod,
        totalRemaining: totalRemaining,
        activity: activity,
        selectedFacilities: facilityList,
        status: "pending",
      })
    );

    console.log("Booking Data being sent:", bookingData);

    try {
      const response = await fetch(`${API_URL}/booking`, {
        method: "POST",
        headers: {
          // ไม่มี Content-Type ที่ต้องระบุ
        },
        body: bookingData, // ส่งข้อมูลแบบ FormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMessage(errorData.message);
        setMessageType("error");
      } else {
        const data = await response.json();
        if (data.success) {
          setMessage("บันทึกการจองสำเร็จ");
          setMessageType("success");
          setIsBooked(true);
          setCanBook(false);
          setSelectedSlots([]);
          setPayMethod("");
          setDepositSlip(null);
          setImgPreview("");
          setSelectedFacilities([]);
          setTimeStart("");
          setTimeEnd("");
          setTotalHours(0);
          setTotalPrice(0);
          setTotalRemaining(0);
          setShowFacilities(false);
        } else {
          setMessage(`Error:${data.message}`);
          setMessageType("error");
        }
      }
    } catch (error) {
      setMessage(`เกิดข้อผิดพลาด:${error.message}`);
      setMessageType("error");
    }
  };

  // const showPrice = () => {
  //   // แสดงราคาใน UI
  //   console.log(price);
  //   console.log(bookingDateFormatted);
  //   console.log(`new${newPrice}`);
  //   console.log(`field_id${field_id}`);
  //   console.log(facilities);
  //   console.log(sumFac);
  //   console.log(`มัดจำ${priceDeposit}`);
  //   console.log(`${payMethod}`);
  //   console.log(`${bookingDate}`);
  //   console.log(`${activity}`);
  //   console.log(`selectedFacilities${selectedFacilities}`);
  //   console.log(JSON.stringify(selectedFacilities, null, 2));
  //   const facilityList = Object.values(selectedFacilities).map((item) => ({
  //     field_fac_id: item.field_fac_id,
  //     fac_name: item.fac_name,
  //   }));

  //   console.log(facilityList);
  // };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div>
      <div className="menu-addons">
        {/* เลือก Add-Ons */}

        {/* <p>ราคา: {price} บาท</p> */}

        <p>
          {totalHours}*{newPrice}
        </p>
      </div>

      <h1 className="select-time-book">เลือกช่วงเวลา</h1>
      <div className="container-bookings">
        {message && (
          <div className={`message-box ${messageType}`}>
            <p>{message}</p>
          </div>
        )}

        {slots.length === 0 ? (
          <p>กำลังโหลด...</p>
        ) : (
          <div className="book-content">
            <div className="slots-grid">
              {slots.map((slot, index) => {
                const minIndex = Math.min(...selectedSlots);
                const maxIndex = Math.max(...selectedSlots);
                const isSelected =
                  selectedSlots.length > 0 &&
                  index >= minIndex &&
                  index <= maxIndex;

                const slotStatus = getSlotStatus(slot); // ใช้แทน isSlotBooked
                const isBooked = slotStatus !== null;

                let slotClass = "slot-box";
                if (slotStatus === "approved") slotClass += " approved-slot";
                else if (slotStatus === "pending") slotClass += " pending-slot";
                else if (isSelected) slotClass += " selected-slot";

                return (
                  <div
                    key={index}
                    className={slotClass}
                    onClick={() => {
                      if (!isBooked) toggleSelectSlot(index);
                    }}
                    style={{ cursor: isBooked ? "not-allowed" : "pointer" }}
                  >
                    <div className="slot-time">{slot}</div>
                    <div className="slot-tag">
                      {slotStatus === "approved"
                        ? "จองแล้ว"
                        : slotStatus === "pending"
                        ? "รอตรวจสอบ"
                        : isSelected
                        ? "กำลังเลือก..."
                        : "ว่าง"}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="addon-options">
              {/* <h3 className="addon-title">เลือกราคา</h3> */}
              <div className="addon-grid">
                <div
                  className={`addon-card ${
                    selectPrice === "subFieldPrice" ? "selected" : ""
                  }`}
                  onClick={() =>
                    handlePriceOnChange({ target: { value: "subFieldPrice" } })
                  }
                >
                  <p className="addon-content">ปกติ</p>
                  <p className="addon-price">{price} บาท/ชม.</p>
                </div>

                {addOns.map((addOn) => (
                  <div
                    key={addOn.add_on_id}
                    className={`addon-card ${
                      selectPrice === addOn.add_on_id ? "selected" : ""
                    }`}
                    onClick={() =>
                      handlePriceOnChange({
                        target: { value: addOn.add_on_id },
                      })
                    }
                  >
                    <p className="addon-content">{addOn.content}</p>
                    <p className="addon-price">{addOn.price} บาท/ชม.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="book-sider">
          <div className="book-sum-box">
            <p className="time-info">
              เปิด: {openHours} - {closeHours} น
            </p>
            <h1 className="field-title">{fieldName}</h1>

            {subFieldData !== "ไม่พบข้อมูล" ? (
              <h2 className="sub-field-title">
                สนาม: {subFieldData.sub_field_name}
              </h2>
            ) : (
              <h2 className="sub-field-title sub-field-error">
                สนาม: {subFieldData}
              </h2>
            )}

            <div className="time-info-book">
              <strong>เวลาเริ่ม: {timeStart || "-"}</strong>
              <strong>เวลาสิ้นสุด: {timeEnd || "-"}</strong>
              <strong>
                รวมเวลา: {totalHours ? `${totalHours} ชั่วโมง` : "-"}
              </strong>
            </div>

            <div className="facility-wrapper">
              <button
                onClick={() => setShowFacilities(!showFacilities)}
                className="toggle-facilities"
              >
                {showFacilities
                  ? "ซ่อนสิ่งอำนวยความสะดวก"
                  : "สิ่งอำนวยความสะดวกเพิ่มเติม"}
              </button>

              {showFacilities && (
                <div className="facilities-list-book">
                  {facilities.map((fac) => (
                    <div key={fac.field_fac_id} className="facility-item-book">
                      <input
                        type="checkbox"
                        checked={
                          selectedFacilities[fac.field_fac_id] !== undefined
                        }
                        onChange={() =>
                          handleCheckBox(
                            fac.field_fac_id,
                            fac.fac_price,
                            fac.fac_name
                          )
                        }
                      />
                      <label>
                        {fac.fac_name} - {fac.fac_price} บาท
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* <button onClick={showPrice} className="btn-show">
              แสดงราคา
            </button> */}

            {canBook && (
              <>
                <div className="book-owner-info">
                  <strong>ธนาคาร: {nameBank}</strong>
                  <strong>
                    <label>เจ้าของบัญชี</label>: {accountHolder}
                  </strong>
                  <strong>
                    <label>เลขบัญชี</label>: {numberBank}
                  </strong>
                </div>
                <div className="payment-method">
                  <div className="radio-group-book">
                    <label>
                      <input
                        type="radio"
                        value="โอนจ่าย"
                        checked={payMethod === "โอนจ่าย"}
                        onChange={handleRadioChange}
                      />
                      โอนจ่าย
                    </label>
                    <label>
                      <input
                        type="radio"
                        value="เงินสด"
                        checked={payMethod === "เงินสด"}
                        onChange={handleRadioChange}
                      />
                      เงินสด
                    </label>
                  </div>
                </div>
                <div className="file-container-book">
                  <label className="file-label-book">
                    <input
                      type="file"
                      onChange={handleimgChange}
                      accept="image/*"
                      className="file-input-hidden-book"
                    />
                    เลือกรูปภาพ
                  </label>
                  {imgPreview && (
                    <div className="preview-container">
                      <p>ตัวอย่างรูป:</p>
                      <img src={imgPreview} alt="Preview" />
                    </div>
                  )}
                </div>

                <div className={`total-box ${canBook ? "show" : ""}`}>
                  <strong>ราคา: {totalPrice} บาท</strong>
                  <strong className="price-deposit">
                    มัดจำ: {priceDeposit} บาท
                  </strong>

                  <strong className="total-remaining">
                    ยอดรวมสุทธิ: {totalRemaining} บาท
                  </strong>
                  <button onClick={handleSubmit} className="btn-submit-book">
                    จอง
                  </button>
                  <button className="btn-reset" onClick={resetSelection}>
                    รีเซ็ตการเลือก
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
