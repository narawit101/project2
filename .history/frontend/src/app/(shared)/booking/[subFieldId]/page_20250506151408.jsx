"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/app/css/booking.css";
import { useAuth } from "@/app/contexts/AuthContext";
export default function Booking() {
  const { subFieldId } = useParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [openHours, setOpenHours] = useState("");
  const [closeHours, setCloseHours] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]); // array เก็บ index ที่เลือก
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
  const field_id = localStorage.getItem("field_id");
  const bookingDate = sessionStorage.getItem("booking_date");
  const bookingDateFormatted = new Date(bookingDate).toLocaleDateString(
    "en-CA"
  );
  const { user, isLoading } = useAuth();
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isBooked, setIsBooked] = useState(false); // ใช้ติดตามว่าเกิดการจองหรือยัง
  const nameBank = localStorage.getItem("name_bank");
  const numberBank = localStorage.getItem("number_bank");
  const accountHolder = localStorage.getItem("account_holder");
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
  }, [user, isLoading, , router]);

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
    } else if (selectedSlots.length === 1) {
      setSelectedSlots((prev) => [...prev, index]);
    } else {
      setSelectedSlots([index]); // ถ้าเลือกครบแล้วให้เริ่มใหม่
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
    setSelectedSlots([]);
    setTimeStart("");
    setTimeEnd("");
    setTotalHours(0);
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
          setSelectedSlots([]);
          setPayMethod("");
          setDepositSlip(null);
          setSelectedFacilities([]);
          setTimeStart("");
          setTimeEnd("");
          setTotalHours(0);
          setTotalPrice(0);
          setTotalRemaining(0);
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

  const showPrice = () => {
    // แสดงราคาใน UI
    console.log(price);
    console.log(bookingDateFormatted);
    console.log(`new${newPrice}`);
    console.log(`field_id${field_id}`);
    console.log(facilities);
    console.log(sumFac);
    console.log(`มัดจำ${priceDeposit}`);
    console.log(`${payMethod}`);
    console.log(`${bookingDate}`);
    console.log(`${activity}`);
    console.log(`selectedFacilities${selectedFacilities}`);
    console.log(JSON.stringify(selectedFacilities, null, 2));
    const facilityList = Object.values(selectedFacilities).map((item) => ({
      field_fac_id: item.field_fac_id,
      fac_name: item.fac_name,
    }));

    console.log(facilityList);
  };

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
        <p className="time-info">
          เวลาเปิด: {openHours} - เวลาปิด: {closeHours}
        </p>
        {/* เลือก Add-Ons */}
        <select onChange={handlePriceOnChange} value={selectPrice}>
          {" "}
          {/* ควรเป็น scalar value */}
          <option key="subFieldPrice" value="subFieldPrice">
            ปกติ {price} บาท/ชม.
          </option>
          {addOns.map((addOn) => (
            <option key={addOn.add_on_id} value={addOn.add_on_id}>
              {addOn.content} - {addOn.price} บาท/ชม.
            </option>
          ))}
        </select>

        <div>
          {facilities.map((fac) => (
            <div key={`${fac.field_fac_id}`}>
              <input
                type="checkbox"
                checked={selectedFacilities[fac.field_fac_id] != undefined}
                onChange={() =>
                  handleCheckBox(fac.field_fac_id, fac.fac_price, fac.fac_name)
                }
              />
              <label>
                {fac.fac_name}-{fac.fac_price}
              </label>
            </div>
          ))}
        </div>
        {/* <p>ราคา: {price} บาท</p> */}

        <p>
          {totalHours}*{newPrice}
        </p>
      </div>
      <h1 className="header">เวลาทำการ</h1>
      <h2 className="sub-header">เลือกช่วงเวลาจอง:</h2>
      <div className="container-bookings">
        {message && (
          <div className={`message-box ${messageType}`}>
            <p>{message}</p>
          </div>
        )}

        {slots.length === 0 ? (
          <p>กำลังโหลด...</p>
        ) : (
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
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatibus dolor iusto corporis perferendis debitis aperiam fugiat tempora asperiores! Amet error sint earum eos eum, libero voluptate minima aliquam? Dolorum pariatur aliquam beatae adipisci iusto eligendi optio nisi ex quasi consequatur, itaque expedita sed possimus earum soluta est dolore necessitatibus distinctio veritatis vel perspiciatis. Qui vero itaque eum natus ratione minima corporis doloremque eligendi, quam aspernatur dolorum numquam! Inventore minima tempore repudiandae quisquam consectetur? Provident nisi dolor incidunt ullam neque pariatur saepe soluta optio ut quos voluptatum asperiores ipsam, perspiciatis autem dolore dolores nostrum ipsum? Modi rem sed maiores laboriosam veniam magnam non exercitationem explicabo ipsa omnis deserunt dolorum accusantium optio ad minus ipsum nesciunt delectus officiis at, laudantium animi fuga placeat! Eum laboriosam molestias, perspiciatis a pariatur doloribus, ea nostrum odio, iste laudantium id aperiam hic excepturi dolor. Suscipit repudiandae cumque, consectetur ex quae ea dicta eos nobis sunt explicabo perferendis quisquam corrupti sapiente ab aperiam laborum eveniet, illo error praesentium nemo officiis. Ut modi suscipit voluptate consectetur doloremque minima iste expedita reiciendis fuga? Voluptatem odio illo, harum necessitatibus quis, enim earum cum nobis minima perspiciatis similique, commodi recusandae architecto praesentium nesciunt modi! Cupiditate reiciendis perferendis nemo cumque repellat culpa fugit, numquam repudiandae officiis soluta neque nostrum deserunt labore asperiores delectus, velit nihil ducimus architecto. Veritatis at maxime porro placeat facere magnam soluta vero. Temporibus eos molestias excepturi sequi quaerat corrupti hic vero repellendus provident praesentium tempore quam labore itaque impedit delectus, placeat non voluptatem quae. Eligendi quibusdam, corporis possimus quod rem amet magni ipsam est, fuga ex sint, laborum totam perferendis magnam delectus tempora quaerat assumenda voluptatum consectetur ratione eveniet beatae? Doloribus culpa saepe ex magnam hic libero, sapiente id quaerat suscipit? Odit odio recusandae cumque dolore voluptatibus quae mollitia voluptates deleniti asperiores! Obcaecati accusantium, modi dolor quod adipisci libero excepturi pariatur sed veritatis architecto nesciunt? Cum necessitatibus tenetur ex voluptas sapiente, numquam quas in dolorum, iusto accusamus, quaerat corrupti at cupiditate voluptatem nobis architecto. Voluptatibus iusto labore debitis ea libero distinctio ullam ducimus perferendis quae eaque consequuntur a officia eius ipsam laborum incidunt, placeat porro repudiandae quasi totam deserunt, id quidem, sunt exercitationem? Nisi, aspernatur reprehenderit? Laborum dicta accusantium, mollitia obcaecati illo consectetur eaque totam, aliquam voluptates molestiae odit unde, suscipit facere sequi omnis adipisci perferendis ad laudantium quae repudiandae ipsa cumque. Est corrupti quo dolorem cum rem nesciunt repellat pariatur accusamus, molestiae deserunt nisi dolores molestias. Maiores quod fuga quisquam sunt qui. Illo ipsa, exercitationem debitis architecto inventore eligendi. Ullam temporibus voluptates aspernatur autem dignissimos! Culpa numquam inventore ut repellendus atque eligendi explicabo possimus voluptatem quis sit fugiat, minima laborum. Animi, autem pariatur nihil maiores aliquam fugiat, odio fuga, sapiente ut aspernatur ipsam accusantium corrupti omnis? Qui, molestias. Molestias id consequatur culpa ipsum, accusantium nihil adipisci magni quo iusto, officiis aliquid tenetur excepturi ducimus saepe! Eveniet laboriosam odit totam obcaecati illo dolores, animi debitis eligendi eos veniam! Id accusantium earum nesciunt. Nisi nobis, magni consectetur, a culpa at odit placeat sequi quos suscipit, ex illum magnam fugiat tenetur. Asperiores est molestiae temporibus, quis omnis magnam deserunt rem unde quaerat, aperiam saepe eaque voluptatum hic beatae. Ab repellendus necessitatibus assumenda magnam doloremque veritatis fuga illum, officiis itaque maxime asperiores quaerat architecto cumque placeat reprehenderit similique fugit maiores rerum velit unde libero! Delectus expedita beatae harum nulla cupiditate commodi eius nihil porro id vel, obcaecati soluta asperiores sapiente dicta odit corporis, nesciunt, modi vero quo vitae unde fugiat exercitationem. Animi modi, accusantium magni quibusdam nobis eveniet aliquam itaque suscipit minima fugiat aspernatur assumenda recusandae consectetur tempora saepe nostrum neque laudantium ullam? Voluptate sapiente perspiciatis facilis ducimus architecto dolores voluptas qui, similique officiis consectetur consequatur dicta voluptates. Ex blanditiis et repudiandae voluptatem repellendus nostrum officia reprehenderit vel quis reiciendis facere ut delectus debitis tenetur ipsum laborum veniam ullam harum animi optio minima, nulla accusamus dolores quas. Veritatis doloremque sapiente facilis accusamus velit et, sequi voluptatem quos veniam, laudantium necessitatibus ut vero inventore molestias mollitia labore facere aspernatur quasi nesciunt rerum eos? Dolores in nisi ea, laudantium aspernatur rerum explicabo fugit voluptate voluptatibus deserunt sapiente obcaecati minima. Recusandae modi distinctio quibusdam ad labore in voluptate fugit? Repudiandae iste fugit, cupiditate magni ratione ipsam vero eaque explicabo necessitatibus asperiores voluptate eum, officiis nulla rerum. Labore veritatis pariatur saepe ducimus, eaque accusantium atque delectus aut excepturi veniam mollitia similique sequi est culpa fuga repudiandae earum nihil ipsa magni ullam doloremque quae nulla beatae quasi. Officiis tempora provident modi rem, laborum pariatur, commodi consequuntur cumque quam, et voluptates laboriosam odio labore sed quae vero tenetur alias saepe beatae ut iusto maxime maiores culpa! In unde dolor reprehenderit doloremque iste quo, voluptatum laboriosam esse ex nobis quidem, sapiente, consequatur molestiae possimus. Sit dolorum natus explicabo est omnis accusantium veritatis harum voluptas ducimus nihil deserunt veniam repudiandae, nisi, soluta fugit. Impedit at ex dolorum velit, praesentium nulla corrupti! Unde, consequatur quasi quos quae, accusantium aperiam minima in, nisi tenetur mollitia cumque vero? Quis excepturi exercitationem id, quaerat modi rerum quasi. Repellat velit distinctio sequi quia fugiat laborum quis repellendus sunt nulla soluta dolorem, recusandae impedit voluptas minus! Vero quia enim omnis aliquam atque est, nobis, quod maxime sapiente sint nisi vel officia itaque fugiat, cum quasi libero at autem ullam maiores iste. Quas laboriosam et delectus minus optio, tenetur voluptates ex cupiditate inventore corporis ducimus qui, earum illo, laudantium eos. Atque excepturi quod, iure harum repellendus ducimus ad officiis perspiciatis necessitatibus nobis veritatis quam sequi soluta deleniti ea itaque hic sunt omnis delectus, rerum id beatae! Architecto molestiae aspernatur ullam temporibus neque quisquam ex! Itaque delectus blanditiis animi, enim rem aspernatur, assumenda minima ullam, molestiae neque voluptatibus est tempora? Eum a debitis temporibus doloremque omnis quae sit, voluptatum fugiat accusamus perferendis odio aspernatur maxime soluta excepturi quasi. Accusamus iusto inventore, omnis accusantium, iure quis quaerat ratione harum officia rerum aperiam dolore odit ab cum earum, quas exercitationem nostrum corporis minus fugit. Numquam dolorem quas omnis quibusdam esse reiciendis expedita alias architecto atque amet magni velit sequi culpa animi cumque autem odio et molestias, dignissimos ducimus consequatur!
          </div>
        )}
        <div className="book-sider">
          <div>
            <p>เวลาเริ่ม: {timeStart || "-"}</p>
            <p>เวลาสิ้นสุด: {timeEnd || "-"}</p>
            <p>รวมเวลา: {totalHours ? `${totalHours} ชั่วโมง` : "-"}</p>
          </div>

          <button onClick={resetSelection}>รีเซ็ตการเลือก</button>
          <p>ราคารวม: {totalPrice} บาท</p>
          <p>{`มัดจำที่ต้องจ่ายก่อน${priceDeposit}`}</p>
          <p>{`คงเหลือ${totalRemaining}`}</p>

          <button onClick={showPrice}>showprice</button>
          <p>
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
          </p>

          <div>
            <p>
              <label>บัญชีจำสำหรับโอนมัดจำ</label>
            </p>
            <p>ธนาคาร: {nameBank}</p>
            <p>
              <label>บัญชีเจ้าของบัญชี</label> : {accountHolder}{" "}
            </p>
            <p>
              <label>เลขบัญชี</label> : {numberBank}{" "}
            </p>
            <input type="file" onChange={handleimgChange} accept="image/*" />
            {imgPreview && imgPreview !== "" && (
              <div className="preview-container">
                <p>ตัวอย่างรูป:</p>
                <img src={imgPreview} alt="Preview" />
              </div>
            )}
          </div>

          <button onClick={handleSubmit}>ยืนยันจอง</button>
        </div>
      </div>
    </div>
  );
}
