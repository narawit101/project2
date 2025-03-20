"use client";
import React, { useState, useEffect } from "react";
import "../css/registerFieldForm.css"

export default function RegisterFieldForm() {
  const API_URL = "http://localhost:5000";

  const [sports, setSports] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState({});
  const [subFields, setSubFields] = useState([]);
  const [addOns, setAddons] = useState([]);
  const [newFacility, setNewFacility] = useState("");
  const [showNewFacilityInput, setShowNewFacilityInput] = useState(false);

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
  });

  // 📌 โหลดประเภทกีฬา
  useEffect(() => {
    fetch(`${API_URL}/sports_types`)
      .then((res) => res.json())
      .then((data) => setSports(data))
      .catch((error) => console.error("Error fetching sports:", error));
  }, []);

  // 📌 โหลดสิ่งอำนวยความสะดวก
  useEffect(() => {
    fetch(`${API_URL}/facilities`)
      .then((res) => res.json())
      .then((data) => setFacilities(data))
      .catch((error) => console.error("Error fetching facilities:", error));
  }, []);

  // 📌 อัปเดตค่าช่องกรอกข้อมูลสนาม
  const handleFieldChange = (e) => {
    setFieldData({ ...fieldData, [e.target.name]: e.target.value });
  };

  // 📌 ฟังก์ชันเลือก Checkbox สิ่งอำนวยความสะดวก
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

  // 📌 ฟังก์ชันอัปเดตราคาสิ่งอำนวยความสะดวก
  const handleFacilityPriceChange = (facId, price) => {
    setSelectedFacilities((prev) => ({
      ...prev,
      [facId]: price,
    }));
  };

  // 📌 ฟังก์ชันเพิ่มสิ่งอำนวยความสะดวกใหม่
  const addNewFacility = async () => {
    if (!newFacility.trim()) return;

    const res = await fetch(`${API_URL}/facilities/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  // ✅ เพิ่มสนามย่อย (มี addOns ในตัวเอง)
  const addSubField = () => {
    // ✅ ดึง user_id จาก localStorage
    const storedUser = localStorage.getItem("user");
    const userData = storedUser ? JSON.parse(storedUser) : null;
    const userId = userData ? userData.user_id : null; // ดึง user_id

    setSubFields([
      ...subFields,
      { name: "", price: "", sport_id: "", user_id: userId, addOns: [] },
    ]);
  };

  // ✅ ลบสนามย่อย (รวมถึง Add-ons ที่อยู่ภายใน)
  const removeSubField = (index) => {
    setSubFields(subFields.filter((_, i) => i !== index));
  };

  // ✅ อัปเดตข้อมูลสนามย่อย
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

  // 📌 อัปเดตค่า Add-on
  const updateAddOn = (subIndex, addOnIndex, key, value) => {
    const updatedSubFields = [...subFields];
    updatedSubFields[subIndex].addOns[addOnIndex][key] = value;
    setSubFields(updatedSubFields);
  };

  // 📌 ลบ Add-on
  const removeAddOn = (subIndex, addOnIndex) => {
    const updatedSubFields = [...subFields];
    updatedSubFields[subIndex].addOns.splice(addOnIndex, 1);
    setSubFields(updatedSubFields);
  };

  // 📌 ฟังก์ชันจัดการอัปโหลดรูป และแสดงตัวอย่าง
  const handleimgChange = (e) => {
    const file = e.target.files[0]; // ดึงไฟล์รูปจาก input
    if (file) {
      setFieldData({
        ...fieldData,
        img_field: file,
        imgPreview: URL.createObjectURL(file), // สร้าง URL เพื่อแสดงรูป
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      alert("❌ กรุณาเข้าสู่ระบบก่อน!");
      return;
    }

    const userData = JSON.parse(storedUser);
    const userId = userData.user_id; // ✅ ดึง user_id ตอน Submit

    const formData = new FormData();
    formData.append("documents", fieldData.documents);
    formData.append("img_field", fieldData.img_field); // ✅ เพิ่มการส่งรูปภาพ
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
        status: fieldData.status || "รอตรวจสอบ", // ✅ เพิ่มค่า Status
        selectedFacilities,
        subFields: subFields,
      })
    );

    try {
      const res = await fetch("http://localhost:5000/field/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) {
        console.error("❌ Error:", data.error);
        alert("เกิดข้อผิดพลาด: " + data.error);
        return;
      }

      alert("บันทึกข้อมูลสนามเรียบร้อย! รูปภาพถูกอัปโหลดที่: " + data.img_path);
    } catch (error) {
      console.error("❌ Fetch Error:", error);
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล");
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        
        {/* ข้อมูลสนามกีฬา */}
        <label>ชื่อสนามกีฬา:</label>
        <input type="text" name="field_name" value={fieldData.field_name} onChange={handleFieldChange} />
  
        <label>ที่ตั้งสนาม:</label>
        <input type="text" name="address" value={fieldData.address} onChange={handleFieldChange} />
  
        <label>ตำแหน่งพิกัด GPS:</label>
        <input type="text" name="gps_location" value={fieldData.gps_location} onChange={handleFieldChange} />
  
        {/* เวลาทำการ */}
        <label>เวลาทำเปิด:</label>
        <input type="time" name="open_hours" value={fieldData.open_hours} onChange={handleFieldChange} />
  
        <label>เวลาทำปิด:</label>
        <input type="time" name="close_hours" value={fieldData.close_hours} onChange={handleFieldChange} />
  
        {/* อัปโหลดไฟล์ */}
        <label htmlFor="documents">เอกสาร:</label>
        <input type="file" onChange={(e) => setFieldData({ ...fieldData, documents: e.target.files[0] })} />
  
        <label htmlFor="img_field">รูปสนาม:</label>
        <input type="file" onChange={handleimgChange} accept="image/*" />
  
        {fieldData.imgPreview && (
          <div>
            <p>ตัวอย่างรูป:</p>
            <img src={fieldData.imgPreview} alt="Preview" style={{ width: "200px", height: "auto", marginTop: "10px" }} />
          </div>
        )}
  
        {/* ข้อมูลธนาคาร */}
        <label htmlFor="bank">ธนาคาร:</label>
        <input type="text" name="name_bank" value={fieldData.name_bank} onChange={handleFieldChange} />
  
        <label htmlFor="bank">เลขบัญชีธนาคาร / พร้อมเพย์:</label>
        <input 
          type="number" 
          name="number_bank" 
          value={fieldData.number_bank} 
          onChange={(e) => {
            if (/^\d*$/.test(e.target.value)) {
              setFieldData({ ...fieldData, number_bank: e.target.value });
            }
          }}
          onBlur={() => {
            const isPromptPay = fieldData.name_bank === "พร้อมเพย์";
            const length = fieldData.number_bank.length;
            if ((!isPromptPay && length !== 12) || (isPromptPay && length !== 10 && length !== 13)) {
              alert("เลขที่กรอกไม่ถูกต้อง กรุณากรอกให้ตรงกับเงื่อนไข");
              setFieldData({ ...fieldData, number_bank: "" });
            }
          }}
          maxLength={13}
        />
        <p>📌 {fieldData.name_bank === "พร้อมเพย์" ? "นี่คือหมายเลขพร้อมเพย์" : "นี่คือเลขบัญชีธนาคาร"}</p>
  
        <label htmlFor="bank">ชื่อเจ้าของบัญชีธนาคาร:</label>
        <input type="text" name="account_holder" value={fieldData.account_holder} onChange={handleFieldChange} />
  
        <label>ค่ามัดจำ:</label>
        <input type="number" name="price_deposit" value={fieldData.price_deposit} onChange={handleFieldChange} />
  
        {/* สนามย่อย */}
        <h4>เพิ่มสนามย่อย</h4>
        {subFields.map((sub, subIndex) => (
          <div key={subIndex} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
            <input type="text" placeholder="ชื่อสนามย่อย" value={sub.name} onChange={(e) => updateSubField(subIndex, "name", e.target.value)} />
            <input type="number" placeholder="ราคา" value={sub.price} onChange={(e) => updateSubField(subIndex, "price", e.target.value)} />
            <select value={sub.sport_id} onChange={(e) => updateSubField(subIndex, "sport_id", e.target.value)}>
              <option value="">เลือกประเภทกีฬา</option>
              {sports.map((sport) => (
                <option key={sport.sport_id} value={sport.sport_id}>{sport.sport_name}</option>
              ))}
            </select>
            <button type="button" onClick={() => addAddOn(subIndex)}>เพิ่มกิจกรรมเพิ่มเติม</button>
            <button type="button" onClick={() => removeSubField(subIndex)}>ลบสนามย่อย</button>
  
            {sub.addOns.map((addon, addOnIndex) => (
              <div key={addOnIndex} style={{ marginLeft: "20px", marginTop: "5px" }}>
                <input type="text" placeholder="ชื่อกิจกรรม" value={addon.content} onChange={(e) => updateAddOn(subIndex, addOnIndex, "content", e.target.value)} />
                <input type="number" placeholder="ราคา" value={addon.price} onChange={(e) => updateAddOn(subIndex, addOnIndex, "price", e.target.value)} />
                <button type="button" onClick={() => removeAddOn(subIndex, addOnIndex)}>ลบกิจกรรมเพิ่มเติม</button>
              </div>
            ))}
          </div>
        ))}
        <button type="button" onClick={addSubField}>+ เพิ่มสนามย่อย</button>
  
        {/* สิ่งอำนวยความสะดวก */}
        <h4>สิ่งอำนวยความสะดวก</h4>
        {facilities.map((fac) => (
          <div key={fac.fac_id}>
            <input type="checkbox" checked={selectedFacilities[fac.fac_id] !== undefined} onChange={() => handleFacilityChange(fac.fac_id)} />
            {fac.fac_name}
            {selectedFacilities[fac.fac_id] !== undefined && (
              <input type="number" placeholder="กำหนดราคา" value={selectedFacilities[fac.fac_id]} onChange={(e) => handleFacilityPriceChange(fac.fac_id, e.target.value)} />
            )}
          </div>
        ))}
  
        {/* เพิ่มสิ่งอำนวยความสะดวกใหม่ */}
        <h4>เพิ่มสิ่งอำนวยความสะดวกใหม่</h4>
        {!showNewFacilityInput ? (
          <button type="button" onClick={() => setShowNewFacilityInput(true)}>+ เพิ่มสิ่งอำนวยความสะดวกใหม่</button>
        ) : (
          <div>
            <input type="text" placeholder="ชื่อสิ่งอำนวยความสะดวก" value={newFacility} onChange={(e) => setNewFacility(e.target.value)} />
            <button type="button" onClick={addNewFacility}>บันทึก</button>
            <button type="button" onClick={() => setShowNewFacilityInput(false)}>ยกเลิก</button>
          </div>
        )}
  
        <br />
        <button type="submit">ยืนยัน</button>
  
      </form>
    </div>
  );
  
}
