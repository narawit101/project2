"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function CheckFieldDetail() {
  const { fieldId } = useParams();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [field, setField] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [updatedValue, setUpdatedValue] = useState("");
  const [subFields, setSubFields] = useState([]);
  const [addons, setAddons] = useState([]);
  const [newSubField, setNewSubField] = useState("");
  const [newAddon, setNewAddon] = useState({
    subFieldId: "",
    content: "",
    price: "",
  });
  const [newDocument, setNewDocument] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); // ✅ เก็บไฟล์จริง
  const [previewUrl, setPreviewUrl] = useState(null); // ✅ สำหรับแสดง preview รูป

  useEffect(() => {
    if (!fieldId) return;
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/field/${fieldId}`, { Authorization: `Bearer ${token}` })
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
      // 📁 ถ้าเป็นการอัปโหลดไฟล์ (รูปภาพหรือเอกสาร)
      if (fieldName === "img_field" || fieldName === "documents") {
        if (!selectedFile) {
          alert("❌ กรุณาเลือกไฟล์ก่อนอัปโหลด");
          return;
        }

        const formData = new FormData();
        formData.append(fieldName, selectedFile); // ✅ ส่ง File object จริง

        const uploadEndpoint =
          fieldName === "img_field"
            ? `${API_URL}/field/${fieldId}/upload-image`
            : `${API_URL}/field/${fieldId}/upload-document`;

        const response = await fetch(uploadEndpoint, {
          method: "POST",
          body: formData,
        });

        let result = {};
        try {
          result = await response.json();
        } catch (err) {
          console.error("❌ ไม่สามารถแปลง response เป็น JSON ได้:", err);
        }

        if (response.ok) {
          alert("✅ อัปโหลดไฟล์สำเร็จ!");
          setField({ ...field, [fieldName]: result.path || selectedFile.name });
          setEditingField(null);
          setSelectedFile(null);
        } else {
          alert("❌ เกิดข้อผิดพลาด: " + (result.error || "ไม่ทราบสาเหตุ"));
        }
        return;
      }

      // 📝 กรณีอัปเดต field ทั่วไป (ไม่ใช่ไฟล์)
      const response = await fetch(`${API_URL}/field/edit/${fieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fieldName]: updatedValue }),
      });

      let result = {};
      try {
        result = await response.json();
      } catch (err) {
        console.error("❌ แปลง JSON ล้มเหลว:", err);
      }

      if (response.ok) {
        setField({ ...field, [fieldName]: updatedValue });
        setEditingField(null);
        alert("✅ อัปเดตข้อมูลสำเร็จ!");
      } else {
        alert("❌ เกิดข้อผิดพลาด: " + (result.error || "ไม่ทราบสาเหตุ"));
      }
    } catch (error) {
      console.error("❌ Error saving field:", error);
      alert("❌ ไม่สามารถบันทึกข้อมูลได้");
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
      const response = await fetch(
        `${API_URL}/field/${fieldId}/upload-document`,
        {
          method: "POST",
          body: formData,
        }
      );

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

  const handleChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file); // ✅ เก็บ File object
    setUpdatedValue(file.name); // ✅ เก็บชื่อไฟล์ไว้แสดงเฉย ๆ
    setPreviewUrl(URL.createObjectURL(file)); // ✅ สำหรับแสดง preview
  };

  const handleSubFieldChange = (index, key, value) => {
    const updated = [...subFields];
    updated[index][key] = value;
    setSubFields(updated); // บันทึกค่าที่แก้ใน state
  };

  const saveSubField = async (sub) => {
    try {
      const response = await fetch(
        `${API_URL}/field/supfiled/${sub.sub_field_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sub_field_name: sub.sub_field_name,
            price: sub.price,
            sport_id: sub.sport_id,
          }),
        }
      );

      const result = await response.json();
      console.log("📌 Response:", result);

      if (response.ok) {
        alert("✅ บันทึกสนามย่อยสำเร็จ!");
        setEditingField(null); // ออกจากโหมดแก้ไข
        setUpdatedValue("");
      } else {
        alert("❌ บันทึกล้มเหลว: " + (result.error || "ไม่ทราบสาเหตุ"));
      }
    } catch (error) {
      console.error("❌ Error saving subfield:", error);
      alert("❌ เกิดข้อผิดพลาดในการส่งข้อมูล");
    }
  };

  const cancelEditing = () => {
    setEditingField(null); // ออกจากโหมดแก้ไข
    setUpdatedValue(""); // เคลียร์ค่าใน input
  };

  if (!field) return <p>⏳ กำลังโหลดข้อมูล...</p>;

  return (
    <div className="container">
      <h2>📌 รายละเอียดสนามกีฬา</h2>

      <div className="field-details">
        <label>📍ชื่อ:</label>
        {editingField === "first_name" ? (
          <>
            <input
              type="text"
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
            />
            <button onClick={() => saveField("first_name")}>💾 บันทึก</button>
            <button onClick={cancelEditing}>ยกเลิก</button>
          </>
        ) : (
          <>
            <p>{field.first_name || "❌ ไม่มีข้อมูล"}</p>
            <button
              onClick={() => startEditing("first_name", field.first_name)}
            >
              ✏️ แก้ไข
            </button>
          </>
        )}
        <br />
        <label>📍นามสกุล:</label>
        {editingField === "last_name" ? (
          <>
            <input
              type="text"
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
            />
            <button onClick={() => saveField("last_name")}>💾 บันทึก</button>
            <button onClick={cancelEditing}>ยกเลิก</button>
          </>
        ) : (
          <>
            <p>{field.last_name || "❌ ไม่มีข้อมูล"}</p>
            <button onClick={() => startEditing("last_name", field.last_name)}>
              ✏️ แก้ไข
            </button>
          </>
        )}

        <br />
        <label>📍email</label>
        {editingField === "email" ? (
          <>
            <input
              type="text"
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
            />
            <button onClick={() => saveField("email")}>💾 บันทึก</button>
            <button onClick={cancelEditing}>ยกเลิก</button>
          </>
        ) : (
          <>
            <p>{field.email || "❌ ไม่มีข้อมูล"}</p>
            <button onClick={() => startEditing("email", field.email)}>
              ✏️ แก้ไข
            </button>
          </>
        )}

        <br />
        <label>📍 ชื่อสนาม:</label>
        {editingField === "field_name" ? (
          <>
            <input
              type="text"
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
            />
            <button onClick={() => saveField("field_name")}>💾 บันทึก</button>
            <button onClick={cancelEditing}>ยกเลิก</button>
          </>
        ) : (
          <>
            <p>{field.field_name || "❌ ไม่มีข้อมูล"}</p>
            <button
              onClick={() => startEditing("field_name", field.field_name)}
            >
              ✏️ แก้ไข
            </button>
          </>
        )}

        <br />
        <label>📍ที่อยู่</label>
        {editingField === "address" ? (
          <>
            <input
              type="text"
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
            />
            <button onClick={() => saveField("address")}>💾 บันทึก</button>
            <button onClick={cancelEditing}>ยกเลิก</button>
          </>
        ) : (
          <>
            <p>{field.address || "❌ ไม่มีข้อมูล"}</p>
            <button onClick={() => startEditing("address", field.address)}>
              ✏️ แก้ไข
            </button>
          </>
        )}

        <br />
        <label>📍พิกัด</label>
        {editingField === "gps_location" ? (
          <>
            <input
              type="time"
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
            />
            <button onClick={() => saveField("address")}>💾 บันทึก</button>
            <button onClick={cancelEditing}>ยกเลิก</button>
          </>
        ) : (
          <>
            <p>
              <a
                href={field?.gps_location}
                target="_blank"
                rel="noopener noreferrer"
              >
                {field?.gps_location || "❌ ไม่มีข้อมูล"}
              </a>
            </p>

            <button
              onClick={() => startEditing("gps_location", field.gps_location)}
            >
              ✏️ แก้ไข
            </button>
          </>
        )}

        <br />
        <label>📍เวลาทำเปิด:</label>
        {editingField === "open_hours" ? (
          <>
            <input
              type="time"
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
            />
            <button onClick={() => saveField("open_hours")}>💾 บันทึก</button>
            <button onClick={cancelEditing}>ยกเลิก</button>
          </>
        ) : (
          <>
            <p>{field.open_hours || "❌ ไม่มีข้อมูล"}</p>
            <button
              onClick={() => startEditing("open_hours", field.open_hours)}
            >
              ✏️ แก้ไข
            </button>
          </>
        )}

        <br />
        <label>📍เวลาทำปิด:</label>
        {editingField === "close_hours" ? (
          <>
            <input
              type="time"
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
            />
            <button onClick={() => saveField("close_hours")}>💾 บันทึก</button>
            <button onClick={cancelEditing}>ยกเลิก</button>
          </>
        ) : (
          <>
            <p>{field.close_hours || "❌ ไม่มีข้อมูล"}</p>
            <button
              onClick={() => startEditing("close_hours", field.close_hours)}
            >
              ✏️ แก้ไข
            </button>
          </>
        )}

        <br />
        <label>📍 ค่ามัดจำ:</label>
        {editingField === "price_deposit" ? (
          <>
            <input
              type="text"
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
            />
            <button onClick={() => saveField("price_deposit")}>
              💾 บันทึก
            </button>
            <button onClick={cancelEditing}>ยกเลิก</button>
          </>
        ) : (
          <>
            <p>
              {field.price_deposit === 0
                ? "ไม่มีค่ามัดจำ"
                : field.price_deposit || "❌ ไม่มีข้อมูล"}
            </p>
            <button
              onClick={() => startEditing("price_deposit", field.price_deposit)}
            >
              ✏️ แก้ไข
            </button>
          </>
        )}

        <br />
        <label>🏦 ธนาคาร:</label>
        {editingField === "name_bank" ? (
          <>
            <input
              type="text"
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
            />
            <button onClick={() => saveField("name_bank")}>💾 บันทึก</button>
            <button onClick={cancelEditing}> ยกเลิก</button>
          </>
        ) : (
          <>
            <p>{field.name_bank || "❌ ไม่มีข้อมูล"}</p>
            <button onClick={() => startEditing("name_bank", field.name_bank)}>
              ✏️ แก้ไข
            </button>
          </>
        )}

        <br />
        <label>รูป:</label>
        {editingField === "img_field" ? (
          <>
            <input type="file" onChange={handleChange} />
            {previewUrl && <img src={previewUrl} alt="preview" />}
            <button onClick={() => saveField("img_field")}>💾 บันทึก</button>
            <button onClick={cancelEditing}> ยกเลิก</button>
          </>
        ) : (
          <>
            <p>
              <img
                src={`${API_URL}/${field.img_field}`} // ✅ แสดงรูปจาก path ที่ backend ส่งมา
                alt="รูปสนามกีฬา"
                className="field-image"
              />
            </p>
            <button onClick={() => startEditing("img_field", field.img_field)}>
              ✏️ แก้ไข
            </button>
          </>
        )}

        <br />
        <label>เอกสาร:</label>
        {editingField === "documents" ? (
          <>
            <input type="file" onChange={handleChange} />
            <button onClick={() => saveField("documents")}>💾 บันทึก</button>
            <button onClick={cancelEditing}> ยกเลิก</button>
          </>
        ) : (
          <>
            <div>
              {" "}
              {field?.documents ? (
                <div className="document-container">
                  <a
                    href={`${API_URL}/${field.documents}`} //  ใช้ Path ที่ Backend ส่งมาโดยตรง
                    target="_blank"
                    rel="noopener noreferrer"
                    className="document-link"
                  >
                    <p>เอกสารที่แนบมา</p>
                    <div className="doc"></div>
                  </a>
                </div>
              ) : (
                <p>ไม่มีเอกสารแนบ</p>
              )}
            </div>
            <button onClick={() => startEditing("documents", field.documents)}>
              ✏️ แก้ไข
            </button>
          </>
        )}

        <br />
        <label>เอกสาร:</label>
        {subFields.map((sub, index) => (
          <div key={sub.sub_field_id} className="sub-field-card">
            <h2>สนามย่อย</h2>

            {editingField === "sub_fields" ? (
              <>
                <input
                  type="text"
                  value={sub.sub_field_name || ""}
                  onChange={(e) =>
                    handleSubFieldChange(
                      index,
                      "sub_field_name",
                      e.target.value
                    )
                  }
                />
                <input
                  type="number"
                  value={sub.price ?? ""}
                  onChange={(e) =>
                    handleSubFieldChange(index, "price", e.target.value)
                  }
                />
                <button onClick={() => saveSubField(sub)}>💾 บันทึก</button>
                <button onClick={cancelEditing}>❌ ยกเลิก</button>
              </>
            ) : (
              <>
                <p>
                  <strong>ชื่อสนามย่อย:</strong> {sub.sub_field_name}
                </p>
                <p>
                  <strong>ราคา:</strong> {sub.price} บาท
                </p>
                <button
                  onClick={() => startEditing("sub_fields", sub.sub_field_name)}
                >
                  ✏️ แก้ไข
                </button>
              </>
            )}
          </div>
        ))}

        <button onClick={() => router.push("/")} className="back-btn">
          🔙 กลับไปหน้าหลัก
        </button>
      </div>
    </div>
  );
}
