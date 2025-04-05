"use client";
import React, { useState, useEffect } from "react";
import "@/app/css/registerFieldForm.css";
// import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";

export default function RegisterFieldForm() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter("");
  const [sports, setSports] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState({});
  const [subFields, setSubFields] = useState([]);
  const [newFacility, setNewFacility] = useState("");
  const [showNewFacilityInput, setShowNewFacilityInput] = useState(false);
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)

  const [fieldData, setFieldData] = useState({
    field_name: "",
    address: "",
    gps_location: "",
    documents: null,
    open_hours: "",
    close_hours: "",
    img_field: null,
    preview_img: null,
    number_bank: "",
    account_holder: "",
    price_deposit: "",
    name_bank: "",
    selectedSport: "",
    depositChecked: false,
    open_days: [], // เพิ่ม open_days
    field_description: "", // Include description
  });

  //  โหลดประเภทกีฬา
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/sports_types`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setSports(data))
      .catch((error) => console.error("Error fetching sports:", error));
  }, []);

  //  โหลดสิ่งอำนวยความสะดวก
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/facilities`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setFacilities(data))
      .catch((error) => console.error("Error fetching facilities:", error));
  }, []);

  const handleFieldChange = (e) => {
    setFieldData({ ...fieldData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    const { checked } = e.target;
    setFieldData({
      ...fieldData,
      depositChecked: checked, // อัปเดตค่าของ checkbox
      price_deposit: checked ? fieldData.price_deposit : "0", // กำหนดให้เป็น 0 ถ้าไม่ติ๊ก
    });
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    // ตรวจสอบว่าเป็นค่าบวกหรือลบ
    if (value !== "" && parseFloat(value) < 0) {
      return; // ถ้าค่าติดลบจะไม่ให้กรอก
    }

    setFieldData({
      ...fieldData,
      price_deposit: value, // อัปเดตค่ามัดจำเมื่อกรอก
    });
  };

  useEffect(() => {
    // เมื่อเริ่มต้นถ้าไม่ติ๊ก depositChecked จะให้ price_deposit เป็น "0"
    if (!fieldData.depositChecked && fieldData.price_deposit === "") {
      setFieldData((prevState) => ({
        ...prevState,
        price_deposit: "0", // กำหนดค่ามัดจำเป็น 0
      }));
    }
  }, [fieldData.depositChecked]); // ตรวจสอบเมื่อ depositChecked เปลี่ยนแปลง

  // ฟังก์ชันจัดการอัปโหลดรูป และแสดงตัวอย่าง
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const handleimgChange = (e) => {
    const file = e.target.files[0];
    if (file.size > MAX_FILE_SIZE) {
      setMessage("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)");
      setMessageType("error-message");
      e.target.value = null;
      return;
    } // ดึงไฟล์รูปจาก input
    if (file) {
      // ตรวจสอบว่าไฟล์ที่เลือกเป็นรูปภาพหรือไม่
      if (file.type.startsWith("image/")) {
        setFieldData({
          ...fieldData,
          img_field: file, // เก็บไฟล์รูปภาพ
          imgPreview: URL.createObjectURL(file), // สร้าง URL เพื่อแสดงรูป
        });
      } else {
        e.target.value = null;
        setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพเท่านั้น");
        setMessageType("error-message");
      }
    }
  };

  const MAX_FILES = 10; // Limit to 10 files
  const handleFileChange = (e) => {
    const files = e.target.files;
    let isValid = true;

    if (files.length > MAX_FILES) {
      setMessage(`คุณสามารถอัพโหลดได้สูงสุด ${MAX_FILES} ไฟล์`);
      setMessageType("error-message");
      e.target.value = null; // Reset the input value
      return;
    }
    // ตรวจสอบไฟล์ทั้งหมดที่เลือก
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type;

      if (file.size > MAX_FILE_SIZE) {
        isValid = false;
        setMessage("ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)");
        setMessageType("error-message");
        e.target.value = null; // รีเซ็ตไฟล์เมื่อขนาดไฟล์เกิน
        break;
      }

      // ตรวจสอบว่าเป็นไฟล์รูปภาพหรือ PDF
      if (!fileType.startsWith("image/") && fileType !== "application/pdf") {
        isValid = false;
        setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพหรือ PDF เท่านั้น");
        setMessageType("error-message");
        break;
      }
    }

    if (isValid) {
      // เก็บไฟล์ที่ถูกต้อง
      setFieldData({ ...fieldData, documents: files });
    } else {
      // ล้างไฟล์ที่ไม่ถูกต้อง
      e.target.value = null;
    }
  };

  //  ฟังก์ชันเลือก Checkbox สิ่งอำนวยความสะดวก
  const handleFacilityChange = (facId) => {
    setSelectedFacilities((prev) => {
      const updatedFacilities = { ...prev };
      if (updatedFacilities[facId] !== undefined) {
        delete updatedFacilities[facId];
      } else {
        updatedFacilities[facId] = "";
      }
      return updatedFacilities;
    });
  };

  //  ฟังก์ชันอัปเดตราคาสิ่งอำนวยความสะดวก
  const handleFacilityPriceChange = (facId, price) => {
    setSelectedFacilities((prev) => ({
      ...prev,
      [facId]: price,
    }));
  };

  //  ฟังก์ชันเพิ่มสิ่งอำนวยความสะดวกใหม่
  const addNewFacility = async () => {
    if (!newFacility.trim()) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/facilities/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      Authorization: `Bearer ${token}`,
      body: JSON.stringify({ fac_name: newFacility }),
    });

    const data = await res.json();
    if (data.error) {
      console.error("Error:", data.error);
      return;
    }

    setFacilities([...facilities, data]);
    setNewFacility("");
    setShowNewFacilityInput(false);
  };

  //  เพิ่มสนามย่อย (มี addOns ในตัวเอง)
  const addSubField = () => {
    //  ดึง user_id จาก localStorage
    const storedUser = localStorage.getItem("user");
    const userData = storedUser ? JSON.parse(storedUser) : null;
    const userId = userData ? userData.user_id : null; // ดึง user_id

    setSubFields([
      ...subFields,
      { name: "", price: "", sport_id: "", user_id: userId, addOns: [] },
    ]);
  };

  //  ลบสนามย่อย (รวมถึง Add-ons ที่อยู่ภายใน)
  const removeSubField = (index) => {
    setSubFields(subFields.filter((_, i) => i !== index));
  };

  //  อัปเดตข้อมูลสนามย่อย
  const updateSubField = (index, key, value) => {
    const updatedSubFields = [...subFields];
    updatedSubFields[index][key] = value;
    setSubFields(updatedSubFields);
  };

  const addAddOn = (subIndex) => {
    const updatedSubFields = [...subFields];
    updatedSubFields[subIndex].addOns.push({ content: "", price: "" });
    setSubFields(updatedSubFields);
  };

  //  อัปเดตค่า Add-on
  const updateAddOn = (subIndex, addOnIndex, key, value) => {
    const updatedSubFields = [...subFields];
    updatedSubFields[subIndex].addOns[addOnIndex][key] = value;
    setSubFields(updatedSubFields);
  };

  // ลบ Add-on
  const removeAddOn = (subIndex, addOnIndex) => {
    const updatedSubFields = [...subFields];
    updatedSubFields[subIndex].addOns.splice(addOnIndex, 1);
    setSubFields(updatedSubFields);
  };

  const handleAccountTypeChange = (e) => {
    const value = e.target.value;

    setFieldData({
      ...fieldData,
      account_type: value,
      name_bank: value === "พร้อมเพย์" ? "พร้อมเพย์" : fieldData.name_bank, // ถ้าเลือกพร้อมเพย์ ให้กำหนด name_bank เป็น "พร้อมเพย์"
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setMessage("กรุณาเข้าสู่ระบบก่อน!");
      setMessageType("error-message");
      return;
    }

    const userData = JSON.parse(storedUser);
    const userId = userData.user_id; // ดึง user_id ตอน Submit

    // ตรวจสอบข้อมูลที่กรอกให้ครบถ้วน
    if (
      !fieldData.field_name ||
      !fieldData.address ||
      !fieldData.gps_location ||
      !fieldData.open_hours ||
      !fieldData.close_hours ||
      !fieldData.number_bank ||
      !fieldData.account_holder ||
      !fieldData.price_deposit ||
      !fieldData.name_bank ||
      !fieldData.field_description
    ) {
      setMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
      setMessageType("error-message");
      return;
    }

    if (fieldData.open_days.length === 0) {
      setMessage("กรุณาเลือกวันเปิดบริการ");
      setMessageType("error-message");
      return;
    }

    for (let sub of subFields) {
      if (!sub.name || !sub.price || !sub.sport_id) {
        setMessage("กรุณากรอกข้อมูลให้ครบถ้วนสำหรับสนามย่อยทุกสนาม");
        setMessageType("error-message");
        return;
      }
    }

    // ถ้าเลือกเอกสารหรือรูปภาพไม่ได้
    if (!fieldData.documents || !fieldData.img_field) {
      setMessage("กรุณาเลือกเอกสารและรูปโปรไฟล์สนาม");
      setMessageType("error-message");
      return;
    }
    const selectedFacs = Object.keys(selectedFacilities); // ประกาศตัวแปร selectedFacs
    if (selectedFacs.length === 0) {
      setMessage("กรุณาเลือกสิ่งอำนวยความสะดวก");
      setMessageType("error-message");
      return;
    }
    for (const facId of selectedFacs) {
      if (selectedFacilities[facId] === "") {
        setMessage(`กรุณากรอกราคาสำหรับสิ่งอำนวยความสะดวก`);
        setMessageType("error-message");
        return;
      }
    }

    const formData = new FormData();
    if (fieldData.documents && fieldData.documents.length > 0) {
      for (let i = 0; i < fieldData.documents.length; i++) {
        formData.append("documents", fieldData.documents[i]);
      }
    }
    formData.append("img_field", fieldData.img_field);
    formData.append(
      "data",
      JSON.stringify({
        user_id: userId,
        field_name: fieldData.field_name,
        address: fieldData.address,
        gps_location: fieldData.gps_location,
        open_hours: fieldData.open_hours,
        close_hours: fieldData.close_hours,
        number_bank: fieldData.number_bank,
        account_holder: fieldData.account_holder,
        price_deposit: fieldData.price_deposit,
        name_bank: fieldData.name_bank,
        status: fieldData.status || "รอตรวจสอบ", // เพิ่มค่า Status
        selectedFacilities,
        subFields: subFields,
        open_days: fieldData.open_days, // เพิ่ม open_days
        field_description: fieldData.field_description, // Include description
      })
    );

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/field/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.error) {
        console.error("Error:", data.error);
        setMessage("เกิดข้อผิดพลาด: " + data.error);
        setMessageType("error-message");
        return;
      }
      setMessage("ลงทะเบียนสนามเรียบร้อยรอผู้ดูแลระบบตรวจสอบ");
      setMessageType("success-message");
      setFieldData({
        field_name: "",
        address: "",
        gps_location: "",
        documents: null,
        open_hours: "",
        close_hours: "",
        img_field: null,
        preview_img: null,
        number_bank: "",
        account_holder: "",
        price_deposit: "",
        name_bank: "",
        selectedSport: "",
        depositChecked: false,
        open_days: [], // ล้าง open_days
        field_description: "", // Include description
      });
      setSubFields([]); // เคลียร์สนามย่อย
      setSelectedFacilities({}); // เคลียร์สิ่งอำนวยความสะดวก
      setTimeout(() => {
        setMessage("");
        router.push("");
      }, 3000);
    } catch (error) {
      console.error("Fetch Error:", error);
      setMessage("เกิดข้อผิดพลาดในการส่งข้อมูล");
      setMessageType("error-message");
    }
  };
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      {/* <div className="navbar">
        <Navbar></Navbar>
      </div> */}
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="contianer">
        <div className="heder">
          <h1>ลงทะเบียนสนามกีฬา</h1>
        </div>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="input-group">
            {" "}
            <label>ชื่อสนามกีฬา:</label>
            <input
              type="text"
              name="field_name"
              placeholder="ชื่อสนามของคุณ"
              value={fieldData.field_name}
              onChange={handleFieldChange}
            />
          </div>
          <div className="input-group">
            <label>ที่ตั้งสนาม:</label>
            <input
              type="text"
              name="address"
              placeholder="ที่อยู่สนามของคุณ"
              value={fieldData.address}
              onChange={handleFieldChange}
            />
          </div>
          <div className="input-group">
            <label>ตำแหน่งพิกัด GPS:</label>
            <input
              type="text"
              name="gps_location"
              placeholder="ที่อยู่ใน Map"
              value={fieldData.gps_location}
              onChange={handleFieldChange}
            />
          </div>

          <div className="datetimecon">
            <div className="time">
              <div className="input-group">
                <label>เวลาเปิด:</label>
                <input
                  type="time"
                  name="open_hours"
                  value={fieldData.open_hours}
                  onChange={handleFieldChange}
                />
              </div>

              <div className="input-group">
                <label>เวลาปิด:</label>
                <input
                  type="time"
                  name="close_hours"
                  value={fieldData.close_hours}
                  onChange={handleFieldChange}
                />
              </div>
            </div>
            <div className="open-days-container">
              <div className="input-group">
                <label style={{ textAlign: "center" }}>
                  เลือกวันเปิดบริการ:
                </label>
              </div>
              <div className="time-selection">
                <div className="input-group-checkbox">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day, index) => (
                      <label key={index} className="checkbox-label">
                        <input
                          type="checkbox"
                          name="open_days"
                          value={day}
                          onChange={(e) => {
                            const { value, checked } = e.target;
                            setFieldData((prevData) => {
                              const openDays = new Set(prevData.open_days);
                              if (checked) {
                                openDays.add(value);
                              } else {
                                openDays.delete(value);
                              }
                              return {
                                ...prevData,
                                open_days: Array.from(openDays),
                              };
                            });
                          }}
                        />
                        {day}
                      </label>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="subfieldcon">
            {subFields.map((sub, subIndex) => (
              <div key={subIndex}>
                {/* ✅ Input กรอกชื่อสนามย่อย */}
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="ชื่อสนามย่อย (เช่น สนาม 1,2)"
                    value={sub.name}
                    onChange={(e) =>
                      updateSubField(subIndex, "name", e.target.value)
                    }
                  />
                </div>
                {/* ✅ Input กรอกราคา */}
                <div className="input-group">
                  <input
                    type="number"
                    placeholder="ราคา/ชั่วโมง"
                    value={sub.price}
                    onChange={(e) => {
                      const value = Math.abs(e.target.value);
                      updateSubField(subIndex, "price", value);
                    }}
                  />
                </div>

                {/* ✅ Dropdown เลือกประเภทกีฬา */}
                <div className="input-group">
                  <select
                    value={sub.sport_id}
                    onChange={(e) =>
                      updateSubField(subIndex, "sport_id", e.target.value)
                    }
                  >
                    <option value="">เลือกประเภทกีฬา</option>
                    {sports.map((sport) => (
                      <option key={sport.sport_id} value={sport.sport_id}>
                        {sport.sport_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ✅ ปุ่มเพิ่มกิจกรรมเพิ่มเติม (เฉพาะสนามนี้) */}
                <button
                  className="addbtn"
                  type="button"
                  onClick={() => addAddOn(subIndex)}
                >
                  เพิ่มกิจกรรมเพิ่มเติม
                </button>

                {/* ✅ ปุ่มลบสนามย่อย */}
                <button
                  className="delbtn"
                  type="button"
                  onClick={() => removeSubField(subIndex)}
                >
                  ลบสนามย่อย
                </button>

                {/* ✅ แสดงรายการกิจกรรมเพิ่มเติมที่อยู่ในสนามนี้ */}
                <div className="addoncon">
                  {sub.addOns.map((addon, addOnIndex) => (
                    <div key={addOnIndex}>
                      {/* ✅ Input กรอกชื่อกิจกรรม */}
                      <div className="input-group">
                        <input
                          type="text"
                          placeholder="ชื่อกิจกรรม เช่น (เช่าสนามเพื่อทำคอนเท้น)"
                          value={addon.content}
                          onChange={(e) =>
                            updateAddOn(
                              subIndex,
                              addOnIndex,
                              "content",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      {/* ✅ Input กรอกราคา */}
                      <div className="input-group">
                        <input
                          type="number"
                          placeholder="ราคา/ชั่วโมง"
                          value={addon.price}
                          onChange={(e) => {
                            const value = Math.abs(e.target.value); // แปลงค่าให้เป็นค่าบวก
                            updateAddOn(subIndex, addOnIndex, "price", value);
                          }}
                        />
                      </div>

                      {/* ✅ ปุ่มลบกิจกรรมเพิ่มเติม */}
                      <button
                        className="delevn"
                        type="button"
                        onClick={() => removeAddOn(subIndex, addOnIndex)}
                      >
                        ลบกิจกรรมเพิ่มเติม
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* ✅ ปุ่มเพิ่มสนามย่อย */}

            <button className="addsubfield" type="button" onClick={addSubField}>
              + เพิ่มสนามย่อย
            </button>
          </div>
          <div className="input-group">
            <label htmlFor="img_field">รูปโปรไฟล์สนาม</label>

            <input type="file" onChange={handleimgChange} accept="image/*" />
          </div>
          {/* ✅ แสดงรูปตัวอย่างถ้ามีการอัปโหลด */}
          {fieldData.imgPreview && (
            <div className="preview-container">
              <p>ตัวอย่างรูป:</p>
              <img src={fieldData.imgPreview} alt="Preview" />
            </div>
          )}

          <div className="input-group">
            <label htmlFor="documents">เอกสาร (เพิ่มได้สูงสุด 10 ไฟล์)</label>
            <input
              type="file"
              onChange={handleFileChange} // ใช้ฟังก์ชันที่กำหนดไว้
              accept="image/*,.pdf"
              multiple
            />
          </div>

          <div className="input-group">
            <label htmlFor="account-type">เลือกประเภทบัญชี</label>
            <select
              name="account_type" // เปลี่ยนชื่อ name เพื่อไม่ให้ชนกับ input
              value={fieldData.account_type}
              onChange={handleAccountTypeChange} // ใช้ handleAccountTypeChange ในการจัดการการเปลี่ยนประเภทบัญชี
            >
              <option value="">กรุณาเลือกบัญชี</option>
              <option value="ธนาคาร">ธนาคาร</option>
              <option value="พร้อมเพย์">พร้อมเพย์</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="number_bank">เลขบัญชีธนาคาร / พร้อมเพย์</label>
            <input
              type="number"
              name="number_bank"
              placeholder="เลขบัญชี 12 หลัก พร้อมเพย์ 10 หรือ 13 หลักเท่านั้น"
              value={fieldData.number_bank}
              onChange={(e) => {
                const value = e.target.value;
                const isPromptPay = fieldData.account_type === "พร้อมเพย์"; // ตรวจสอบประเภทบัญชีที่เลือก

                // ✅ อนุญาตเฉพาะตัวเลข
                if (/^\d*$/.test(value)) {
                  // ✅ ตรวจสอบจำนวนหลัก
                  if (
                    (isPromptPay && value.length <= 13) || // พร้อมเพย์ 10 หรือ 13 หลัก
                    (!isPromptPay && value.length <= 12) // ธนาคาร 12 หลัก
                  ) {
                    setFieldData({ ...fieldData, number_bank: value });
                  }
                }
              }}
              onBlur={() => {
                const isPromptPay = fieldData.account_type === "พร้อมเพย์"; // ตรวจสอบประเภทบัญชีที่เลือก
                const length = fieldData.number_bank.length;

                // ✅ ตรวจสอบความถูกต้องของเลขที่กรอก
                if (
                  (!isPromptPay && length !== 12) || // ถ้าเป็นบัญชีธนาคารต้อง 12 หลัก
                  (isPromptPay && length !== 10 && length !== 13) // ถ้าเป็นพร้อมเพย์ต้อง 10 หรือ 13 หลัก
                ) {
                  setMessage(
                    "เลขที่กรอกไม่ถูกต้อง ถ้าเป็นบัญชีธนาคารต้อง 12 หลัก ถ้าเป็นพร้อมเพย์ต้อง 10 หรือ 13 หลัก"
                  );
                  setMessageType("error-message");
                  setFieldData({ ...fieldData, number_bank: "" }); // เคลียร์ค่า
                }
              }}
              maxLength={13} // ✅ จำกัดสูงสุดที่ 13 หลัก
            />
          </div>

          {/* กรอกชื่อธนาคาร */}
          {fieldData.account_type === "ธนาคาร" && (
            <div className="input-group">
              <label htmlFor="bank">ชื่อธนาคาร</label>
              <input
                type="text"
                name="name_bank"
                placeholder="ชื่อธนาคาร"
                value={fieldData.name_bank}
                onChange={handleFieldChange}
              />
            </div>
          )}

          {/* ไม่ให้กรอกชื่อธนาคารเมื่อเลือก "พร้อมเพย์" */}
          {fieldData.account_type === "พร้อมเพย์" && (
            <div className="input-group">
              <label htmlFor="bank">ชื่อธนาคาร</label>
              <input
                type="text"
                name="name_bank"
                value="พร้อมเพย์" // ตั้งค่าเป็น "พร้อมเพย์" โดยอัตโนมัติ
                disabled // ไม่สามารถกรอกได้
              />
            </div>
          )}

          <div className="input-group">
            <label htmlFor="bank">ชื่อเจ้าของบัญชีธนาคาร</label>
            <input
              type="text"
              name="account_holder"
              placeholder="ชื่อเจ้าของบัญชี"
              value={fieldData.account_holder}
              onChange={handleFieldChange}
            />
          </div>
          <div>
            <div className="input-group">
              <label>ค่ามัดจำ</label>
            </div>
            <div className="depositcon">
              <div className="input-group-checkbox">
                <input
                  type="checkbox"
                  checked={fieldData.depositChecked}
                  onChange={handleCheckboxChange}
                />
                <div className="input-group-deposit">
                  <label>เก็บค่ามัดจำ</label>
                </div>
              </div>
              {fieldData.depositChecked && (
                <div className="input-group">
                  <input
                    type="number"
                    name="price_deposit"
                    placeholder="กำหนดค่ามัดจำ"
                    value={fieldData.price_deposit || "0"} // ตรวจสอบให้ค่ามีค่าเริ่มต้น
                    onChange={handlePriceChange} // อัปเดตค่ามัดจำเมื่อกรอก
                    onKeyDown={(e) => {
                      if (e.key === "-") {
                        e.preventDefault(); // ป้องกันการกรอกเครื่องหมายลบ
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="input-group">
            <label>สิ่งอำนวยความสะดวก</label>
          </div>
          <div className="factcon">
            {facilities.map((fac) => (
              <div key={fac.fac_id} className="facility-item">
                {/* Checkbox เลือกสิ่งอำนวยความสะดวก */}
                <div className="input-group-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedFacilities[fac.fac_id] !== undefined}
                    onChange={() => handleFacilityChange(fac.fac_id)}
                  />
                  <label>{fac.fac_name}</label>
                </div>

                {/* ป้อนราคาเมื่อเลือกสิ่งอำนวยความสะดวก */}
                {selectedFacilities[fac.fac_id] !== undefined && (
                  <div className="input-group">
                    <div className="input-group-checkbox">
                      <input
                        type="number"
                        placeholder="กำหนดราคา ถ้าไม่มีใส่ '0'"
                        value={selectedFacilities[fac.fac_id] || ""} // ตรวจสอบให้แน่ใจว่าไม่เป็น undefined หรือ null
                        onChange={(e) => {
                          // รับค่าที่กรอกจากผู้ใช้
                          let value = e.target.value;

                          // ตรวจสอบว่าเป็นตัวเลขและเป็นค่าบวกหรือ 0
                          if (value === "" || parseFloat(value) >= 0) {
                            handleFacilityPriceChange(fac.fac_id, value); // ส่งค่าใหม่ที่ผ่านการตรวจสอบ
                          } else {
                            handleFacilityPriceChange(fac.fac_id, 0); // ถ้าค่าติดลบให้เป็น 0
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {!showNewFacilityInput ? (
            <button
              className="addfac"
              type="button"
              onClick={() => setShowNewFacilityInput(true)}
            >
              + เพิ่มสิ่งอำนวยความสะดวกใหม่
            </button>
          ) : (
            <div>
              <input
                type="text"
                placeholder="ชื่อสิ่งอำนวยความสะดวก"
                value={newFacility}
                onChange={(e) => setNewFacility(e.target.value)}
              />
              <button
                className="savebtn"
                type="button"
                onClick={addNewFacility}
              >
                บันทึก
              </button>
              <button
                className="canbtn"
                type="button"
                onClick={() => setShowNewFacilityInput(false)}
              >
                ยกเลิก
              </button>
            </div>
          )}
          <div className="input-group">
            <label>รายละเอียดสนาม</label>
            <div className="textarea">
              <textarea
                name="field_description"
                placeholder="ใส่รายละเอียดสนาม หมายเหตุต่างๆ เช่นสนามหญ้าเทียม 7 คน "
                value={fieldData.field_description}
                onChange={handleFieldChange}
              />
            </div>
          </div>
          <button className="submitbtn" type="submit">
            ยืนยัน
          </button>
        </form>
      </div>
    </>
  );
}
