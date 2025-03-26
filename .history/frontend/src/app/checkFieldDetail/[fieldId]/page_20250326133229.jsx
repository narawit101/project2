"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function CheckField() {
  const { fieldId } = useParams();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [field, setField] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [updatedValue, setUpdatedValue] = useState("");
  const [subFields, setSubFields] = useState([]);
  const [addons, setAddons] = useState([]);
  const [newSubField, setNewSubField] = useState("");
  const [newAddon, setNewAddon] = useState({ subFieldId: "", content: "", price: "" });
  const [newDocument, setNewDocument] = useState(null);

  useEffect(() => {
    if (!fieldId) return;
    const token
    fetch(`${API_URL}/field/${fieldId}`,{
      Authorization: `Bearer ${token}`,
    })
      .then((res) => res.json())
      .then((data) => {
        setField(data);
        setSubFields(data.sub_fields || []);
      })
      .catch((error) => console.error("❌ Error fetching field:", error));
  }, [fieldId]);

  // ✅ ฟังก์ชันเริ่มแก้ไข
  const startEditing = (fieldName, currentValue) => {
    setEditingField(fieldName);
    setUpdatedValue(currentValue);
  };

  const saveField = async (fieldName) => {
    try {
      console.log("📌 กำลังส่งข้อมูลไปที่ API:", {
        fieldId,
        fieldName,
        updatedValue,
        apiUrl: `${API_URL}/field/${fieldId}`
      });
  
      if (!fieldId) {
        alert("❌ ไม่พบ field_id กรุณารีเฟรชหน้าเว็บ");
        return;
      }
  
      if (!updatedValue || updatedValue.trim() === "") {
        alert("❌ กรุณากรอกข้อมูลให้ถูกต้อง");
        return;
      }
  
      const response = await fetch(`${API_URL}/field/${fieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fieldName]: updatedValue }),
      });
  
      const result = await response.json();
      console.log("📌 API Response:", result); // Debugging
  
      if (response.ok) {
        setField({ ...field, [fieldName]: updatedValue });
        setEditingField(null);
        alert("✅ อัปเดตข้อมูลสำเร็จ!");
      } else {
        alert("❌ เกิดข้อผิดพลาด: " + result.error);
      }
    } catch (error) {
      console.error("❌ Error updating field:", error);
      alert("❌ ไม่สามารถอัปเดตข้อมูลได้");
    }
  };
  
  
  
  // ✅ เพิ่ม SubField
  const addSubField = async () => {
    try {
      const response = await fetch(`${API_URL}/subfield/${fieldId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sub_field_name: newSubField }),
      });

      if (response.ok) {
        const newField = await response.json();
        setSubFields([...subFields, newField]);
        setNewSubField("");
      }
    } catch (error) {
      console.error("❌ Error adding subfield:", error);
    }
  };

  // ✅ เพิ่ม Addon ใน SubField
  const addAddon = async () => {
    try {
      const response = await fetch(`${API_URL}/addon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddon),
      });

      if (response.ok) {
        alert("✅ เพิ่ม Add-on สำเร็จ!");
        setNewAddon({ subFieldId: "", content: "", price: "" });
      }
    } catch (error) {
      console.error("❌ Error adding addon:", error);
    }
  };

  // ✅ อัปโหลดเอกสารใหม่
  const uploadDocument = async () => {
    if (!newDocument) {
      alert("❌ กรุณาเลือกไฟล์ก่อนอัปโหลด");
      return;
    }
  
    const formData = new FormData();
    formData.append("documents", newDocument);
  
    try {
      const response = await fetch(`${API_URL}/field/${fieldId}/upload-document`, {
        method: "POST",
        body: formData,
      });
  
      const result = await response.json();
      console.log("📌 Upload Response:", result);
  
      if (response.ok) {
        alert("✅ อัปโหลดเอกสารสำเร็จ!");
      } else {
        alert("❌ เกิดข้อผิดพลาด: " + result.error);
      }
    } catch (error) {
      console.error("❌ Error uploading document:", error);
      alert("❌ ไม่สามารถอัปโหลดไฟล์ได้");
    }
  };
  

  if (!field) return <p>⏳ กำลังโหลดข้อมูล...</p>;

  return (
    <div className="container">
<h2>📌 รายละเอียดสนามกีฬา</h2>

<div className="field-details">
  <label>📍 ชื่อสนาม:</label>
  {editingField === "field_name" ? (
    <>
      <input type="text" value={updatedValue} onChange={(e) => setUpdatedValue(e.target.value)} />
      <button onClick={() => saveField("field_name")}>💾 บันทึก</button>
    </>
  ) : (
    <>
      <p>{field.field_name || "❌ ไม่มีข้อมูล"}</p>
      <button onClick={() => startEditing("field_name", field.field_name)}>✏️ แก้ไข</button>
    </>
  )}

  <label>📍 ที่อยู่:</label>
  {editingField === "address" ? (
    <>
      <input type="text" value={updatedValue} onChange={(e) => setUpdatedValue(e.target.value)} />
      <button onClick={() => saveField("address")}>💾 บันทึก</button>
    </>
  ) : (
    <>
      <p>{field.address || "❌ ไม่มีข้อมูล"}</p>
      <button onClick={() => startEditing("address", field.address)}>✏️ แก้ไข</button>
    </>
  )}

  <label>🏦 ธนาคาร:</label>
  {editingField === "bank_name" ? (
    <>
      <input type="text" value={updatedValue} onChange={(e) => setUpdatedValue(e.target.value)} />
      <button onClick={() => saveField("bank_name")}>💾 บันทึก</button>
    </>
  ) : (
    <>
      <p>{field.bank_name || "❌ ไม่มีข้อมูล"}</p>
      <button onClick={() => startEditing("bank_name", field.bank_name)}>✏️ แก้ไข</button>
    </>
  )}

<label>📂 เอกสาร:</label>
{Array.isArray(field.documents) && field.documents.length > 0 ? (
  <ul>
    {field.documents.map((doc, index) => (
      <li key={index}>
        <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
          📄 {doc.document_name}
        </a>
      </li>
    ))}
  </ul>
) : (
  <p>❌ ไม่มีเอกสารแนบ</p>
)}

  <input type="file" onChange={(e) => setNewDocument(e.target.files[0])} />
  <button onClick={uploadDocument}>📤 อัปโหลด</button>

  <button onClick={() => router.push("/manager")} className="back-btn">🔙 กลับไปหน้าหลัก</button>
</div>


    </div>
  );
}