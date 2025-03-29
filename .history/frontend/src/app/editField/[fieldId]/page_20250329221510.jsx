"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import "@/app/css/editfield.css";
import Navbar from "@/app/components/Navbar";

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
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)

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
    if (user.role !== "admin" && user.role !== "field_owner") {
      router.push("/");
    }
    console.log(user);
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
      setMessage("กรุณาเลือกประเภทกีฬาก่อนบันทึก");
      setMessageType("error");
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
        setMessage("อัปเดตสนามย่อยสำเร็จ");
        setMessageType("success");
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
        setMessage("เกิดข้อผิดพลาดในการอัปเดตข้อมูลสนาม");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error saving sub-field:", error);
      setMessage(error);
      setMessageType("error");
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
          setMessage("กรุณาเลือกไฟล์ก่อนอัปโหลด");
          setMessageType("error");
          return;
        }
        const formData = new FormData();
        const token = localStorage.getItem("token");
        formData.append(fieldName, selectedFile);
        const uploadEndpoint =
          fieldName === "img_field"
            ? `${API_URL}/field/${fieldId}/upload-image`
            : `${API_URL}/field/${fieldId}/upload-document`;
        const response = await fetch(uploadEndpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        let result = {};
        try {
          result = await response.json();
        } catch (err) {
          console.error("ไม่สามารถแปลง response เป็น JSON ได้:", err);
        }
        if (response.ok) {
          setMessage("อัปโหลดไฟล์สำเร็จ");
          setMessageType("success");
          setField({ ...field, [fieldName]: result.path || selectedFile.name });
          setEditingField(null);
          setSelectedFile(null);
        } else {
          setMessage("เกิดข้อผิดพลาด: " + (result.error || "ไม่ทราบสาเหตุ"));
          setMessageType("error");
        }
        return;
      }
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/field/edit/${fieldId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [fieldName]: updatedValue }),
      });
      let result = {};
      try {
        result = await response.json();
      } catch (err) {
        console.error("แปลง JSON ล้มเหลว:", err);
      }
      if (response.ok) {
        setField({ ...field, [fieldName]: updatedValue });
        setEditingField(null);
        setMessage("อัปเดตข้อมูลสำเร็จ");
        setMessageType("success");
      } else {
        setMessage("เกิดข้อผิดพลาด: " + (result.error || "ไม่ทราบสาเหตุ"));
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error saving field:", error);
      setMessage("ไม่สามารถบันทึกข้อมูลได้");
      setMessageType("error");
    }
  };

  const addSubField = async (userId) => {
    if (!newSportId) {
      setMessage("กรุณาเลือกประเภทกีฬาก่อนเพิ่มสนาม");
      setMessageType("error");
      return;
    }
  
    const token = localStorage.getItem("token");
  
    const payload = {
      sub_field_name: newSubField.sub_field_name,
      price: newSubField.price,
      sport_id: newSportId,
      user_id: userId,
    };
  
    console.log("🚀 Payload:", payload);
  
    const response = await fetch(`${API_URL}/field/subfield/${fieldId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  
    console.log("✅ Response Status:", response.status);
    const text = await response.clone().text();
    console.log("✅ Raw Response:", text);
  
    let newField;
    try {
      newField = JSON.parse(text);
    } catch (e) {
      console.error("❌ Error parsing JSON:", e);
      setMessage("เกิดข้อผิดพลาดในการแปลงข้อมูล");
      setMessageType("error");
      return;
    }
  
    if (response.ok) {
      setSubFields([...subFields, newField]);
      setMessage("เพิ่มสนามย่อยสำเร็จ");
      setMessageType("success");
  
      return setTimeout(() => {
        console.log("✅ จะรีเฟรชแล้ว");
        window.location.href = window.location.href;
      }, 1500);
    } else {
      setMessage(newField?.error || "ไม่สามารถเพิ่มสนามย่อยได้");
      setMessageType("error");
    }
  };
  
  const handleDeleteClick = async (subField) => {
    const confirmDelete = window.confirm(
      "ลบสนามย่อยนี้และกิจกรรมพิเศษทั้งหมด?"
    );
    if (!confirmDelete) return;

    // ลบ add-ons ก่อน
    if (subField.add_ons && subField.add_ons.length > 0) {
      for (const addon of subField.add_ons) {
        await deleteAddOn(addon.add_on_id);
      }
    }

    // แล้วค่อยลบสนามย่อย
    deleteSubField(subField.sub_field_id);
  };

  const deleteSubField = async (sub_field_id) => {
    console.log("Sub-field ID:", sub_field_id); // Check the ID passed
    if (!sub_field_id || isNaN(sub_field_id)) {
      setMessage("Invalid sub-field ID");
      setMessageType("error");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_URL}/field/delete/subfield/${sub_field_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setMessage("ลบสนามย่อยสำเร็จ");
        setMessageType("success");
        setSubFields((prevSubFields) =>
          prevSubFields.filter((sub) => sub.sub_field_id !== sub_field_id)
        );
      } else {
        const errorData = await response.json();
        setMessage(`${errorData.error || "เกิดข้อผิดพลาดในการลบสนาม"}`);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error deleting sub-field:", error);
      setMessage("Error deleting sub-field");
      setMessageType("error");
    }
  };

  const addAddOn = async (subFieldId, content, price) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/field/addon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sub_field_id: subFieldId,
          content,
          price,
        }),
      });
      const result = await res.json();
      console.log("เพิ่ม Add-on:", result);
      setMessage("เพิ่มสำเร็จ");
      setMessageType("success");
    } catch (err) {
      console.error("ผิดพลาดขณะเพิ่ม Add-on:", err);
      setMessage("err", err);
      setMessageType("error");
    }
  };

  const deleteAddOn = async (add_on_id) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_URL}/field/delete/addon/${add_on_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setMessage("ลบสำเร็จ");
        setMessageType("success");
        setAddons((prevAddons) =>
          prevAddons.filter((addon) => addon.add_on_id !== add_on_id)
        );
      } else {
        setMessage("เกิดข้อผิดพลาดในการลบ Add-On");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error deleting add-on:", error);
    }
  };

  const saveAddon = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/field/add_on/${editingAddon.addOnId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: editingAddon.content,
            price: editingAddon.price,
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        setMessage("แก้ไขสำเร็จ");
        setMessageType("success");
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
        setMessage("เกิดข้อผิดพลาดในการอัปเดต");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error saving add-on:", error);
    }
  };

  // เก็บค่า input ของ Add-on แยกตาม sub_field_id
  const handleAddOnInputChange = (subFieldId, key, value) => {
    setAddOnInputs((prev) => ({
      ...prev,
      [subFieldId]: {
        ...prev[subFieldId],
        [key]: value,
      },
    }));
  };
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      <div className="navbar">
        <Navbar></Navbar>
      </div>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="container">
        <h2>รายละเอียดสนามกีฬา</h2>
        <div className="field-details">
          <div className="input-group">
            <label>ชื่อสนาม: </label>
            {editingField === "field_name" ? (
              <>
                <input
                  type="text"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                />
                <button
                  className="savebtn"
                  onClick={() => saveField("field_name")}
                >
                  บันทึก
                </button>
                <button className="canbtn" onClick={cancelEditing}>
                  ยกเลิก
                </button>
              </>
            ) : (
              <>
                <p>{field?.field_name || "ไม่มีข้อมูล"}</p>
                <div>
                  <button
                    className="editbtn"
                    onClick={() =>
                      startEditing("field_name", field?.field_name)
                    }
                  >
                    แก้ไข
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="input-group">
            <label>ที่อยู่: </label>
            {editingField === "address" ? (
              <>
                <input
                  type="text"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                />
                <button
                  className="savebtn"
                  onClick={() => saveField("address")}
                >
                  บันทึก
                </button>
                <button className="canbtn" onClick={cancelEditing}>
                  ยกเลิก
                </button>
              </>
            ) : (
              <>
                <p>{field?.address || "ไม่มีข้อมูล"}</p>
                <div>
                  <button
                    className="editbtn"
                    onClick={() => startEditing("address", field?.address)}
                  >
                    แก้ไข
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="input-group">
            <label>พิกัดGPS: </label>
            {editingField === "gps_location" ? (
              <>
                <input
                  type="text"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                />
                <button
                  className="savebtn"
                  onClick={() => saveField("gps_location")}
                >
                  บันทึก
                </button>
                <button className="canbtn" onClick={cancelEditing}>
                  ยกเลิก
                </button>
              </>
            ) : (
              <>
                <p>
                  <a
                    href={field?.gps_location}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {field?.gps_location || "ไม่มีข้อมูล"}
                  </a>
                </p>
                <div>
                  <button
                    className="editbtn"
                    onClick={() =>
                      startEditing("gps_location", field?.gps_location)
                    }
                  >
                    แก้ไข
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="input-group">
            <label>เวลเปิด: </label>
            {editingField === "open_hours" ? (
              <>
                <input
                  type="time"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                />
                <button
                  className="savebtn"
                  onClick={() => saveField("open_hours")}
                >
                  บันทึก
                </button>
                <button className="canbtn" onClick={cancelEditing}>
                  ยกเลิก
                </button>
              </>
            ) : (
              <>
                <p>{field?.open_hours || "ไม่มีข้อมูล"}</p>
                <div>
                  <button
                    className="editbtn"
                    onClick={() =>
                      startEditing("open_hours", field?.open_hours)
                    }
                  >
                    แก้ไข
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="input-group">
            <label>เวลาปิด: </label>
            {editingField === "close_hours" ? (
              <>
                <input
                  type="time"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                />
                <button
                  className="savebtn"
                  onClick={() => saveField("close_hours")}
                >
                  บันทึก
                </button>
                <button className="canbtn" onClick={cancelEditing}>
                  ยกเลิก
                </button>
              </>
            ) : (
              <>
                <p>{field?.close_hours || "ไม่มีข้อมูล"}</p>
                <div>
                  <button
                    className="editbtn"
                    onClick={() =>
                      startEditing("close_hours", field?.close_hours)
                    }
                  >
                    แก้ไข
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="input-group">
            <label>ค่ามัดจำ: </label>
            {editingField === "price_deposit" ? (
              <>
                <input
                  min="0"
                  type="number"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(Math.abs(e.target.value))}
                />
                <button
                  className="savebtn"
                  onClick={() => saveField("price_deposit")}
                >
                  บันทึก
                </button>
                <button className="canbtn" onClick={cancelEditing}>
                  ยกเลิก
                </button>
              </>
            ) : (
              <>
                <p>
                  {field?.price_deposit === 0
                    ? "ไม่มีค่ามัดจำ"
                    : field?.price_deposit || "ไม่มีข้อมูล"}
                </p>
                <div>
                  <button
                    className="editbtn"
                    onClick={() =>
                      startEditing("price_deposit", field?.price_deposit)
                    }
                  >
                    แก้ไข
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="input-group">
            <label>ธนาคาร: </label>
            {editingField === "name_bank" ? (
              <>
                <input
                  type="text"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                />
                <button
                  className="savebtn"
                  onClick={() => saveField("name_bank")}
                >
                  บันทึก
                </button>
                <button className="canbtn" onClick={cancelEditing}>
                  ยกเลิก
                </button>
              </>
            ) : (
              <>
                <p>{field?.name_bank || "ไม่มีข้อมูล"}</p>
                <div>
                  <button
                    className="editbtn"
                    onClick={() => startEditing("name_bank", field?.name_bank)}
                  >
                    แก้ไข
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="input-group">
            <label>ชื่อเจ้าของบัญชี: </label>
            {editingField === "account_holder" ? (
              <>
                <input
                  type="text"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                />
                <button
                  className="savebtn"
                  onClick={() => saveField("account_holder")}
                >
                  บันทึก
                </button>
                <button className="canbtn" onClick={cancelEditing}>
                  ยกเลิก
                </button>
              </>
            ) : (
              <>
                <p>{field?.account_holder || "ไม่มีข้อมูล"}</p>
                <div>
                  <button
                    className="editbtn"
                    onClick={() =>
                      startEditing("account_holder", field?.account_holder)
                    }
                  >
                    แก้ไข
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="input-group">
            <label>เลขบัญชี: </label>
            {editingField === "number_bank" ? (
              <>
                <input
                  type="text"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                  maxLength={13}
                />
                <button
                  className="savebtn"
                  onClick={() => saveField("number_bank")}
                >
                  บันทึก
                </button>
                <button className="canbtn" onClick={cancelEditing}>
                  ยกเลิก
                </button>
              </>
            ) : (
              <>
                <p>{field?.number_bank || "ไม่มีข้อมูล"}</p>
                <div>
                  <button
                    className="editbtn"
                    onClick={() =>
                      startEditing("number_bank", field?.number_bank)
                    }
                  >
                    แก้ไข
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="input-group">
            <label>รายละเอียดสนาม: </label>
            {editingField === "field_description" ? (
              <>
                <textarea
                  className="textarea"
                  type="text"
                  value={updatedValue}
                  onChange={(e) => setUpdatedValue(e.target.value)}
                />
                <button
                  className="savebtn"
                  onClick={() => saveField("field_description")}
                >
                  บันทึก
                </button>
                <button className="canbtn" onClick={cancelEditing}>
                  ยกเลิก
                </button>
              </>
            ) : (
              <>
                <p>{field?.field_description || "ไม่มีข้อมูล"}</p>
                <div>
                  <button
                    className="editbtn"
                    onClick={() =>
                      startEditing(
                        "field_description",
                        field?.field_description
                      )
                    }
                  >
                    แก้ไข
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="input-group">
            <label>รูปโปรไฟล์</label>
          </div>
          {editingField === "img_field" ? (
            <div className="preview-container">
              <input type="file" onChange={handleChange} />
              {previewUrl && <img src={previewUrl} alt="preview" />}
              <button
                className="savebtn"
                onClick={() => saveField("img_field")}
              >
                บันทึก
              </button>
              <button className="canbtn" onClick={cancelEditing}>
                ยกเลิก
              </button>
            </div>
          ) : (
            <>
              <img
                src={`${API_URL}/${field?.img_field}`}
                alt="รูปสนามกีฬา"
                className="preview-container"
              />
              <div className="input-group">
                <button
                  className="editbtn"
                  onClick={() => startEditing("img_field", field?.img_field)}
                >
                  แก้ไข
                </button>
              </div>
            </>
          )}

          <div className="input-group">
            <label>เอกสาร</label>
            {editingField === "documents" ? (
              <>
                <input type="file" onChange={handleChange} />
                <button
                  className="savebtn"
                  onClick={() => saveField("documents")}
                >
                  บันทึก
                </button>
                <button className="canbtn" onClick={cancelEditing}>
                  ยกเลิก
                </button>
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
                        <p>เอกสารที่ส่งไป</p>
                        <div className="doc"></div>
                      </a>
                    </div>
                  ) : (
                    <p>ไม่มีเอกสารแนบ</p>
                  )}
                </div>
                <button
                  className="editbtn"
                  onClick={() => startEditing("documents", field.documents)}
                >
                  แก้ไข
                </button>
              </>
            )}
          </div>
        </div>

        {/* Subfield และ Addon ด้านล่างอยู่ครบใน canvas แล้ว */}
        {/* แสดง Subfield และ Add-on พร้อมปุ่มแก้ไข/เพิ่ม Add-on */}
        <div className="sub-fields-container">
          <h2>สนามย่อย</h2>
          {subFields.map((sub, index) => (
            <div key={sub.sub_field_id} className="sub-field-card">
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
                    onChange={(e) => setUpdatedPrice(Math.abs(e.target.value))}
                  />
                  <select
                    value={updatedSportId}
                    onChange={(e) => setUpdatedSportId(e.target.value)}
                    className="sport-select"
                  >
                    <option value="">เลือกประเภทกีฬา</option>
                    {sportsCategories.map((category) => (
                      <option key={category.sport_id} value={category.sport_id}>
                        {category.sport_name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="savebtn"
                    onClick={() => saveSubField(sub.sub_field_id)}
                  >
                    บันทึก
                  </button>
                  <button className="canbtn" onClick={() => cancelEditing()}>
                    ยกเลิก
                  </button>
                </>
              ) : (
                <div>
                  <div className="input-group">
                    <div>
                      <label>ชื่อสนามย่อย: </label>
                      <p>{sub.sub_field_name}</p>
                    </div>
                    <div>
                      <label>ราคา: </label>
                      <p>{sub.price} บาท</p>
                    </div>
                    <div>
                      <label>ประเภทกีฬา: </label>
                      <p>{sub.sport_name}</p>
                    </div>
                    <div>
                      <button
                        className="editbtn"
                        onClick={() => startEditingSubField(sub)}
                      >
                        แก้ไข
                      </button>
                      <button
                        className="delsub"
                        onClick={() => handleDeleteClick(sub)}
                      >
                        ลบสนามย่อย
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {sub.add_ons && sub.add_ons.length > 0 ? (
                <div className="add-ons-container">
                  <div className="input-group">
                    <label>ราคากิจกรรมพิเศษของสนามย่อย</label>
                    <div>
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
                                    price: Math.abs(e.target.value),
                                  })
                                }
                              />
                              <button className="savebtn" onClick={saveAddon}>
                                บันทึก
                              </button>
                              <button
                                className="canbtn"
                                onClick={() =>
                                  setEditingAddon({
                                    addOnId: null,
                                    content: "",
                                    price: "",
                                  })
                                }
                              >
                                ยกเลิก
                              </button>
                            </>
                          ) : (
                            <>
                              {addon.content} - {addon.price} บาท
                              <button
                                className="editbtn"
                                onClick={() => startEditingAddon(addon)}
                              >
                                แก้ไข
                              </button>
                              <button
                                className="canbtn"
                                onClick={() => deleteAddOn(addon.add_on_id)}
                              >
                                ลบกิจกรรมพิเศษ
                              </button>
                            </>
                          )}
                        </li>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="input-group">
                  <label>ไม่มีกิจกรรมพิเศษ</label>
                </div>
              )}

              {/* ✅ ปุ่ม toggle แสดง/ซ่อนฟอร์ม Add-on */}
              <div className="input-group">
                <button
                  className="savebtn"
                  onClick={() =>
                    setShowAddOnForm((prev) => ({
                      ...prev,
                      [sub.sub_field_id]: !prev[sub.sub_field_id],
                    }))
                  }
                >
                  {showAddOnForm[sub.sub_field_id]
                    ? "ยกเลิกกิจกรรมพิเศษ"
                    : "เพิ่มกิจกรรมพิเศษ"}
                </button>
              </div>
              {/* ✅ เงื่อนไขแสดงฟอร์มเพิ่ม Add-on */}
              {showAddOnForm[sub.sub_field_id] && (
                <div className="add-addon-form">
                  <input
                    type="text"
                    placeholder="ชื่อกิจกรรมพิเศษ"
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
                        Math.abs(e.target.value)
                      )
                    }
                  />

                  <button
                    className="savebtn"
                    onClick={async () => {
                      const content = addOnInputs[sub.sub_field_id]?.content;
                      const price = addOnInputs[sub.sub_field_id]?.price;
                      if (!content || !price) {
                        setMessage("กรุณากรอกชื่อและราคาของ Add-on");
                        setMessageType("error");
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
                    บันทึกกิจกรรมพิเศษ
                  </button>
                </div>
              )}
            </div>
          ))}
          {/* ปุ่มเดียวสำหรับเพิ่มสนามย่อย */}
          <div className="input-group">
            {!showAddSubFieldForm ? (
              <button
                className="editbtn"
                onClick={() => setShowAddSubFieldForm(true)}
              >
                เพิ่มสนามย่อย
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
                    setNewSubField({
                      ...newSubField,
                      price: Math.abs(e.target.value),
                    })
                  }
                />
                <select
                  value={newSportId}
                  onChange={(e) => setNewSportId(e.target.value)}
                  className="sport-select"
                >
                  <option value="">เลือกประเภทกีฬา</option>
                  {sportsCategories.map((category) => (
                    <option key={category.sport_id} value={category.sport_id}>
                      {category.sport_name}
                    </option>
                  ))}
                </select>
                <button
                  className="savebtn"
                  onClick={async () => {
                    if (!userId) {
                      setMessage("ยังไม่ได้โหลด user_id จาก localStorage");
                      setMessageType("error");
                      return;
                    }
                    await addSubField(userId);
                    setNewSubField({
                      sub_field_name: "",
                      price: "",
                      sport_id: "",
                    });
                    setShowAddSubFieldForm(false);
                  }}
                >
                  บันทึกสนามย่อย
                </button>

                <button
                  className="canbtn"
                  onClick={() => setShowAddSubFieldForm(false)}
                >
                  ยกเลิก
                </button>
              </div>
            )}
          </div>
        </div>

        <button onClick={() => router.push("/")} className="savebtn">
          กลับไปหน้าหลัก
        </button>
      </div>
    </>
  );
}
