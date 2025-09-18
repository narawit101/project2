"use client";
import React, { useState, useEffect } from "react";
import "@/app/css/register-field-form.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import LongdoMapPicker from "./LongdoMapPicker";

export default function RegisterFieldForm() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter("");
  const [sports, setSports] = useState([]);
  const [subFields, setSubFields] = useState([]);
  const [otherChecked, setOtherChecked] = useState(false);
  const [otherFacility, setOtherFacility] = useState({
    name: "",
    price: "",
    quantity: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const { user, isLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [startProcessLoad, setStartProcessLoad] = useState(false);
  const DEFAULT_FACILITIES = [
    { fac_name: "ห้องน้ำ" },
    { fac_name: "ห้องแต่งตัว" },
    { fac_name: "ตู้ล็อคเกอร์" },
    { fac_name: "ห้องอาบน้ำ" },
    { fac_name: "ที่จอดรถ" },
    { fac_name: "Wi-Fi" },
    { fac_name: "รองเท้า" },
    { fac_name: "ร้านค้า" },
    { fac_name: "ตู้แช่" },
    { fac_name: "พัดลม" },
    { fac_name: "แอร์" },
    { fac_name: "ลำโพง" },
  ];
  const [facilities, setFacilities] = useState(DEFAULT_FACILITIES);
  const [selectedFacilities, setSelectedFacilities] = useState({});

  const makeSafeKey = (name, fallback) => {
    if (!name) return fallback || "fac" + Date.now();
    let base = name
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, (c) => c.charCodeAt(0).toString(16));
    if (!base || base.replace(/-/g, "").length === 0) {
      base = fallback || "fac" + Math.random().toString(36).slice(2, 8);
    }
    return base.slice(0, 40);
  };

  const handleOtherFacilityConfirm = () => {
    const name = otherFacility.name.trim();
    if (!name) {
      setMessage("กรุณากรอกชื่อสิ่งอำนวยความสะดวก");
      setMessageType("error");
      return;
    }
    if (!facilities.some((f) => f.fac_name === name)) {
      setFacilities((prev) => [...prev, { fac_name: name }]);
    }
    setSelectedFacilities((prev) => ({
      ...prev,
      [name]: {
        price: otherFacility.price,
        quantity: otherFacility.quantity,
        imageFile: null,
        preview: null,
      },
    }));
    setOtherFacility({ name: "", price: "", quantity: "" });
    setOtherChecked(false);
    setMessage("");
    setMessageType("");
  };

  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
    }
    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }
    if (subFields.length === 0) {
      setSubFields([
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
    open_days: [],
    field_description: "",
    cancel_hours: 0,
    slot_duration: "",
  });

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const res = await fetch(`${API_URL}/sports_types`, {
          credentials: "include",
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

  const handleFieldChange = (e) => {
    setFieldData({ ...fieldData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    const { checked } = e.target;
    setFieldData({
      ...fieldData,
      depositChecked: checked,
      price_deposit: checked ? fieldData.price_deposit : "",
    });
  };

  const handlePriceChange = (e) => {
    let value = e.target.value;

    if (value === "") {
      setFieldData({
        ...fieldData,
        price_deposit: "",
      });
      setMessage("");
      setMessageType("");
      return;
    }

    value = value.replace(/\D/g, "");

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
    if (!fieldData.depositChecked) {
      setFieldData((prevState) => ({
        ...prevState,
        price_deposit: "",
      }));
    }
  }, [fieldData.depositChecked]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const handleimgChange = (e) => {
    const file = e.target.files[0];
    if (file.size > MAX_FILE_SIZE) {
      setMessage("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)");
      setMessageType("error");
      e.target.value = null;
      return;
    }
    if (file) {
      if (file.type.startsWith("image/")) {
        setFieldData({
          ...fieldData,
          img_field: file,
          imgPreview: URL.createObjectURL(file),
        });
      } else {
        e.target.value = null;
        setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพเท่านั้น");
        setMessageType("error");
      }
    }
  };

  const MAX_FILES = 10;
  const handleFileChange = (e) => {
    const files = e.target.files;
    let isValid = true;

    if (files.length > MAX_FILES) {
      setMessage(`คุณสามารถอัพโหลดได้สูงสุด ${MAX_FILES} ไฟล์`);
      setMessageType("error");
      e.target.value = null;
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type;

      if (file.size > MAX_FILE_SIZE) {
        isValid = false;
        setMessage("ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)");
        setMessageType("error");
        e.target.value = null;
        break;
      }

      if (!fileType.startsWith("image/") && fileType !== "application/pdf") {
        isValid = false;
        setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพหรือ PDF เท่านั้น");
        setMessageType("error");
        break;
      }
    }

    if (isValid) {
      setFieldData({ ...fieldData, documents: files });
    } else {
      e.target.value = null;
    }
  };

  const handleFacilityChange = (facId) => {
    setSelectedFacilities((prev) => {
      const copy = { ...prev };
      if (copy[facId]) {
        if (copy[facId].preview) URL.revokeObjectURL(copy[facId].preview);
        delete copy[facId];
      } else {
        copy[facId] = {
          price: "",
          quantity: "",
          description: "",
          imageFile: null,
          preview: null,
        };
      }
      return copy;
    });
  };
  const handleFacilityImageChange = (facId, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      setMessageType("error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("รูปสูงสุด 5MB");
      setMessageType("error");
      return;
    }
    setSelectedFacilities((prev) => {
      const cur = prev[facId] || {
        price: "",
        quantity: "",
        imageFile: null,
        preview: null,
      };
      if (cur.preview) URL.revokeObjectURL(cur.preview);
      return {
        ...prev,
        [facId]: {
          ...cur,
          imageFile: file,
          preview: URL.createObjectURL(file),
        },
      };
    });
  };

  const handleRemoveFacilityImage = (facId) => {
    setSelectedFacilities((prev) => {
      const cur = prev[facId];
      if (!cur) return prev;
      if (cur.preview) URL.revokeObjectURL(cur.preview);
      return {
        ...prev,
        [facId]: { ...cur, imageFile: null, preview: null },
      };
    });
  };

  const handleFacilityPriceChange = (facId, value) => {
    setSelectedFacilities((prev) => ({
      ...prev,
      [facId]: { ...(prev[facId] || { quantity: "" }), price: value },
    }));
  };

  const handleFacilityQuantityChange = (facId, value) => {
    setSelectedFacilities((prev) => ({
      ...prev,
      [facId]: { ...(prev[facId] || { price: "" }), quantity: value },
    }));
  };
  const handleFacilityDescription = (facId, value) => {
    setSelectedFacilities((prev) => ({
      ...prev,
      [facId]: {
        ...(prev[facId] || { price: "", quantity: "" }),
        description: value,
      },
    }));
  };

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

  const removeSubField = (index) => {
    setSubFields(subFields.filter((_, i) => i !== index));
  };

  const updateSubField = (index, key, value) => {
    const updatedSubFields = [...subFields];
    updatedSubFields[index][key] = value;
    setSubFields(updatedSubFields);
  };

  const checkDepositAmount = (updatedSubFields = subFields) => {
    if (fieldData.depositChecked && fieldData.price_deposit) {
      const depositAmount = parseFloat(fieldData.price_deposit);
      const subFieldPrices = updatedSubFields
        .map((sub) => parseFloat(sub.price) || 0)
        .filter((price) => price > 0);

      if (subFieldPrices.length > 0) {
        const minSubFieldPrice = Math.min(...subFieldPrices);
        if (depositAmount >= minSubFieldPrice) {
          setMessage(
            `ค่ามัดจำไม่สามารถเกินราคาสนามย่อยที่ถูกที่สุด (${minSubFieldPrice.toLocaleString()} บาท)`
          );
          setMessageType("error");
          setFieldData({ ...fieldData, price_deposit: "" });
        } else {
          setMessage("");
          setMessageType("");
        }
      } else {
        setMessage("");
        setMessageType("");
      }
    }
  };

  useEffect(() => {
    checkDepositAmount();
  }, [subFields, fieldData.price_deposit, fieldData.depositChecked]);

  const addAddOn = (subIndex) => {
    const updatedSubFields = [...subFields];
    updatedSubFields[subIndex].addOns.push({ content: "", price: "" });
    setSubFields(updatedSubFields);
  };

  const updateAddOn = (subIndex, addOnIndex, key, value) => {
    const updatedSubFields = [...subFields];
    updatedSubFields[subIndex].addOns[addOnIndex][key] = value;
    setSubFields(updatedSubFields);
  };

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
      name_bank: value === "พร้อมเพย์" ? "พร้อมเพย์" : fieldData.name_bank,
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

    if (
      fieldData.depositChecked &&
      (!fieldData.price_deposit || fieldData.price_deposit === "")
    ) {
      setMessage("กรุณากำหนดค่ามัดจำ");
      setMessageType("error");
      return;
    }

    if (!fieldData.field_name) {
      setMessage("กรุณากรอกชื่อสนามกีฬา");
      setMessageType("error");
      return;
    }

    if (!fieldData.address) {
      setMessage("กรุณากรอกที่ตั้งสนาม");
      setMessageType("error");
      return;
    }

    if (!fieldData.gps_location) {
      setMessage("กรุณากรอกพิกัด GPS");
      setMessageType("error");
      return;
    }

    if (!fieldData.open_hours) {
      setMessage("กรุณาเลือกเวลาเปิด");
      setMessageType("error");
      return;
    }

    if (!fieldData.close_hours) {
      setMessage("กรุณาเลือกเวลาปิด");
      setMessageType("error");
      return;
    }

    if (!fieldData.slot_duration) {
      setMessage("กรุณาเลือกช่วงเวลาในการจอง");
      setMessageType("error");
      return;
    }

    if (!fieldData.account_type) {
      setMessage("กรุณาเลือกประเภทบัญชี");
      setMessageType("error");
      return;
    }

    if (!fieldData.number_bank) {
      setMessage("กรุณากรอกเลขบัญชีธนาคาร / พร้อมเพย์");
      setMessageType("error");
      return;
    }

    if (!fieldData.account_holder) {
      setMessage("กรุณากรอกชื่อเจ้าของบัญชีธนาคาร");
      setMessageType("error");
      return;
    }

    if (!fieldData.name_bank) {
      setMessage("กรุณากรอกชื่อธนาคาร");
      setMessageType("error");
      return;
    }

    if (!fieldData.field_description) {
      setMessage("กรุณากรอกคำแนะนำของสนาม");
      setMessageType("error");
      return;
    }

    if (fieldData.open_days.length === 0) {
      setMessage("กรุณาเลือกวันเปิดบริการ");
      setMessageType("error");
      return;
    }

    for (let i = 0; i < subFields.length; i++) {
      const sub = subFields[i];
      const fieldNumber = i + 1;

      if (!sub.name) {
        setMessage(`กรุณากรอกชื่อสนามย่อย (สนามที่ ${fieldNumber})`);
        setMessageType("error");
        return;
      }

      if (!sub.sport_id) {
        setMessage(`กรุณาเลือกประเภทกีฬา (สนามที่ ${fieldNumber})`);
        setMessageType("error");
        return;
      }

      if (!sub.players_per_team) {
        setMessage(`กรุณากรอกจำนวนผู้เล่นต่อฝั่ง (สนามที่ ${fieldNumber})`);
        setMessageType("error");
        return;
      }

      if (!sub.wid_field) {
        setMessage(`กรุณากรอกความกว้างของสนาม (สนามที่ ${fieldNumber})`);
        setMessageType("error");
        return;
      }

      if (!sub.length_field) {
        setMessage(`กรุณากรอกความยาวของสนาม (สนามที่ ${fieldNumber})`);
        setMessageType("error");
        return;
      }

      if (!sub.field_surface) {
        setMessage(`กรุณากรอกประเภทพื้นสนาม (สนามที่ ${fieldNumber})`);
        setMessageType("error");
        return;
      }
    }

    if (!fieldData.documents) {
      setMessage("กรุณาเลือกเอกสาร");
      setMessageType("error");
      return;
    }

    if (!fieldData.img_field) {
      setMessage("กรุณาเลือกรูปโปรไฟล์สนาม");
      setMessageType("error");
      return;
    }

    const selectedFacs = Object.keys(selectedFacilities);
    if (selectedFacs.length === 0) {
      setMessage("กรุณาเลือกสิ่งอำนวยความสะดวก");
      setMessageType("error");
      return;
    }

    for (const id of selectedFacs) {
      const fac = selectedFacilities[id];

      if (fac.price === "") {
        setMessage(`กรุณากรอกราคาสิ่งอำนวยความสะดวก: ${id}`);
        setMessageType("error");
        return;
      }

      if (fac.quantity === "") {
        setMessage(`กรุณากรอกจำนวนสิ่งอำนวยความสะดวก: ${id}`);
        setMessageType("error");
        return;
      }
    }

    const facilitiesPayload = {};
    selectedFacs.forEach((id, idx) => {
      const { price, quantity, description } = selectedFacilities[id];
      const safeKey = makeSafeKey(id, "fac" + idx);
      facilitiesPayload[id] = {
        price: String(price),
        quantity_total: String(quantity),
        description: String(description),
        _key: safeKey,
      };
    });

    const formData = new FormData();

    if (fieldData.documents && fieldData.documents.length > 0) {
      for (let i = 0; i < fieldData.documents.length; i++) {
        formData.append("documents", fieldData.documents[i]);
      }
    }

    formData.append("img_field", fieldData.img_field);

    for (const id of selectedFacs) {
      const f = selectedFacilities[id];
      if (f.imageFile) {
        const safeKey = facilitiesPayload[id]._key;
        formData.append(`facility_image_${safeKey}`, f.imageFile);
      }
    }

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
        price_deposit: fieldData.depositChecked ? fieldData.price_deposit : "0",
        name_bank: fieldData.name_bank,
        status: fieldData.status || "รอตรวจสอบ",
        selectedFacilities: facilitiesPayload,
        subFields: subFields,
        open_days: fieldData.open_days,
        field_description: fieldData.field_description,
        cancel_hours: fieldData.cancel_hours || "0",
        slot_duration: parseInt(fieldData.slot_duration, 10) || 0,
      })
    );

    setStartProcessLoad(true);
    try {
      const res = await fetch(`${API_URL}/field/register`, {
        method: "POST",
        credentials: "include",
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
        open_days: [],
        field_description: "",
        cancel_hours: "",
      });
      setSubFields([]);
      setSelectedFacilities({});

      setTimeout(() => {
        setMessage("");
        router.replace("");
      }, 3000);
    } catch (error) {
      console.error("Fetch Error:", error);
      setMessage("เกิดข้อผิดพลาดในการส่งข้อมูล");
      setMessageType("error");
    } finally {
      setStartProcessLoad(false);
    }
  };
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);

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
            <div className="icon-label-container">
              <label>ชื่อสนามกีฬา:</label>
              <img
                width={20}
                height={20}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757239976/material-symbols--stadium-rounded_qz7gby.png"
                alt=""
                style={{ verticalAlign: "middle" }}
              />
            </div>
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
            <div className="icon-label-container">
              <label>ที่ตั้งสนาม:</label>
              <img
                width={20}
                height={20}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757240000/mynaui--pin-solid_q6964o.png"
                alt=""
                style={{ verticalAlign: "middle" }}
              />
            </div>
            <input
              type="text"
              maxLength={100}
              name="address"
              placeholder="ที่อยู่สนามของคุณ"
              value={fieldData.address}
              onChange={handleFieldChange}
            />
          </div>
          <div className="map-gps-container-register-field">
            <div className="input-group-register-field">
              <div className="icon-label-container">
                <label>พิกัด GPS:</label>{" "}
                <img
                  width={20}
                  height={20}
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1756972382/bxs--map_c0lmby.png"
                  alt=""
                  style={{ verticalAlign: "middle" }}
                />
              </div>
              <input
                type="text"
                maxLength={100}
                name="gps_location"
                placeholder="พิกัด"
                value={fieldData.gps_location}
                onChange={handleFieldChange}
              />
              <div style={{ marginTop: 20 }}>
                <LongdoMapPicker
                  onLocationSelect={(location) => {
                    setFieldData({ ...fieldData, gps_location: location });
                  }}
                  initialLocation={fieldData.gps_location}
                />
              </div>
              {fieldData.gps_location && (
                <div
                  style={{
                    color: "#034078",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    margin: " 20px auto",
                    padding: 8,
                    backgroundColor: "#beddf9ff",
                    borderRadius: 4,
                  }}
                >
                  <img
                    width={20}
                    height={20}
                    src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1756972382/bxs--map_c0lmby.png"
                    alt=""
                  />
                  {""} พิกัดที่เลือก: {fieldData.gps_location}
                </div>
              )}
            </div>
          </div>
          <div className="datetimecon">
            <div className="openn-duration">
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
              <div className="duration-time-container">
                <div className="input-group-register-field">
                  <div className="icon-label-days-container">
                    <label>แบ่งช่วงเวลาในการจอง:</label>
                    <img
                      width={20}
                      height={20}
                      src="data:image/png;base64,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"
                      alt=""
                      style={{ verticalAlign: "middle" }}
                    />
                  </div>
                  <select
                    name="slot_duration"
                    className="select-slot-duration"
                    value={fieldData.slot_duration}
                    onChange={handleFieldChange}
                  >
                    <option value="">กรุณาเลือกช่วงเวลา</option>
                    <option value="30">30 นาที</option>
                    <option value="60">1 ชั่วโมง</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="open-days-container">
              <div className="input-group-register-field">
                <div className="icon-label-days-container">
                  <label style={{ textAlign: "center" }}>
                    เลือกวันเปิดบริการ:
                  </label>
                  <img
                    style={{ verticalAlign: "middle" }}
                    src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757240847/solar--calendar-bold_eiv9sp.png"
                    width={20}
                    height={20}
                    alt=""
                  />
                </div>
              </div>
              <div className="time-selection">
                <div className="input-group-checkbox-register-field">
                  {[
                    { key: "Mon", label: "จันทร์" },
                    { key: "Tue", label: "อังคาร" },
                    { key: "Wed", label: "พุธ" },
                    { key: "Thu", label: "พฤหัสบดี" },
                    { key: "Fri", label: "ศุกร์" },
                    { key: "Sat", label: "เสาร์" },
                    { key: "Sun", label: "อาทิตย์" },
                  ].map((day, index) => (
                    <label key={index} className="checkbox-label">
                      <input
                        type="checkbox"
                        name="open_days"
                        value={day.key}
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
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="input-group-register-field">
            <div className="icon-label-container">
              <label>ยกเลิกการจองได้ภายใน (ชั่วโมง): </label>
              <img
                style={{ verticalAlign: "middle" }}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757241407/pajamas--time-out_j4mrua.png"
                width={20}
                height={20}
                alt=""
              />
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              name="cancel_hours"
              placeholder="เช่น 2 = ยกเลิกได้ก่อน 2 ชม."
              value={fieldData.cancel_hours}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, "");
                if (value > 99) {
                  setMessage("ใส่ไม่เกินไม่เกิน 99 ชั่วโมง ");
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
          <div className="input-group-register-field">
            <div className="icon-label-container">
              <label>สนามย่อย: </label>
              <img
                width={25}
                height={25}
                style={{ verticalAlign: "middle" }}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757259877/mingcute--playground-fill_v8ekao.png"
                alt=""
              />
            </div>
          </div>
          <div className="subfieldcon">
            {subFields.map((sub, subIndex) => (
              <div key={subIndex}>
                <div className="input-group-register-field">
                  <div className="icon-label-container">
                    <label htmlFor="">ชื่อสนามย่อย:</label>
                    <img
                      src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757254986/fluent--form-24-filled_bngilf.png"
                      width={20}
                      height={20}
                      style={{ verticalAlign: "middle" }}
                      alt=""
                    />
                  </div>
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
                <div className="input-group-register-field">
                  <div className="icon-label-container">
                    <label>ราคา/ชั่วโมง: </label>
                    <img
                      width={20}
                      height={20}
                      style={{ verticalAlign: "middle" }}
                      src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757254913/icomoon-free--price-tag_khbaj4.png"
                      alt=""
                    />
                  </div>
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

                <div className="input-group-register-field">
                  <div className="icon-label-container">
                    <label htmlFor="">ประเภทกีฬา:</label>
                    <img
                      width={20}
                      height={20}
                      style={{ verticalAlign: "middle" }}
                      src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757259220/fluent--sport-16-filled_gmsj8t.png"
                      alt=""
                    />
                  </div>

                  <div className="select-sport-register-field">
                    <select
                      value={sub.sport_id}
                      onChange={(e) => {
                        const sportId = e.target.value;
                        updateSubField(subIndex, "sport_id", sportId);
                        updateSubField(subIndex, "players_per_team", "");
                      }}
                    >
                      <option value="">เลือกประเภทกีฬา</option>
                      {sports.map((sport) => (
                        <option key={sport.sport_id} value={sport.sport_id}>
                          {sport.sport_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="input-group-register-field">
                  <div className="icon-label-container">
                    <label htmlFor="">จำนวนผู้เล่นต่อฝั่ง:</label>
                    <img
                      width={20}
                      height={20}
                      style={{ verticalAlign: "middle" }}
                      src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757259443/rivet-icons--user-group-solid_ijtvb3.png"
                      alt=""
                    />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    placeholder="(คน)"
                    value={sub.players_per_team ?? ""}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      const selectedSport = sports.find(
                        (sport) => sport.sport_id == sub.sport_id
                      );
                      const sportName = selectedSport
                        ? selectedSport.sport_name
                        : "";
                      if (sportName === "ฟุตบอล" && value > 11) {
                        setMessage("ฟุตบอลใส่ได้ไม่เกิน 11 คน");
                        setMessageType("error");
                        return;
                      }
                      if (sportName === "ฟุตซอล" && value > 5) {
                        setMessage("ฟุตซอลใส่ได้ไม่เกิน 5 คน");
                        setMessageType("error");
                        return;
                      }
                      if (sportName === "บาสเก็ตบอล" && value > 5) {
                        setMessage("บาสเก็ตบอลใส่ได้ไม่เกิน 5 คน");
                        setMessageType("error");
                        return;
                      }

                      updateSubField(subIndex, "players_per_team", value);
                    }}
                  />{" "}
                </div>
                <div className="input-group-register-field">
                  <div className="icon-label-container">
                    <label>ความกว้างของสนาม:</label>
                    <img
                      width={20}
                      height={20}
                      style={{ verticalAlign: "middle" }}
                      src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757259593/streamline-plump--fit-to-width-square-solid_xro2je.png"
                      alt=""
                    />
                  </div>
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
                  <div className="icon-label-container">
                    <label>ความยาวของสนาม:</label>
                    <img
                      width={20}
                      height={20}
                      style={{ verticalAlign: "middle" }}
                      src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757259596/streamline-plump--fit-height-solid_hy5hmo.png"
                      alt=""
                    />
                  </div>
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
                  <div className="icon-label-container">
                    <div className="icon-label-container">
                      <label>พื้นสนาม</label>
                      <img
                        width={20}
                        height={20}
                        style={{ verticalAlign: "middle" }}
                        src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260059/hugeicons--background_qpzudp.png"
                        alt=""
                      />
                    </div>
                  </div>
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

                <button
                  className="addbtn-regisfield"
                  type="button"
                  onClick={() => addAddOn(subIndex)}
                >
                  เพิ่มกิจกรรมเพิ่มเติม
                </button>

                <button
                  className="delbtn-regisfield"
                  type="button"
                  onClick={() => removeSubField(subIndex)}
                >
                  ลบสนามย่อย
                </button>

                <div className="addoncon">
                  {sub.addOns.map((addon, addOnIndex) => (
                    <div key={addOnIndex}>
                      <div className="icon-label-container">
                        <label
                          htmlFor=""
                          style={{
                            fontWeight: "bold",
                            color: "#03045e",
                          }}
                        >
                          กิจกรรมพิเศษ:
                        </label>
                        <img
                          width={20}
                          height={20}
                          style={{ verticalAlign: "middle" }}
                          src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260382/zondicons--add-solid_hmeqxs.png"
                          alt=""
                        />
                      </div>
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

            <button
              className="addsubfield-regisfield"
              type="button"
              onClick={addSubField}
            >
              + เพิ่มสนามย่อย
            </button>
          </div>
          <div className="input-group-register-field">
            <div className="icon-label-container">
              <label htmlFor="img_field">รูปโปรไฟล์สนาม:</label>
              <img
                width={20}
                height={20}
                style={{ verticalAlign: "middle" }}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260568/streamline--user-profile-focus-solid_bkna8e.png"
                alt=""
              />
            </div>
            <label
              style={{ textAlign: "center" }}
              className="file-label-register-field"
            >
              <input
                type="file"
                style={{ display: "none" }}
                onChange={handleimgChange}
                accept="image/*"
              />
              เลือกรูปภาพสนาม
            </label>
          </div>

          {fieldData.imgPreview && (
            <div className="preview-container-regis-field">
              <img src={fieldData.imgPreview} alt="Preview" />
            </div>
          )}

          <div className="input-group-register-field">
            <div className="icon-label-container">
              <label htmlFor="documents">
                เอกสาร หรือรูป (เพิ่มได้สูงสุด 10 ไฟล์):
              </label>
              <img
                width={20}
                height={20}
                style={{ verticalAlign: "middle" }}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260641/material-symbols--lab-profile-sharp_rlwd0x.png"
                alt=""
              />
            </div>
            <label
              style={{ textAlign: "center" }}
              className="file-label-register-field"
            >
              <input
                style={{ display: "none" }}
                type="file"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                multiple
              />
              เลือกเอกสาร
            </label>
          </div>
          {fieldData.documents && fieldData.documents.length > 0 && (
            <div className="selected-documents">
              <p className="selected-documents-title">
                ไฟล์ที่เลือก ({fieldData.documents.length}):
              </p>
              <ul className="selected-documents-list">
                {Array.from(fieldData.documents).map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="input-group-register-field">
            <div className="acc-type">
              <div className="icon-label-container">
                <label htmlFor="account-type">เลือกประเภทบัญชี:</label>
                <img
                  width={20}
                  height={20}
                  style={{ verticalAlign: "middle" }}
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260760/streamline--bank-remix_jjilhx.png"
                  alt=""
                />
              </div>
              <select
                name="account_type"
                value={fieldData.account_type}
                onChange={handleAccountTypeChange}
              >
                <option value="">กรุณาเลือกบัญชี</option>
                <option value="ธนาคาร">ธนาคาร</option>
                <option value="พร้อมเพย์">พร้อมเพย์</option>
              </select>
            </div>
          </div>
          <div className="input-group-register-field">
            <div className="icon-label-container">
              <label htmlFor="number_bank">เลขบัญชีธนาคาร / พร้อมเพย์</label>
              <img
                width={20}
                height={20}
                style={{ verticalAlign: "middle" }}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757261101/f7--number_owq9iu.png"
                alt=""
              />
            </div>

            <input
              type="text"
              maxLength={13}
              inputMode="numeric"
              pattern="[0-9]*"
              name="number_bank"
              placeholder="เลขบัญชีและพร้อมเพย์ 10 หลัก หรือ 13 หลัก หลักเท่านั้น"
              value={fieldData.number_bank || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setMessage("");
                const isPromptPay = fieldData.account_type === "พร้อมเพย์";

                if (/^\d*$/.test(value)) {
                  if (
                    (isPromptPay && value.length <= 13) ||
                    (!isPromptPay && value.length <= 12)
                  ) {
                    setFieldData({ ...fieldData, number_bank: value });
                  }
                }
              }}
              onBlur={() => {
                const isPromptPay = fieldData.account_type === "พร้อมเพย์";
                const length = fieldData.number_bank.length;

                if (
                  (!isPromptPay && length !== 10 && length !== 12) ||
                  (isPromptPay && length !== 10 && length !== 13)
                ) {
                  setMessage(
                    "เลขที่กรอกไม่ถูกต้อง เลขบัญชีและพร้อมเพย์ 10 หลัก หรือ 13 หลัก หลักเท่านั้น"
                  );
                  setMessageType("error");
                  setFieldData({ ...fieldData, number_bank: "" });
                }
              }}
            />
          </div>

          {fieldData.account_type === "ธนาคาร" && (
            <div className="input-group-register-field">
              <div className="icon-label-container">
                <label htmlFor="bank">ชื่อธนาคาร</label>
                <img
                  width={20}
                  height={20}
                  style={{ verticalAlign: "middle" }}
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757261308/icon-park-solid--bank-card_cbiyno.png"
                  alt=""
                />
              </div>
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

          {fieldData.account_type === "พร้อมเพย์" && (
            <div className="input-group-register-field">
              <div className="icon-label-container">
                <label htmlFor="bank">ชื่อธนาคาร</label>
                <img
                  width={20}
                  height={20}
                  style={{ verticalAlign: "middle" }}
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260760/streamline--bank-remix_jjilhx.png"
                  alt=""
                />
              </div>
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
            <div className="icon-label-container">
              <label htmlFor="bank">ชื่อเจ้าของบัญชีธนาคาร</label>
              <img
                width={20}
                height={20}
                style={{ verticalAlign: "middle" }}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755157542/qlementine-icons--user-24_zre8k9.png"
                alt=""
              />
            </div>
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
              <div className="icon-label-container">
                <label>ค่ามัดจำ</label>
                <img
                  height={20}
                  width={20}
                  style={{ verticalAlign: "middle" }}
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757261552/vaadin--money-deposit_h34fs8.png"
                  alt=""
                />
              </div>
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
                    value={fieldData.price_deposit || ""}
                    onChange={handlePriceChange}
                    maxLength={7}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onKeyDown={(e) => {
                      if (e.key === "-") {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="input-group-register-field">
            <div className="icon-label-container">
              <label>สิ่งอำนวยความสะดวก</label>
              <img
                width={20}
                height={20}
                style={{ verticalAlign: "middle" }}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757260382/zondicons--add-solid_hmeqxs.png"
                alt=""
              />
            </div>
          </div>
          <div className="factcon-register-field">
            {facilities.map((fac) => {
              const key = fac.fac_name;
              const isSelected = selectedFacilities[key] !== undefined;
              return (
                <div
                  key={key}
                  className={`facility-item-register-field ${
                    isSelected ? "selected" : ""
                  }`}
                >
                  <div className="input-group-checkbox-register-field">
                    <input
                      type="checkbox"
                      id={`facility-${key}`}
                      checked={isSelected}
                      onChange={() => handleFacilityChange(key)}
                    />
                    <label htmlFor={`facility-${key}`}>{fac.fac_name}</label>
                  </div>
                  {isSelected && (
                    <div className="facility-inputs-container">
                      <div className="facility-inputs-grid">
                        <input
                          type="text"
                          className="facility-price-input"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={7}
                          placeholder="กำหนดราคา"
                          value={selectedFacilities[key]?.price ?? ""}
                          onChange={(e) => {
                            let v = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6);
                            handleFacilityPriceChange(key, v);
                          }}
                        />
                        <input
                          type="text"
                          className="facility-quantity-input"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={3}
                          min={1}
                          placeholder="จำนวน"
                          value={selectedFacilities[key]?.quantity ?? ""}
                          onChange={(e) => {
                            let v = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 3);
                            if (v === "0") {
                              setMessage("จำนวนต้องไม่น้อยกว่า 1");
                              setMessageType("error");
                              v = "";
                              return;
                            }
                            handleFacilityQuantityChange(key, v);
                          }}
                        />
                        <textarea
                          type="text"
                          className="facility-description-input"
                          maxLength={50}
                          placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                          value={selectedFacilities[key]?.description ?? ""}
                          onChange={(e) => {
                            handleFacilityDescription(key, e.target.value);
                          }}
                        ></textarea>
                        <div className="faccility-image-section">
                          <label className="file-label-register-field">
                            เลือกรูปภาพ (ถ้ามี)
                            <input
                              style={{ display: "none" }}
                              type="file"
                              className="facility-file-input"
                              accept="image/*"
                              onChange={(e) =>
                                handleFacilityImageChange(
                                  key,
                                  e.target.files?.[0]
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>
                      {selectedFacilities[key]?.preview && (
                        <div className="facility-image-preview">
                          <img
                            src={selectedFacilities[key].preview}
                            alt={`รูป${fac.fac_name}`}
                            className="facility-preview-img"
                          />
                          <button
                            type="button"
                            className="facility-remove-img-btn"
                            onClick={() => handleRemoveFacilityImage(key)}
                          >
                            ลบรูป
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="other-facility-section">
              <div className="input-group-checkbox-register-field">
                <input
                  type="checkbox"
                  id="other-facility"
                  checked={otherChecked}
                  onChange={(e) => {
                    setOtherChecked(e.target.checked);
                    setMessage("");
                    setMessageType("");
                  }}
                />
                <label htmlFor="other-facility">สิ่งอำนวยความสะดวกอื่น ๆ</label>
              </div>
              {otherChecked && (
                <div
                  className="other-facility-inputs"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginTop: "10px",
                    padding: "15px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="ชื่อสิ่งอำนวยความสะดวก"
                    value={otherFacility.name}
                    onChange={(e) =>
                      setOtherFacility((f) => ({ ...f, name: e.target.value }))
                    }
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      padding: "16px",
                      backgroundColor: "white",
                      border: "1px solid #e5e7ebc",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={7}
                    placeholder="ราคา (ใส่ 0 ถ้าฟรี)"
                    value={otherFacility.price}
                    onChange={(e) =>
                      setOtherFacility((f) => ({
                        ...f,
                        price: e.target.value.replace(/\D/g, "").slice(0, 6),
                      }))
                    }
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    placeholder="จำนวน"
                    value={otherFacility.quantity}
                    onChange={(e) =>
                      setOtherFacility((f) => ({
                        ...f,
                        quantity: e.target.value.replace(/\D/g, "").slice(0, 3),
                      }))
                    }
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                  <button
                    type="button"
                    className="other-facility-confirm-btn"
                    disabled={startProcessLoad}
                    onClick={handleOtherFacilityConfirm}
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                  >
                    ยืนยัน
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="input-group-register-field">
            <div className="icon-label-container">
              <label>คำแนะนำของสนาม</label>
              <img
                width={20}
                height={20}
                style={{ verticalAlign: "middle" }}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757261993/streamline-plump--description-solid_ct73qk.png"
                alt=""
              />
            </div>
            <div className="textarea">
              <textarea
                maxLength={256}
                name="field_description"
                placeholder="ใส่รายละเอียดสนาม ช่องทางการติดต่อ หมายเหตุต่างๆ เช่นสนามหญ้าเทียม 7 คน"
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
