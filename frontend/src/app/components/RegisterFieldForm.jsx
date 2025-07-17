"use client";
import React, { useState, useEffect } from "react";
import "@/app/css/register-field-form.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

export default function RegisterFieldForm() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter("");
  const [sports, setSports] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState({});
  const [subFields, setSubFields] = useState([]);
  const [newFacility, setNewFacility] = useState("");
  const [showNewFacilityInput, setShowNewFacilityInput] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const { user, isLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
    }
    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }
  }, [user, isLoading, router]);

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
    cancel_hours: 0,
  });

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const token = localStorage.getItem("auth_mobile_token");
        const res = await fetch(`${API_URL}/sports_types`, {
          credentials: "include",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json();

        if (res.ok) {
          setSports(data);
        } else {
          console.error("โหลดไม่สำเร็จ:", data.error);
          setMessage("ไม่สามารถโหลดข้อมูลกีฬาได้");
          setMessageType("error");
        }
      } catch (error) {
        console.error("เชื่อมต่อกับเซิร์ฟเวอร์ไม่ได้:", error);
        setMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchSports();
  }, []);

  //  โหลดสิ่งอำนวยความสะดวก
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const token = localStorage.getItem("auth_mobile_token");

        const res = await fetch(`${API_URL}/facilities`, {
          credentials: "include",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json();

        if (res.ok) {
          setFacilities(data);
        } else {
          console.error(
            "โหลดไม่สำเร็จ:",
            data.error || "ไม่สามารถโหลดข้อมูลได้"
          );
          setMessage(data.error || "ไม่สามารถโหลดข้อมูลได้");
          setMessageType("error");
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาด:", error);
        setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchFacilities();
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
    let value = e.target.value;

    // ลบทุกอักขระที่ไม่ใช่ตัวเลข
    value = value.replace(/\D/g, "");

    // ตรวจสอบว่ามีเกิน 4 หลักไหม
    if (value.length >= 7) {
      setMessage("ใส่ได้ไม่เกิน 6 หลัก");
      setMessageType("error");
      return;
    }

    setFieldData({
      ...fieldData,
      price_deposit: value,
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
      setMessageType("error");
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
        setMessageType("error");
      }
    }
  };

  const MAX_FILES = 10; // Limit to 10 files
  const handleFileChange = (e) => {
    const files = e.target.files;
    let isValid = true;

    if (files.length > MAX_FILES) {
      setMessage(`คุณสามารถอัพโหลดได้สูงสุด ${MAX_FILES} ไฟล์`);
      setMessageType("error");
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
        setMessageType("error");
        e.target.value = null; // รีเซ็ตไฟล์เมื่อขนาดไฟล์เกิน
        break;
      }

      // ตรวจสอบว่าเป็นไฟล์รูปภาพหรือ PDF
      if (!fileType.startsWith("image/") && fileType !== "application/pdf") {
        isValid = false;
        setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพหรือ PDF เท่านั้น");
        setMessageType("error");
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
    if (!newFacility.trim()) {
      setMessage("กรุณากรอกชื่อสิ่งอำนวยความสะดวก");
      setMessageType("error");
      return;
    }
    const token = localStorage.getItem("auth_mobile_token");
    try {
      SetstartProcessLoad(true);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const res = await fetch(`${API_URL}/facilities/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ fac_name: newFacility }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error("Error:", data.error);
        setMessage(data.error || "สิ่งอำนวยความสะดวกนี้มีอยู่แล้ว");
        setMessageType("error");
        return;
      }

      setFacilities([...facilities, data]);
      setNewFacility("");
      setShowNewFacilityInput(false);
      setMessage("เพิ่มสิ่งอำนวยความสะดวกสำเร็จ");
      setMessageType("success");
    } catch (error) {
      console.error("เกิดข้อผิดพลาด:", error);
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  //  เพิ่มสนามย่อย (มี addOns ในตัวเอง)
  const addSubField = () => {
    setSubFields([
      ...subFields,
      {
        name: "",
        price: "",
        sport_id: "",
        user_id: user.user_id,
        addOns: [],
        wid_field: "",
        length_field: "",
        players_per_team: "",
        field_surface: "",
      },
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

    if (!user) {
      setMessage("กรุณาเข้าสู่ระบบก่อน!");
      setMessageType("error");
      return;
    }

    const userId = user.user_id;

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
      setMessageType("error");
      return;
    }

    if (fieldData.open_days.length === 0) {
      setMessage("กรุณาเลือกวันเปิดบริการ");
      setMessageType("error");
      return;
    }

    for (let sub of subFields) {
      if (
        !sub.name ||
        // !sub.price ||
        !sub.sport_id ||
        !sub.players_per_team ||
        !sub.wid_field ||
        !sub.length_field ||
        !sub.field_surface
      ) {
        setMessage("กรุณากรอกข้อมูลให้ครบถ้วนสำหรับสนามย่อยทุกสนาม");
        setMessageType("error");
        return;
      }
    }

    // ถ้าเลือกเอกสารหรือรูปภาพไม่ได้
    if (!fieldData.documents || !fieldData.img_field) {
      setMessage("กรุณาเลือกเอกสารและรูปโปรไฟล์สนาม");
      setMessageType("error");
      return;
    }
    const selectedFacs = Object.keys(selectedFacilities); // ประกาศตัวแปร selectedFacs
    if (selectedFacs.length === 0) {
      setMessage("กรุณาเลือกสิ่งอำนวยความสะดวก");
      setMessageType("error");
      return;
    }
    for (const facId of selectedFacs) {
      if (selectedFacilities[facId] === "") {
        setMessage(`กรุณากรอกราคาสำหรับสิ่งอำนวยความสะดวก`);
        setMessageType("error");
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
        cancel_hours: fieldData.cancel_hours,
      })
    );
    SetstartProcessLoad(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const token = localStorage.getItem("auth_mobile_token");

      const res = await fetch(`${API_URL}/field/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      if (data.error) {
        console.error("Error:", data.error);
        setMessage("เกิดข้อผิดพลาด: " + data.error);
        setMessageType("error");
        return;
      }
      setMessage("ลงทะเบียนสนามเรียบร้อยรอผู้ดูแลระบบตรวจสอบ");
      setMessageType("success");
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
        cancel_hours: "",
      });
      setSubFields([]); // เคลียร์สนามย่อย
      setSelectedFacilities({}); // เคลียร์สิ่งอำนวยความสะดวก
      setTimeout(() => {
        setMessage("");
        router.replace("");
      }, 3000);
    } catch (error) {
      console.error("Fetch Error:", error);
      setMessage("เกิดข้อผิดพลาดในการส่งข้อมูล");
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  if (dataLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="field-register-contianer">
        <div className="heder">
          <h1 className="field-register">ลงทะเบียนสนามกีฬา</h1>
        </div>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="input-group-register-field">
            {" "}
            <label>ชื่อสนามกีฬา:</label>
            <input
              type="text"
              maxLength={100}
              name="field_name"
              placeholder="ชื่อสนามของคุณ"
              value={fieldData.field_name}
              onChange={handleFieldChange}
            />
          </div>
          <div className="input-group-register-field">
            <label>ที่ตั้งสนาม:</label>
            <input
              type="text"
              maxLength={100}
              name="address"
              placeholder="ที่อยู่สนามของคุณ"
              value={fieldData.address}
              onChange={handleFieldChange}
            />
          </div>
          <div className="input-group-register-field">
            <label>พิกัด GPS:(เช่น16.05xxxxx, 103.65xxxxx)</label>{" "}
            <div className="exapmle-gps">
              <a
                href="https://support.google.com/maps/answer/18539?hl=th&co=GENIE.Platform%3DiOS&oco=0/"
                target="_blank"
                rel="noopener noreferrer"
              >
                วิธีเอาละติจูดและลองจิจูดใน Google Maps
              </a>
              <br />
              <a
                href="https://maps.google.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Maps
              </a>
            </div>
            <input
              type="text"
              maxLength={100}
              name="gps_location"
              placeholder="พิกัด"
              value={fieldData.gps_location}
              onChange={handleFieldChange}
            />
          </div>

          <div className="datetimecon">
            <div className="time">
              <div className="input-group-register-field">
                <label>เวลาเปิด:</label>
                <input
                  type="time"
                  name="open_hours"
                  value={fieldData.open_hours}
                  onChange={handleFieldChange}
                />
              </div>

              <div className="input-group-register-field">
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
              <div className="input-group-register-field">
                <label style={{ textAlign: "center" }}>
                  เลือกวันเปิดบริการ:
                </label>
              </div>
              <div className="time-selection">
                <div className="input-group-checkbox-register-field">
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
          <div className="input-group-register-field">
            <label>ยกเลิกการจองได้ภายใน (ชั่วโมง)</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              name="cancel_hours"
              placeholder="เช่น 2 = ยกเลิกได้ก่อน 2 ชม."
              value={fieldData.cancel_hours}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, ""); // เอาเฉพาะตัวเลข
                if (value > 24) {
                  setMessage("ใส่ไม่เกินไม่เกิน 24 ชั่วโมง ");
                  setMessageType("error");
                  return;
                }
                setFieldData({
                  ...fieldData,
                  cancel_hours: isNaN(value) ? 0 : value,
                });
              }}
            />
          </div>

          <div className="subfieldcon">
            {subFields.map((sub, subIndex) => (
              <div key={subIndex}>
                {/*Input กรอกชื่อสนามย่อย */}
                <div className="input-group-register-field">
                  <label htmlFor="">ชื่อสนามย่อย</label>
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="สนาม 1,2"
                    value={sub.name}
                    onChange={(e) =>
                      updateSubField(subIndex, "name", e.target.value)
                    }
                  />
                </div>
                {/*Input กรอกราคา */}
                <div className="input-group-register-field">
                  <label htmlFor="">ราคา/ชั่วโมง</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={7}
                    placeholder="500 , 1000"
                    value={sub.price ?? ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value.length > 6) {
                        setMessage("ราคาต้องไม่เกิน 6 หลัก ");
                        setMessageType("error");
                        return;
                      }
                      updateSubField(subIndex, "price", value);
                    }}
                  />
                </div>
                {/*Dropdown เลือกประเภทกีฬา */}
                <div className="input-group-register-field">
                  <label htmlFor="">ประเภทกีฬา</label>

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
                <div className="input-group-register-field">
                  <label htmlFor="">จำนวนผู้เล่นต่อฝั่ง</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    placeholder="5, 7, 11"
                    value={sub.players_per_team ?? ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value > 11) {
                        setMessage("ใส่ได้ไม่เกิน 11 คน ");
                        setMessageType("error");
                        return;
                      }
                      updateSubField(subIndex, "players_per_team", value);
                    }}
                  />{" "}
                </div>
                <div className="input-group-register-field">
                  <label>ความกว้างของสนาม</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    placeholder="(เมตร)"
                    value={sub.wid_field || ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value > 1000) {
                        setMessage("ใส่ได้ไม่เกิน 1000 เมตร");
                        setMessageType("error");
                        return;
                      }
                      updateSubField(subIndex, "wid_field", value);
                    }}
                  />
                </div>
                <div className="input-group-register-field">
                  <label>ความยาวของสนาม</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    placeholder="(เมตร)"
                    value={sub.length_field || ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value > 1000) {
                        setMessage("ใส่ได้ไม่เกิน 1000 เมตร");
                        setMessageType("error");
                        return;
                      }
                      updateSubField(subIndex, "length_field", value);
                    }}
                  />
                </div>
                <div className="input-group-register-field">
                  <label>พื้นสนาม</label>
                  <input
                    maxLength={20}
                    type="text"
                    placeholder="เช่น หญ้าเทียม,หญ้าจริง "
                    value={sub.field_surface}
                    onChange={(e) =>
                      updateSubField(subIndex, "field_surface", e.target.value)
                    }
                  />
                </div>
                {/*ปุ่มเพิ่มกิจกรรมเพิ่มเติม (เฉพาะสนามนี้) */}
                <button
                  className="addbtn-regisfield"
                  type="button"
                  onClick={() => addAddOn(subIndex)}
                >
                  เพิ่มกิจกรรมเพิ่มเติม
                </button>
                {/*ปุ่มลบสนามย่อย */}
                <button
                  className="delbtn-regisfield"
                  type="button"
                  onClick={() => removeSubField(subIndex)}
                >
                  ลบสนามย่อย
                </button>
                {/* แสดงรายการกิจกรรมเพิ่มเติมที่อยู่ในสนามนี้ */}
                <div className="addoncon">
                  {sub.addOns.map((addon, addOnIndex) => (
                    <div key={addOnIndex}>
                      {/* Input กรอกชื่อกิจกรรม */}
                      <div className="input-group-register-field">
                        <input
                          type="text"
                          maxLength={100}
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
                      {/* Input กรอกราคา */}
                      <div className="input-group-register-field">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={7}
                          placeholder="ราคา/ชั่วโมง"
                          value={addon.price || ""}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, "");
                            if (value > 999999) {
                              setMessage("ใส่ได้ไม่เกิน 6 หลัก ");
                              setMessageType("error");
                              return;
                            }
                            updateAddOn(subIndex, addOnIndex, "price", value);
                          }}
                        />
                      </div>

                      {/* ปุ่มลบกิจกรรมเพิ่มเติม */}
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

            {/*ปุ่มเพิ่มสนามย่อย */}
            <button
              className="addsubfield-regisfield"
              type="button"
              onClick={addSubField}
            >
              + เพิ่มสนามย่อย
            </button>
          </div>
          <div className="input-group-register-field">
            <label htmlFor="img_field">รูปโปรไฟล์สนาม</label>

            <input type="file" onChange={handleimgChange} accept="image/*" />
          </div>
          {/*แสดงรูปตัวอย่างถ้ามีการอัปโหลด */}
          {fieldData.imgPreview && (
            <div className="preview-container-regis-field">
              <p>ตัวอย่างรูป:</p>
              <img src={fieldData.imgPreview} alt="Preview" />
            </div>
          )}

          <div className="input-group-register-field">
            <label htmlFor="documents">
              เอกสาร หรือรูป (เพิ่มได้สูงสุด 10 ไฟล์)
            </label>
            <input
              type="file"
              onChange={handleFileChange} // ใช้ฟังก์ชันที่กำหนดไว้
              accept="image/*,.pdf"
              multiple
            />
          </div>

          <div className="input-group-register-field">
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

          <div className="input-group-register-field">
            <label htmlFor="number_bank">เลขบัญชีธนาคาร / พร้อมเพย์</label>
            <input
              type="text"
              maxLength={13} // จำกัดความยาวสูงสุดที่ 13 หลัก
              inputMode="numeric"
              pattern="[0-9]*"
              name="number_bank"
              placeholder="เลขบัญชีและพร้อมเพย์ 10 หลัก หรือ 13 หลัก หลักเท่านั้น"
              value={fieldData.number_bank || ""} // ตรวจสอบให้ค่ามีค่าเริ่มต้น
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // ลบทุกอักขระที่ไม่ใช่ตัวเลข
                setMessage(""); // เคลียร์ข้อความเมื่อเริ่มกรอกใหม่
                const isPromptPay = fieldData.account_type === "พร้อมเพย์"; // ตรวจสอบประเภทบัญชีที่เลือก

                // อนุญาตเฉพาะตัวเลข
                if (/^\d*$/.test(value)) {
                  // ตรวจสอบจำนวนหลัก
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

                // ตรวจสอบความถูกต้องของเลขที่กรอก
                if (
                  (!isPromptPay && length !== 10 && length !== 12) || // ถ้าเป็นบัญชีธนาคารต้อง 12 หลัก
                  (isPromptPay && length !== 10 && length !== 13) // ถ้าเป็นพร้อมเพย์ต้อง 10 หรือ 13 หลัก
                ) {
                  setMessage(
                    "เลขที่กรอกไม่ถูกต้อง เลขบัญชีและพร้อมเพย์ 10 หลัก หรือ 13 หลัก หลักเท่านั้น"
                  );
                  setMessageType("error");
                  setFieldData({ ...fieldData, number_bank: "" }); // เคลียร์ค่า
                }
              }}
            />
          </div>

          {/* กรอกชื่อธนาคาร */}
          {fieldData.account_type === "ธนาคาร" && (
            <div className="input-group-register-field">
              <label htmlFor="bank">ชื่อธนาคาร</label>
              <input
                type="text"
                maxLength={50}
                name="name_bank"
                placeholder="ชื่อธนาคาร"
                value={fieldData.name_bank}
                onChange={handleFieldChange}
              />
            </div>
          )}

          {/* ไม่ให้กรอกชื่อธนาคารเมื่อเลือก "พร้อมเพย์" */}
          {fieldData.account_type === "พร้อมเพย์" && (
            <div className="input-group-register-field">
              <label htmlFor="bank">ชื่อธนาคาร</label>
              <input
                type="text"
                maxLength={50}
                name="name_bank"
                value="พร้อมเพย์"
                disabled
              />
            </div>
          )}

          <div className="input-group-register-field">
            <label htmlFor="bank">ชื่อเจ้าของบัญชีธนาคาร</label>
            <input
              type="text"
              maxLength={50}
              name="account_holder"
              placeholder="ชื่อเจ้าของบัญชี"
              value={fieldData.account_holder}
              onChange={handleFieldChange}
            />
          </div>
          <div>
            <div className="input-group-register-field">
              <label>ค่ามัดจำ</label>
            </div>
            <div className="depositcon-regisfield">
              <div className="input-group-checkbox-register-field">
                <input
                  type="checkbox"
                  checked={fieldData.depositChecked}
                  onChange={handleCheckboxChange}
                />
                <div className="input-group-deposit-regisfield">
                  <label>เก็บค่ามัดจำ</label>
                </div>
              </div>
              {fieldData.depositChecked && (
                <div className="input-group-register-field">
                  <input
                    type="text"
                    name="price_deposit"
                    placeholder="กำหนดค่ามัดจำ"
                    value={fieldData.price_deposit || "0"} // ตรวจสอบให้ค่ามีค่าเริ่มต้น
                    onChange={handlePriceChange} // อัปเดตค่ามัดจำเมื่อกรอก
                    maxLength={7}
                    inputMode="numeric"
                    pattern="[0-9]*"
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
          <div className="input-group-register-field">
            <label>สิ่งอำนวยความสะดวก</label>
          </div>
          <div className="factcon-register-field">
            {facilities.map((fac) => (
              <div key={fac.fac_id} className="facility-item-register-field">
                {/* Checkbox เลือกสิ่งอำนวยความสะดวก */}
                <div className="input-group-checkbox-register-field">
                  <input
                    type="checkbox"
                    checked={selectedFacilities[fac.fac_id] !== undefined}
                    onChange={() => handleFacilityChange(fac.fac_id)}
                  />
                  <label>{fac.fac_name}</label>
                </div>

                {/* ป้อนราคาเมื่อเลือกสิ่งอำนวยความสะดวก */}
                {selectedFacilities[fac.fac_id] !== undefined && (
                  <div className="input-group-register-field">
                    <div className="input-group-checkbox-register-field">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={7}
                        placeholder="กำหนดราคา ถ้าไม่มีใส่ '0'"
                        value={selectedFacilities[fac.fac_id] || ""} // ตรวจสอบให้แน่ใจว่าไม่เป็น undefined หรือ null
                        onChange={(e) => {
                          // รับค่าที่กรอกจากผู้ใช้
                          let value = e.target.value.replace(/\D/g, ""); // เอาเฉพาะตัวเลข
                          if (value > 999999) {
                            setMessage("ใส่ได้ไม่เกิน 6 หลัก ");
                            setMessageType("error");
                            return;
                          }
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
              style={{
                cursor: startProcessLoad ? "not-allowed" : "pointer",
              }}
              disabled={startProcessLoad}
              className="addfac-regisfield"
              type="button"
              onClick={() => setShowNewFacilityInput(true)}
            >
              + เพิ่มสิ่งอำนวยความสะดวก
            </button>
          ) : (
            <div className="input-group-register-field">
              <input
                type="text"
                maxLength={100}
                placeholder="ชื่อสิ่งอำนวยความสะดวก"
                value={newFacility}
                onChange={(e) => setNewFacility(e.target.value)}
              />
              <button
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                className="savebtn-regisfield"
                type="button"
                onClick={addNewFacility}
              >
                บันทึก
              </button>
              <button
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                className="canbtn-regisfield"
                type="button"
                onClick={() => setShowNewFacilityInput(false)}
              >
                ยกเลิก
              </button>
              {startProcessLoad && (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                </div>
              )}
            </div>
          )}
          <div className="input-group-register-field">
            <label>รายละเอียดสนาม</label>
            <div className="textarea">
              <textarea
                maxLength={256}
                name="field_description"
                placeholder="ใส่รายละเอียดสนาม หมายเหตุต่างๆ เช่นสนามหญ้าเทียม 7 คน "
                value={fieldData.field_description}
                onChange={handleFieldChange}
              />
            </div>
          </div>
          <button
            className="submitbtn-regisfield"
            style={{
              cursor: startProcessLoad ? "not-allowed" : "pointer",
            }}
            disabled={startProcessLoad}
            type="submit"
          >
            {startProcessLoad ? (
              <span className="dot-loading">
                <span className="dot one">●</span>
                <span className="dot two">●</span>
                <span className="dot three">● </span>
              </span>
            ) : (
              "บันทึก"
            )}
          </button>
        </form>
      </div>
    </>
  );
}
