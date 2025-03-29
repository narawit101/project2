"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function CheckFieldDetail() {
  const { fieldId } = useParams();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [userId, setUserId] = useState(null);
  const [newSportId, setNewSportId] = useState(""); // State for selected sport when adding new sub-field
  const [sportsCategories, setSportsCategories] = useState([]); // Declare sportsCategories state
  const [updatedSubFieldName, setUpdatedSubFieldName] = useState("");
  const [updatedPrice, setUpdatedPrice] = useState("");
  const [updatedSportId, setUpdatedSportId] = useState("");
  const [field, setField] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [updatedValue, setUpdatedValue] = useState("");
  const [subFields, setSubFields] = useState([]);
  const [addons, setAddons] = useState([]);
  const [addOnInputs, setAddOnInputs] = useState({});
  const [newSubField, setNewSubField] = useState({
    sub_field_name: "",
    price: "",
    sport_id: "",
  });
  const [editingAddon, setEditingAddon] = useState({
    addOnId: null,
    content: "",
    price: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showAddSubFieldForm, setShowAddSubFieldForm] = useState(false);
  const [showAddOnForm, setShowAddOnForm] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const expiresAt = localStorage.getItem("expiresAt");

    if (
      !token ||
      !storedUser ||
      !expiresAt ||
      Date.now() > parseInt(expiresAt)
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("expiresAt");
      router.push("/login");
      return;
    }

    const user = JSON.parse(storedUser);
    setCurrentUser(user);
    setUserId(user.user_id);
    console.log("✅ โหลด user:", user); // เพิ่ม log
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!fieldId) return;

    const token = localStorage.getItem("token"); // ดึง token จาก localStorage

    fetch(`${API_URL}/field/${fieldId}`, {
      method: "GET", // ใช้ method GET ในการดึงข้อมูล
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ส่ง token ใน Authorization header
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setMessage("ไม่พบข้อมูลสนามกีฬา");
          setMessageType("error");
          router.push("/"); // กลับไปหน้าหลักถ้าเกิดข้อผิดพลาด
        } else {
          console.log(" ข้อมูลสนามกีฬา:", data); // ตรวจสอบข้อมูลที่ได้จาก Backend
          setField(data);
          setSubFields(data.sub_fields || []);
        }
      })
      .catch((error) => console.error("Error fetching field data:", error));
  }, [fieldId, router]);

  useEffect(() => {
    const fetchSportsCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/sports_types/preview/type`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.ok) {
          setSportsCategories(data); // Populate the sports categories state
        } else {
          console.error("Error fetching sports categories:", data.error);
        }
      } catch (error) {
        console.error("Error fetching sports categories:", error);
      }
    };

    fetchSportsCategories();
  }, []);

  const startEditing = (fieldName, currentValue) => {
    setEditingField(fieldName);
    setUpdatedValue(currentValue);
  };

  const saveSubField = async (sub_field_id) => {
    if (!updatedSportId) {
      alert("❌ กรุณาเลือกประเภทกีฬาก่อนบันทึก");
      return; 
    }
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `${API_URL}/field/supfiled/${sub_field_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sub_field_name: updatedSubFieldName,
            price: updatedPrice,
            sport_id: updatedSportId,
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        alert("✅ อัปเดตสนามย่อยสำเร็จ");
        setSubFields((prevSubFields) =>
          prevSubFields.map((sub) =>
            sub.sub_field_id === sub_field_id
              ? {
                  ...sub,
                  sub_field_name: updatedSubFieldName,
                  price: updatedPrice,
                  sport_id: updatedSportId,
                }
              : sub
          )
        );
        cancelEditing();
      } else {
        alert("❌ เกิดข้อผิดพลาดในการอัปเดตข้อมูลสนาม");
      }
    } catch (error) {
      console.error("❌ Error saving sub-field:", error);
    }
  };

  const startEditingSubField = (sub) => {
    setEditingField(sub.sub_field_id);
    setUpdatedSubFieldName(sub.sub_field_name);
    setUpdatedPrice(sub.price);
    setUpdatedSportId(sub.sport_id);
  };

  const startEditingAddon = (addon) => {
    setEditingAddon({
      addOnId: addon.add_on_id,
      content: addon.content,
      price: addon.price,
    });
  };

  const cancelEditing = () => {
    setEditingField(null);
    setUpdatedSubFieldName("");
    setUpdatedPrice("");
    setUpdatedSportId("");
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setUpdatedValue(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const saveField = async (fieldName) => {
    try {
      if (fieldName === "img_field" || fieldName === "documents") {
        if (!selectedFile) {
          alert("❌ กรุณาเลือกไฟล์ก่อนอัปโหลด");
          return;
        }
        const formData = new FormData();
        formData.append(fieldName, selectedFile);
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

  const addSubField = async (userId) => {
    if (!newSportId) {
      alert("❌ กรุณาเลือกประเภทกีฬาก่อนเพิ่มสนาม");
      return; // Prevent adding if no sport is selected or sport_id is invalid
    }

    const response = await fetch(`${API_URL}/field/subfield/${fieldId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sub_field_name: newSubField.sub_field_name,
        price: newSubField.price,
        sport_id: newSportId, // Use newSportId instead of newSubField.sport_id
        user_id: userId, // Pass the userId parameter
      }),
    });

    const newField = await response.json();
    if (response.ok) {
      setSubFields([...subFields, newField]); // Update the subFields state with the new sub-field
    } else {
      alert("❌ ไม่สามารถเพิ่มสนามย่อยได้");
    }
  };
  
  const deleteSubField = async (sub_field_id) => {
    const token = localStorage.getItem("token");
  
    try {
      const response = await fetch(`${API_URL}/field/subfield/${sub_field_id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        alert("✅ ลบสนามย่อยสำเร็จ");
        setSubFields((prevSubFields) =>
          prevSubFields.filter((sub) => sub.sub_field_id !== sub_field_id)
        );
      } else {
        alert("❌ เกิดข้อผิดพลาดในการลบสนาม");
      }
    } catch (error) {
      console.error("❌ Error deleting sub-field:", error);
    }
  };
  

  const addAddOn = async (subFieldId, content, price) => {
    console.log("📡 API_URL = ", API_URL); // ✅ เช็กค่าที่ได้จริง
    console.log("📤 ส่ง:", { subFieldId, content, price });

    if (!API_URL) {
      alert("❌ API_URL ไม่ถูกกำหนด");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/field/addon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sub_field_id: subFieldId,
          content,
          price,
        }),
      });
      const result = await res.json();
      console.log("✅ เพิ่ม Add-on:", result);
    } catch (err) {
      console.error("❌ ผิดพลาดขณะเพิ่ม Add-on:", err);
    }
  };

  const deleteAddOn = async (add_on_id) => {
    const token = localStorage.getItem("token");
  
    try {
      const response = await fetch(`${API_URL}/field/addon/${add_on_id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.ok) {
        alert("✅ ลบ Add-On สำเร็จ");
        setAddons((prevAddons) =>
          prevAddons.filter((addon) => addon.add_on_id !== add_on_id)
        );
      } else {
        alert("❌ เกิดข้อผิดพลาดในการลบ Add-On");
      }
    } catch (error) {
      console.error("❌ Error deleting add-on:", error);
    }
  };

  const saveAddon = async () => {
    try {
      const response = await fetch(
        `${API_URL}/field/add_on/${editingAddon.addOnId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: editingAddon.content,
            price: editingAddon.price,
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        alert("✅ อัปเดต Add-on สำเร็จ");
        setSubFields((prevSubFields) =>
          prevSubFields.map((sub) => ({
            ...sub,
            add_ons: sub.add_ons.map((addon) =>
              addon.add_on_id === editingAddon.addOnId
                ? {
                    ...addon,
                    content: editingAddon.content,
                    price: editingAddon.price,
                  }
                : addon
            ),
          }))
        );
        setEditingAddon({ addOnId: null, content: "", price: "" });
      } else {
        alert("❌ เกิดข้อผิดพลาดในการอัปเดต Add-on");
      }
    } catch (error) {
      console.error("❌ Error saving add-on:", error);
    }
  };

  // ✅ เก็บค่า input ของ Add-on แยกตาม sub_field_id
  const handleAddOnInputChange = (subFieldId, key, value) => {
    setAddOnInputs((prev) => ({
      ...prev,
      [subFieldId]: {
        ...prev[subFieldId],
        [key]: value,
      },
    }));
  };

  return (
    <div className="container">
      <h2>รายละเอียดสนามกีฬา</h2>

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
            <p>{field?.first_name || "❌ ไม่มีข้อมูล"}</p>
            <button
              onClick={() => startEditing("first_name", field?.first_name)}
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
            <p>{field?.last_name || "❌ ไม่มีข้อมูล"}</p>
            <button onClick={() => startEditing("last_name", field?.last_name)}>
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
            <p>{field?.email || "❌ ไม่มีข้อมูล"}</p>
            <button onClick={() => startEditing("email", field?.email)}>
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
            <p>{field?.field_name || "❌ ไม่มีข้อมูล"}</p>
            <button
              onClick={() => startEditing("field_name", field?.field_name)}
            >
              ✏️ แก้ไข
            </button>
          </>
        )}

        <br />
        <label>📍ที่อยู่:</label>
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
            <p>{field?.address || "❌ ไม่มีข้อมูล"}</p>
            <button onClick={() => startEditing("address", field?.address)}>
              ✏️ แก้ไข
            </button>
          </>
        )}

        <br />
        <label>📍พิกัด:</label>
        {editingField === "gps_location" ? (
          <>
            <input
              type="text"
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
            />
            <button onClick={() => saveField("gps_location")}>💾 บันทึก</button>
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
              onClick={() => startEditing("gps_location", field?.gps_location)}
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
            <p>{field?.open_hours || "❌ ไม่มีข้อมูล"}</p>
            <button
              onClick={() => startEditing("open_hours", field?.open_hours)}
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
            <p>{field?.close_hours || "❌ ไม่มีข้อมูล"}</p>
            <button
              onClick={() => startEditing("close_hours", field?.close_hours)}
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
              {field?.price_deposit === 0
                ? "ไม่มีค่ามัดจำ"
                : field?.price_deposit || "❌ ไม่มีข้อมูล"}
            </p>
            <button
              onClick={() =>
                startEditing("price_deposit", field?.price_deposit)
              }
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
            <button onClick={cancelEditing}>ยกเลิก</button>
          </>
        ) : (
          <>
            <p>{field?.name_bank || "❌ ไม่มีข้อมูล"}</p>
            <button onClick={() => startEditing("name_bank", field?.name_bank)}>
              ✏️ แก้ไข
            </button>
          </>
        )}

        <br />
        <label>รายละเอียดสนาม:</label>
        {editingField === "field_description" ? (
          <>
            <input
              type="text"
              value={updatedValue}
              onChange={(e) => setUpdatedValue(e.target.value)}
            />
            <button onClick={() => saveField("field_description")}>
              💾 บันทึก
            </button>
            <button onClick={cancelEditing}>ยกเลิก</button>
          </>
        ) : (
          <>
            <p>{field?.field_description || "❌ ไม่มีข้อมูล"}</p>
            <button
              onClick={() =>
                startEditing("field_description", field?.field_description)
              }
            >
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
            <button onClick={cancelEditing}>ยกเลิก</button>
          </>
        ) : (
          <>
            <p>
              <img
                src={`${API_URL}/${field?.img_field}`}
                alt="รูปสนามกีฬา"
                className="field-image"
              />
            </p>
            <button onClick={() => startEditing("img_field", field?.img_field)}>
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
            <button onClick={cancelEditing}>ยกเลิก</button>
          </>
        ) : (
          <>
            <div>
              {field?.documents ? (
                <div className="document-container">
                  <a
                    href={`${API_URL}/${field.documents}`}
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
      </div>

      {/* 🔁 Subfield และ Addon ด้านล่างอยู่ครบใน canvas แล้ว */}
      {/* ✅ แสดง Subfield และ Add-on พร้อมปุ่มแก้ไข/เพิ่ม Add-on */}
      {subFields.map((sub, index) => (
        <div key={sub.sub_field_id} className="sub-field-card">
          <h2>สนามย่อย</h2>
          {/* Sub-field name, price, and sport type */}
          {editingField === sub.sub_field_id ? (
            <>
              <input
                type="text"
                value={updatedSubFieldName}
                onChange={(e) => setUpdatedSubFieldName(e.target.value)}
              />
              <input
                type="number"
                value={updatedPrice}
                onChange={(e) => setUpdatedPrice(e.target.value)}
              />
              <select
                value={updatedSportId}
                onChange={(e) => setUpdatedSportId(e.target.value)}
              >
                <option value="">เลือกประเภทกีฬา</option>
                {sportsCategories.map((category) => (
                  <option key={category.sport_id} value={category.sport_id}>
                    {category.sport_name}
                  </option>
                ))}
              </select>
              <button onClick={() => saveSubField(sub.sub_field_id)}>
                💾 บันทึก
              </button>
              <button onClick={() => cancelEditing()}>❌ ยกเลิก</button>
            </>
          ) : (
            <>
              <p>
                <strong>ชื่อสนามย่อย:</strong> {sub.sub_field_name}
              </p>
              <p>
                <strong>ราคา:</strong> {sub.price} บาท
              </p>
              <p>
                <strong>ประเภทกีฬา:</strong> {sub.sport_name}
              </p>
              <button onClick={() => startEditingSubField(sub)}>
                ✏️ แก้ไข
              </button>
            </>
          )}

          {/* Add-ons */}
          {sub.add_ons && sub.add_ons.length > 0 ? (
            <div className="add-ons-container">
              <h3>Add-ons</h3>
              <ul>
                {sub.add_ons.map((addon) => (
                  <li key={`${sub.sub_field_id}-${addon.add_on_id}`}>
                    {editingAddon.addOnId === addon.add_on_id ? (
                      <>
                        <input
                          type="text"
                          value={editingAddon.content}
                          onChange={(e) =>
                            setEditingAddon({
                              ...editingAddon,
                              content: e.target.value,
                            })
                          }
                        />
                        <input
                          type="number"
                          value={editingAddon.price}
                          onChange={(e) =>
                            setEditingAddon({
                              ...editingAddon,
                              price: e.target.value,
                            })
                          }
                        />
                        <button onClick={saveAddon}>💾 บันทึก</button>
                        <button
                          onClick={() =>
                            setEditingAddon({
                              addOnId: null,
                              content: "",
                              price: "",
                            })
                          }
                        >
                          ❌ ยกเลิก
                        </button>
                      </>
                    ) : (
                      <>
                        {addon.content} - {addon.price} บาท
                        <button onClick={() => startEditingAddon(addon)}>
                          ✏️ แก้ไข
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>ไม่มี Add-ons</p>
          )}

          {/* ✅ ปุ่ม toggle แสดง/ซ่อนฟอร์ม Add-on */}
          <button
            onClick={() =>
              setShowAddOnForm((prev) => ({
                ...prev,
                [sub.sub_field_id]: !prev[sub.sub_field_id],
              }))
            }
          >
            {showAddOnForm[sub.sub_field_id]
              ? "❌ ยกเลิก Add-on"
              : "➕ เพิ่ม Add-on"}
          </button>

          {/* ✅ เงื่อนไขแสดงฟอร์มเพิ่ม Add-on */}
          {showAddOnForm[sub.sub_field_id] && (
            <div className="add-addon-form">
              <input
                type="text"
                placeholder="ชื่อ Add-on"
                value={addOnInputs[sub.sub_field_id]?.content || ""}
                onChange={(e) =>
                  handleAddOnInputChange(
                    sub.sub_field_id,
                    "content",
                    e.target.value
                  )
                }
              />

              <input
                type="number"
                placeholder="ราคา"
                value={addOnInputs[sub.sub_field_id]?.price || ""}
                onChange={(e) =>
                  handleAddOnInputChange(
                    sub.sub_field_id,
                    "price",
                    e.target.value
                  )
                }
              />

              <button
                onClick={async () => {
                  const content = addOnInputs[sub.sub_field_id]?.content;
                  const price = addOnInputs[sub.sub_field_id]?.price;
                  if (!content || !price) {
                    alert("❌ กรุณากรอกชื่อและราคาของ Add-on");
                    return;
                  }
                  await addAddOn(sub.sub_field_id, content, price);
                  setAddOnInputs((prev) => ({
                    ...prev,
                    [sub.sub_field_id]: { content: "", price: "" },
                  }));
                  setShowAddOnForm((prev) => ({
                    ...prev,
                    [sub.sub_field_id]: false,
                  }));
                }}
              >
                ✅ บันทึก Add-on
              </button>
              <button onClick={() => deleteAddOn(addon.add_on_id)}>ลบ Add-On</button>
            </div>
          )}
        </div>
      ))}
      <br />
      <br />
      {/* ✅ ปุ่มเดียวสำหรับเพิ่มสนามย่อย */}
      <div className="add-subfield-section">
        {!showAddSubFieldForm ? (
          <button onClick={() => setShowAddSubFieldForm(true)}>
            ➕ เพิ่มสนามย่อย
          </button>
        ) : (
          <div className="subfield-form">
            <input
              type="text"
              placeholder="ชื่อสนามย่อย"
              value={newSubField.sub_field_name}
              onChange={(e) =>
                setNewSubField({
                  ...newSubField,
                  sub_field_name: e.target.value,
                })
              }
            />
            <input
              type="number"
              placeholder="ราคา"
              value={newSubField.price}
              onChange={(e) =>
                setNewSubField({ ...newSubField, price: e.target.value })
              }
            />
            <select
              value={newSportId}
              onChange={(e) => setNewSportId(e.target.value)}
            >
              <option value="">เลือกประเภทกีฬา</option>
              {sportsCategories.map((category) => (
                <option key={category.sport_id} value={category.sport_id}>
                  {category.sport_name}
                </option>
              ))}
            </select>
            <button
              onClick={async () => {
                if (!userId) {
                  alert("❌ ยังไม่ได้โหลด user_id จาก localStorage");
                  return;
                }
                await addSubField(userId);
                setNewSubField({ sub_field_name: "", price: "", sport_id: "" });
                setShowAddSubFieldForm(false);
              }}
            >
              ✅ บันทึกสนามย่อย
            </button>

            <button onClick={() => setShowAddSubFieldForm(false)}>
              ❌ ยกเลิก
            </button>
          </div>
        )}
      </div>

      <button onClick={() => router.push("/")} className="back-btn">
        🔙 กลับไปหน้าหลัก
      </button>
    </div>
  );
}
