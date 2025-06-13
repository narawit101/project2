"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/app/css/Booking.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { io } from "socket.io-client";

export default function Booking() {
  const { subFieldId } = useParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const socketRef = useRef(null);

  const [openHours, setOpenHours] = useState("");
  const [closeHours, setCloseHours] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]); // array เก็บ index ที่เลือก
  const [selectedSlotsArr, setSelectedSlotsArr] = useState([]); // array เก็บ index ที่เลือก
  const [canBook, setCanBook] = useState(false);
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalHours, setTotalHours] = useState(0);
  const [totalHoursFormat, setTotalHoursFormat] = useState(0);
  const [price, setPrice] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [addOns, setAddOns] = useState([]);
  const [activity, setActivity] = useState("ราคาปกติ");
  const [facilities, setFacilities] = useState([]);
  const [selectPrice, setSelectPrice] = useState("subFieldPrice");
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
  const [timeLeft, setTimeLeft] = useState(600); // เริ่มที่ 10 นาที (600 วิ)
  const [showModal, setShowModal] = useState(false);
  const timerRef = useRef(null); // กัน setInterval ซ้ำ
  const isTimeoutRef = useRef(false);
  const [message, setMessage] = useState(""); // ข้อความแสดงผลผิดพลาด
  const [messageType, setMessageType] = useState("");
  const [bookTimeArr, setBookTimeArr] = useState([]);
  const [bookingId, setBookingId] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }
    if (!bookingDate) {
      router.replace("/");
    }
  }, [user, isLoading, router, bookingDate]);

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
    if (!bookingDate || !subFieldId) return;
    const fetchBookedSlots = async () => {
      try {
        const bookingDateRaw = sessionStorage.getItem("booking_date");
        const bookingDateFormatted = new Date(bookingDate).toLocaleDateString(
          "en-CA"
        );
        const day = new Date(`${bookingDateFormatted}T00:00:00`);
        const today = new Date(day);
        today.setDate(day.getDate() + 1);
        const tomorrow = new Date(day);
        tomorrow.setDate(day.getDate() + 2);

        const start = today.toISOString().split("T")[0];
        const end = tomorrow.toISOString().split("T")[0];

        console.log(`today: ${bookingDateRaw}`);
        console.log(`start: ${start}`);
        console.log(`end: ${end}`);

        const res = await fetch(
          `${API_URL}/booking/booked-block/${subFieldId}/${start}/${end}`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();

        if (!data.error) {
          setBookedSlots(data.data);
          // setDataLoading(false);

          const timeRangesWithStatus = data.data.flatMap((item) =>
            (item.selected_slots || []).map((time) => ({
              time,
              status: item.status,
            }))
          );

          const selectedSlotsFromAPI = timeRangesWithStatus.map(
            (item) => item.time
          );

          setBookTimeArr(timeRangesWithStatus);
          setSelectedSlotsArr(selectedSlotsFromAPI);

          // console.log("bookingtime", timeRangesWithStatus);
          //console.log(data.data);
        } else {
          console.error("API returned error:", data.message);
          setMessage("ไม่สามารถดึงข้อมูลได้", data.message);
          setMessageType("error");
        }
      } catch (error) {
        console.error("Failed to fetch booked slots:", error.message);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error.message);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };
    fetchBookedSlots();

    if (isBooked) {
      fetchBookedSlots();
      setIsBooked(false);
    }
  }, [bookingDate, subFieldId, isBooked, bookingId]);

  useEffect(() => {
    if (!field_id) {
      return; 
    }
    // console.log(`bookedSlots${bookedSlots}`);
    const fetchData = async () => {
      try {
      await new Promise((resolve) => setTimeout(resolve, 15000));

        const res = await fetch(`${API_URL}/field/field-fac/${field_id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const data = await res.json();

        // ตรวจสอบว่าไม่มี error ใน response
        if (!data.error && data.data) {
          const fac = data.data.filter((f) => f.fac_price !== 0); // ตรวจสอบว่า fac_price ไม่เป็น 0
          setFacilities(fac);
          // console.log(fac); // แสดงข้อมูลที่ได้จาก API
        } else {
          console.error("Error fetching data:", data.message);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setDataLoading(false);
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
          credentials: "include",
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
        router.replace("/");
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
    console.log(bookTimeArr);
    const found = bookTimeArr.find((b) => b.time === slot);
    //console.log(`CHECK: slot = ${slot}, found =`, found);
    return found ? found.status : null;
  }

  function calculateSelectedTimes() {
    if (selectedSlots.length === 0) {
      setTimeStart("");
      setTimeEnd("");
      setStartDate(null); // เปลี่ยนจาก "" เป็น null
      setEndDate(null); // เปลี่ยนจาก "" เป็น null
      setTotalHours(0);
      return;
    }

    const sorted = [...selectedSlots].sort((a, b) => a - b);
    const start = slots[sorted[0]].split("-")[0].trim();
    let end = slots[sorted[sorted.length - 1]].split("-")[1].trim();

    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);
    const [openHour, openMinute] = openHours.split(":").map(Number);
    const bookingDateObj = new Date(bookingDateFormatted);
    const startDateObj = new Date(bookingDateObj);
    const endDateObj = new Date(bookingDateObj);

    if (
      startHour < openHour ||
      (startHour === openHour && startMinute < openMinute)
    ) {
      startDateObj.setDate(startDateObj.getDate() + 1);
      endDateObj.setDate(endDateObj.getDate() + 1);
    }

    // ถ้าเวลาสิ้นสุดข้ามวัน ให้เพิ่มวันให้ endDateObj
    if (
      endHour < startHour ||
      (endHour === startHour && endMinute < startMinute)
    ) {
      endDateObj.setDate(endDateObj.getDate() + 1);
    }

    setStartDate(startDateObj.toISOString().split("T")[0]); // แปลงเป็นรูปแบบ YYYY-MM-DD
    setEndDate(endDateObj.toISOString().split("T")[0]); // แปลงเป็นรูปแบบ YYYY-MM-DD
    setTimeStart(start);
    setTimeEnd(end);

    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    let minutes = endInMinutes - startInMinutes;

    if (minutes < 0) minutes += 24 * 60; // คำนวณกรณีข้ามวัน
    let totalHoursFormat;
    let hours = minutes / 60;
    if (hours % 1 === 0.5) {
      hours = Math.floor(hours) + 0.5;
      setTotalHoursFormat(totalHoursFormat);
    }

    if (hours % 1 != 0) {
      totalHoursFormat = Math.floor(hours) + 0.5;
      setTotalHoursFormat(totalHoursFormat);
    } else {
      setTotalHoursFormat(hours);
    }

    setTotalHours(hours);
  }

  useEffect(() => {
    calculateSelectedTimes();
  }, [selectedSlots]);

  const handlePriceOnChange = (e) => {
    const selectedValue = e.target.value;
    setSelectPrice(selectedValue);

    console.log("Selected Value:", selectedValue);

    // ถ้าเลือก "เล่นกีฬา"
    if (selectedValue === "subFieldPrice") {
      setNewPrice(price); // ใช้ราคา base ของ subField
      console.log("subField price:", price); // แสดงราคาที่เลือก
      setActivity(subFieldData.sport_name);
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
          field_fac_id: facId, //  เปลี่ยนจาก facility_id → field_fac_id
          fac_name: facName, //  เปลี่ยนจาก name → fac_name
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

  function isPastSlot(slot) {
    const [startTime] = slot.split(" - ");
    const [hour, minute] = startTime.split(":").map(Number);

    const now = new Date();
    const bookingDateObj = new Date(bookingDateFormatted);

    // เฉพาะกรณีวันนี้เท่านั้น (ไม่บล็อก slot ของวันอื่น)
    const isToday =
      now.toLocaleDateString("en-CA") ===
      bookingDateObj.toLocaleDateString("en-CA");

    if (!isToday) return false;

    const slotDateTime = new Date(bookingDateObj);
    slotDateTime.setHours(hour);
    slotDateTime.setMinutes(minute);
    slotDateTime.setSeconds(0);

    return now > slotDateTime;
  }

  function resetSelection() {
    setStartDate("");
    setEndDate("");
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
    setTotalHoursFormat(0);
  }

  const handleConfirm = () => {
    if (!payMethod) {
      setMessage("กรุณาเลือกช่องทางการชำระเงิน");
      setMessageType("error");
      return;
    }
    //     if (priceDeposit > 0) {
    //   if (!depositSlip) {
    //     setMessage("กรุณาแนบสลิปหลักฐานการชำระเงินมัดจำก่อนทำการจอง");
    //     setMessageType("error");
    //     return;
    //   }
    // }
    setShowModal(false);
    handleSubmit(); // ฟังก์ชันที่ใช้จองจริง
  };

  const handleCancel = () => {
    setShowModal(false);
    isTimeoutRef.current = false; // บอกว่าไม่ใช่หมดเวลาอัตโนมัติ
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(0); // ไม่ trigger redirect เพราะ isTimeoutRef = false
    setPayMethod("");
    setDepositSlip(null);
    setImgPreview("");
    setShowFacilities(false);
    setSelectedFacilities([]);
    setShowModal(false); // ปิดโมดอล
  };

  const validateBeforeSubmit = () => {
    if (!timeStart || !timeEnd) {
      setMessage("กรุณาเลือกช่วงเวลา");
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

    setShowModal(true); // ถ้าผ่าน validation แล้วค่อยแสดงโมดอล
    setTimeLeft(600); // รีเซ็ตเวลา
    if (timerRef.current) clearInterval(timerRef.current); // เคลียร์ก่อน
    startCountdown();
  };

  const handleSubmit = async () => {
    const bookingData = new FormData();

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
        startDate: startDate,
        endTime: timeEnd,
        endDate: endDate,
        selectedSlots: selectedSlotsArr,
        totalHours: totalHoursFormat,
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
        credentials: "include",
        body: bookingData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMessage(errorData.message);
        setMessageType("error");
        setStartDate("");
        setEndDate("");
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
        setTotalHoursFormat(0);
      } else {
        const data = await response.json();
        if (data.success) {
          setMessage("บันทึกการจองสำเร็จ");
          setMessageType("success");
          isTimeoutRef.current = false; // บอกว่าไม่ใช่หมดเวลาอัตโนมัติ
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setStartDate("");
          setEndDate("");
          setTimeLeft(0); // ไม่ trigger redirect เพราะ isTimeoutRef = false
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
          setTotalHoursFormat(0);
          //router.replace("");
          setTimeout(() => {
            router.replace("");
          }, 2000); // รอ 2 วิให้ console log แสดงทัน
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
    console.log("คิดเงิน");
    console.log(newPrice);
    console.log(totalHours);
    console.log(sumFac);

    if (newPrice && totalHours) {
      calculatePrice(newPrice, totalHours, sumFac);
    }
  }, [newPrice, totalHours, sumFac]);
  useEffect(() => {});

  const startCountdown = () => {
    isTimeoutRef.current = true; // เริ่มนับแบบอัตโนมัติ
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
  };

  useEffect(() => {
    if (timeLeft <= 0 && isTimeoutRef.current) {
      clearInterval(timerRef.current);
      setCanBook(false);
      localStorage.clear();
      sessionStorage.clear();
      router.replace("/");
    }
  }, [timeLeft]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  function toggleSelectSlot(index) {
    if (selectedSlots.length === 0) {
      setSelectedSlots([index]);
      setSelectedSlotsArr([slots[index]]); // ดึงชื่อ slot จาก index
      setCanBook(true);
    } else if (selectedSlots.length === 1) {
      const range = [selectedSlots[0], index].sort((a, b) => a - b);
      const allIndexes = [];
      const allSlots = [];
      for (let i = range[0]; i <= range[1]; i++) {
        allIndexes.push(i);
        allSlots.push(slots[i]);
      }
      setSelectedSlots(allIndexes);
      setSelectedSlotsArr(allSlots);
      setCanBook(true);
    } else {
      setSelectedSlots([index]);
      setSelectedSlotsArr([slots[index]]);
      setCanBook(true);
    }
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [message]);
  console.log(selectedSlotsArr);

  if (dataLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
    <div>
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
            <h1 className="select-time-book">เลือกช่วงเวลา</h1>
            <div className="sum-status-box-book">
              <div className="status-item-book">
                <div className="status-box-book-1"></div>
                <label>ว่าง</label>
              </div>
              <div className="status-item-book">
                <div className="status-box-book-2"></div>
                <label>รอตรวจสอบ</label>
              </div>
              <div className="status-item-book">
                <div className="status-box-book-3"></div>
                <label>จองแล้ว</label>
              </div>
            </div>
            <div className="slots-grid-book">
              {slots.map((slot, index) => {
                const minIndex = Math.min(...selectedSlots);
                const maxIndex = Math.max(...selectedSlots);
                const isSelected =
                  selectedSlots.length > 0 &&
                  index >= minIndex &&
                  index <= maxIndex;

                const slotStatus = getSlotStatus(slot); // ใช้แทน isSlotBooked
                const isBooked = slotStatus !== null;
                const isPast = isPastSlot(slot);

                let slotClass = "slot-box-book";
                if (slotStatus === "approved") slotClass += " approved-slot";
                else if (slotStatus === "pending") slotClass += " pending-slot";
                else if (isSelected) slotClass += " selected-slot";

                return (
                  <div
                    key={index}
                    className={slotClass}
                    onClick={() => {
                      if (!isBooked && !isPast) toggleSelectSlot(index);
                    }}
                    style={{
                      cursor: isBooked || isPast ? "not-allowed" : "pointer",
                      opacity: isPast ? 0.7 : 1, // ทำให้จางลงถ้าผ่านเวลาแล้ว
                    }}
                  >
                    <div className="slot-time-book">{slot}</div>
                    <div className="slot-tag-book">
                      {slotStatus === "approved"
                        ? ""
                        : slotStatus === "pending"
                        ? ""
                        : isSelected
                        ? "กำลังเลือก"
                        : ""}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="addon-options-book">
              <div className="addon-grid-book">
                <div
                  className={`addon-card ${
                    selectPrice === "subFieldPrice" ? "selected" : ""
                  }`}
                  onClick={() =>
                    handlePriceOnChange({ target: { value: "subFieldPrice" } })
                  }
                >
                  <p className="addon-content-book">ปกติ</p>
                  <p className="addon-price-book">{price} บาท/ชม.</p>
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
                    <p className="addon-content-book">{addOn.content}</p>
                    <p className="addon-price-book">{addOn.price} บาท/ชม.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="book-sider">
          <div className="book-sum-box">
            <h1 className="field-title-book">{fieldName}</h1>
            {subFieldData !== "ไม่พบข้อมูล" ? (
              <h2 className="sub-field-title">
                สนาม: {subFieldData.sub_field_name}
              </h2>
            ) : (
              <h2 className="sub-field-title sub-field-error">
                สนาม: {subFieldData}
              </h2>
            )}

            <div className="time-info">
              <p>{bookingDate}</p> เปิด: {openHours} - {closeHours} น
            </div>

            <div className="time-info-book">
              <strong>เวลาเริ่ม: {timeStart || "-"}</strong>
              <strong>เวลาสิ้นสุด: {timeEnd || "-"}</strong>
              <strong>
                รวมเวลา:{" "}
                {totalHoursFormat ? `${totalHoursFormat} ชั่วโมง` : "-"}
              </strong>
            </div>

            {/* <button onClick={showPrice} className="btn-show">
              แสดงราคา
            </button> */}
            {canBook && (
              <>
                <button
                  onClick={validateBeforeSubmit}
                  className="btn-submit-book"
                >
                  จอง
                </button>
                <button className="btn-reset" onClick={resetSelection}>
                  รีเซ็ตการเลือก
                </button>
              </>
            )}
          </div>
        </div>
        {showModal && (
          <div className="modal-overlay-confirmbooking">
            <div className="modal-box-confirmbooking">
              <h1 className="confirm-header-book">ยืนยันการจอง?</h1>
              <div className="countdown-timer-book">
                {Math.floor(timeLeft / 60)
                  .toString()
                  .padStart(2, "0")}
                :{(timeLeft % 60).toString().padStart(2, "0")}
              </div>
              <div className="detail-total-hour">
                <h1 className="field-title-book">{fieldName}</h1>
                {subFieldData !== "ไม่พบข้อมูล" ? (
                  <h2 className="sub-field-title-modal">
                    สนาม: {subFieldData.sub_field_name}
                  </h2>
                ) : (
                  <h2 className="sub-field-title-modal sub-field-error">
                    สนาม: {subFieldData}
                  </h2>
                )}
                <div className="time-info-book">
                  <strong>เวลาเริ่ม: {timeStart || "-"}</strong>
                  <strong>เวลาสิ้นสุด: {timeEnd || "-"}</strong>
                  <strong>
                    รวมเวลา:{" "}
                    {totalHoursFormat ? `${totalHoursFormat} ชั่วโมง` : "-"}
                  </strong>
                  <strong className="total-per-hour">
                    ราคา: {totalPrice} บาท
                  </strong>
                </div>
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
                      <div
                        key={fac.field_fac_id}
                        className="facility-item-book"
                      >
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
              <div className="book-owner-info">
                <h2 className="payment-book">การชำระเงิน</h2>
                <strong>ธนาคาร: {nameBank}</strong>
                <strong>
                  <label>เจ้าของบัญชี</label>: {accountHolder}
                </strong>
                <strong>
                  <label>เลขบัญชี</label>: {numberBank}
                </strong>

                <div className="file-container-book">
                  <label className="file-label-book">
                    <input
                      type="file"
                      onChange={handleimgChange}
                      accept="image/*"
                      className="file-input-hidden-book"
                    />
                    เลือกรูปภาพหลักฐานการโอนเงิน
                  </label>
                  {imgPreview && (
                    <div className="preview-container">
                      <p>ตัวอย่างรูป:</p>
                      <img src={imgPreview} alt="Preview" />
                    </div>
                  )}
                </div>
                {/* <div className="file-container-book">
                  <label className="file-label-book">
                    <input
                      type="file"
                      onChange={handleimgChange}
                      accept="image/*"
                      className="file-input-hidden-book"
                    />
                    เลือกรูปภาพยอดคงเหลือ
                  </label>
                  {imgPreview && (
                    <div className="preview-container">
                      <p>ตัวอย่างรูป:</p>
                      <img src={imgPreview} alt="Preview" />
                    </div>
                  )}
                </div> */}
              </div>
              <div className={`total-box ${canBook ? "show" : ""}`}>
                <div className="summary">
                  <strong className="price-deposit">
                    มัดจำที่ต้องจ่าย: {priceDeposit} บาท
                  </strong>

                  <strong className="total-per-hour">
                    ราคาหลังหักค่ามัดจำ: {totalRemaining} บาท
                  </strong>
                  <strong className="total-remaining">
                    ยอดรวมสุทธิ: {totalPrice} บาท
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
              </div>
              <div className="modal-buttons-confirmbooking">
                <button
                  onClick={handleConfirm}
                  className="btn-confirm-confirmbooking"
                >
                  ยืนยัน
                </button>
                <button
                  onClick={handleCancel}
                  className="btn-cancel-confirmbooking"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
