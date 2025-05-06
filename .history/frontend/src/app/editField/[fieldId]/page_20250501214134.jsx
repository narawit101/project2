"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import "@/app/css/editfield.css";
import { useAuth } from "@/app/contexts/AuthContext";

export default function CheckFieldDetail() {
  const { fieldId } = useParams();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [userId, setUserId] = useState(null);
  const [newSportId, setNewSportId] = useState("");
  const [sportsCategories, setSportsCategories] = useState([]);
  const [updatedSubFieldName, setUpdatedSubFieldName] = useState("");
  const [updatedPrice, setUpdatedPrice] = useState("");
  const [updatedSportId, setUpdatedSportId] = useState("");
  const [field, setField] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [updatedValue, setUpdatedValue] = useState("");
  const [subFields, setSubFields] = useState([]);
  const [addons, setAddons] = useState([]);
  const [addOnInputs, setAddOnInputs] = useState({});
  const [facilities, setFacilities] = useState([]);
  const [allFacilities, setAllFacilities] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState({});
  const [showNewFacilityInput, setShowNewFacilityInput] = useState(false);
  const [newFacility, setNewFacility] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);

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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubField, setSelectedSubField] = useState(null);
  const [showDeleteAddOnModal, setShowDeleteAddOnModal] = useState(false);
  const [selectedAddOn, setSelectedAddOn] = useState(null);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.push("/verification");
    }
    if (user?.role !== "admin" && user?.role !== "field_owner") {
      router.push("/");
    }
  }, [user, isLoading, router, userId]);

  useEffect(() => {
    if (user) {
      if (isLoading) return;
      setUserId(user?.user_id);
    }
  }, [user]);

  useEffect(() => {
    if (!fieldId) return;
    fetch(`${API_URL}/field/${fieldId}`, {
      method: "GET", // ใช้ method GET ในการดึงข้อมูล
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setMessage("ไม่พบข้อมูลสนามกีฬา");
          setMessageType("error");
          router.push("/"); // กลับไปหน้าหลักถ้าเกิดข้อผิดพลาด
        } else {
          setField(data);
          setSubFields(data.sub_fields || []);
        }
      })
      .catch((error) => console.error("Error fetching field data:", error));
  }, [fieldId, router]);

  useEffect(() => {
    const fetchSportsCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/sports_types/preview/type`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
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

  useEffect(() => {
    fetch(`${API_URL}/facilities`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setAllFacilities(data))
      .catch((error) => console.error("Error fetching facilities:", error));
  }, []);

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

  const handleSaveFacilities = async () => {
    if (!selectedFacilities || Object.keys(selectedFacilities).length === 0) {
      setMessage("กรุณาเลือกสิ่งอำนวยความสะดวก");
      setMessageType("error");
      return;
    }
    for (const [facId, fac_price] of Object.entries(selectedFacilities)) {
      if (!fac_price || fac_price < 0) {
        setMessage("กรุณากรอกราคา");
        setMessageType("error");
        return;
      }
    }
    try {
      const res = await fetch(`${API_URL}/field/facilities/${fieldId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ selectedFacilities }),
      });

      const result = await res.json();

      if (res.ok) {
        setSelectedFacilities({});
        setMessage("เพิ่มสิ่งอำนวยความสะดวกสำเร็จ");
        setMessageType("success");
        const refreshRes = await fetch(`${API_URL}/facilities/${fieldId}`);
        const updated = await refreshRes.json();
        setFacilities(updated);
      } else {
        setMessage(result.message || "เกิดข้อผิดพลาด");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setMessageType("error");
    }
  };
  const handleConfirmDelete = (field_id, field_fac_id) => {
    setSelectedFacility({ field_id, field_fac_id });
    setShowModal(true);
  };
  const handleDeleteFacility = async () => {
    const { field_id, field_fac_id } = selectedFacility;

    try {
      const res = await fetch(
        `${API_URL}/field/facilities/${field_id}/${field_fac_id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await res.json();

      if (res.ok) {
        setFacilities((prev) =>
          prev.filter((f) => f.field_fac_id !== field_fac_id)
        );
        setMessage(result.message);
        setMessageType("success");
      } else {
        setMessage(result.message || "เกิดข้อผิดพลาด");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setMessageType("error");
    } finally {
      setShowModal(false);
    }
  };

  const addNewFacility = async () => {
    if (!newFacility.trim()) return;
    const res = await fetch(`${API_URL}/facilities/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ fac_name: newFacility }),
    });

    const data = await res.json();
    if (data.error) {
      setMessage("สิ่งอำนวยความสะดวกนี้มีอยู่แล้ว");
      setMessageType("error");
      return;
    }
    setAllFacilities((prev) => [...prev, data]);
    setNewFacility("");
    setShowNewFacilityInput(false);
  };

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await fetch(`${API_URL}/facilities/${fieldId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch facilities");
        }

        const data = await response.json();
        setFacilities(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchFacilities();
  }, [fieldId]);

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
    try {
      const response = await fetch(
        `${API_URL}/field/supfiled/${sub_field_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
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

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (file.size > MAX_FILE_SIZE) {
      setMessage("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 5MB)");
      setMessageType("error");
      e.target.value = null;
      return;
    }

    if (file.type.startsWith("image/")) {
      setSelectedFile(file);
      setUpdatedValue(file.name);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      e.target.value = null;
      setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพเท่านั้น");
      setMessageType("error");
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

      // ตรวจสอบขนาดไฟล์
      if (file.size > MAX_FILE_SIZE) {
        isValid = false;
        setMessage("ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)");
        setMessageType("error");
        e.target.value = null; // รีเซ็ตไฟล์เมื่อขนาดไฟล์เกิน
        break;
      }

      // ตรวจสอบว่าเป็นไฟล์รูปภาพหรือ PDF
      const fileType = file.type;
      if (!fileType.startsWith("image/") && fileType !== "application/pdf") {
        isValid = false;
        setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพหรือ PDF เท่านั้น");
        setMessageType("error");
        break;
      }
    }

    if (isValid) {
      setSelectedFile(files); // เลือกไฟล์ที่ถูกต้อง
      setUpdatedValue(files[0].name); // อัปเดตชื่อไฟล์ (ใช้ไฟล์แรกในกรณีที่เลือกหลายไฟล์)
    } else {
      e.target.value = null; // รีเซ็ตไฟล์เมื่อไม่ถูกต้อง
    }
  };

  const saveImageField = async () => {
    try {
      if (!selectedFile) {
        setMessage("กรุณาเลือกไฟล์ก่อนอัปโหลด");
        setMessageType("error");
        return;
      }

      const formData = new FormData();
      formData.append("img_field", selectedFile); // ส่งไฟล์รูปภาพเดียว

      const response = await fetch(`${API_URL}/field/${fieldId}/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      let result = await response.json();

      if (response.ok) {
        setMessage("อัปโหลดรูปสำเร็จ");
        setMessageType("success");
        setField({ ...field, img_field: result.path });
        setEditingField(null);
        setSelectedFile(null);
      } else {
        setMessage("เกิดข้อผิดพลาด: " + (result.error || "ไม่ทราบสาเหตุ"));
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error saving image field:", error);
      setMessage("ไม่สามารถบันทึกข้อมูลได้");
      setMessageType("error");
    }
  };

  const saveDocumentField = async () => {
    try {
      if (!selectedFile || selectedFile.length === 0) {
        setMessage("กรุณาเลือกไฟล์เอกสารก่อนอัปโหลด");
        setMessageType("error");
        return;
      }
      const formData = new FormData();
      for (let i = 0; i < selectedFile.length; i++) {
        formData.append("documents", selectedFile[i]); // ส่งไฟล์เอกสารหลายไฟล์
      }

      const response = await fetch(
        `${API_URL}/field/${fieldId}/upload-document`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      let result = await response.json();

      if (response.ok) {
        setMessage("อัปโหลดเอกสารสำเร็จ");
        setMessageType("success");
        setField({
          ...field,
          documents:
            result.paths || selectedFile.map((file) => file.name).join(", "),
        });
        setEditingField(null);
        setSelectedFile(null);
      } else {
        setMessage("เกิดข้อผิดพลาด: " + (result.error || "ไม่ทราบสาเหตุ"));
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error saving document field:", error);
      setMessage("ไม่สามารถบันทึกข้อมูลได้");
      setMessageType("error");
    }
  };

  const saveField = async (fieldName) => {
    try {
      const response = await fetch(`${API_URL}/field/edit/${fieldId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
    // ตรวจสอบว่ามีการเลือกประเภทกีฬาก่อน
    if (!newSportId) {
      setMessage("กรุณาเลือกประเภทกีฬาก่อนเพิ่มสนาม");
      setMessageType("error");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/field/subfield/${fieldId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sub_field_name: newSubField.sub_field_name,
          price: newSubField.price,
          user_id: userId,
          sport_id: newSportId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error: ", errorData);
        setMessage(errorData.message || "ไม่สามารถเพิ่มสนามย่อยได้");
        setMessageType("error");
        return;
      }
      const newField = await response.json();

      setSubFields([...subFields, newField]);
      setMessage("เพิ่มสนามย่อยสำเร็จ");
      setMessageType("success");
    } catch (error) {
      console.error("Error: ", error);
      setMessage("ไม่สามารถเพิ่มสนามย่อยได้");
      setMessageType("error");
    }
  };

  const handleDeleteClick = (subField) => {
    setSelectedSubField(subField);
    setShowDeleteModal(true);
  };

  const confirmDeleteSubField = async () => {
    if (selectedSubField) {
      if (selectedSubField.add_ons && selectedSubField.add_ons.length > 0) {
        for (const addon of selectedSubField.add_ons) {
          await deleteAddOn(addon.add_on_id);
        }
      }
      await deleteSubField(selectedSubField.sub_field_id);
      setShowDeleteModal(false);
      setSelectedSubField(null);
    }
  };

  const deleteSubField = async (sub_field_id) => {
    if (!sub_field_id || isNaN(sub_field_id)) {
      setMessage("Invalid sub-field ID");
      setMessageType("error");
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/field/delete/subfield/${sub_field_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
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
      const res = await fetch(`${API_URL}/field/addon`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sub_field_id: subFieldId,
          content,
          price,
        }),
      });
      const result = await res.json();
      setAddons((prev) => [...prev, result]); // 👉 เพิ่ม Add-on ใหม่ลงใน state
      setMessage("เพิ่มสำเร็จ");
      setMessageType("success");
    } catch (err) {
      console.error("ผิดพลาดขณะเพิ่ม Add-on:", err);
      setMessage("err", err);
      setMessageType("error");
    }
  };
  const confirmDeleteAddOn = async () => {
    if (!selectedAddOn) return;

    await deleteAddOn(selectedAddOn.add_on_id);

    setShowDeleteAddOnModal(false);
    setSelectedAddOn(null);
  };

  const deleteAddOn = async (add_on_id) => {
    try {
      const response = await fetch(
        `${API_URL}/field/delete/addon/${add_on_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
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
      const response = await fetch(
        `${API_URL}/field/add_on/${editingAddon.addOnId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
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

  const handleAddOnInputChange = (subFieldId, key, value) => {
    setAddOnInputs((prev) => ({
      ...prev,
      [subFieldId]: {
        ...prev[subFieldId],
        [key]: value,
      },
    }));
  };

  const upDateStatus = async () => {
    try {
      const res = await fetch(
        `${API_URL}/field/update-status/${field.field_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status: "รอตรวจสอบ",
          }),
        }
      );

      if (res.ok) {
        setMessage("ส่งคำขอสำเร็จ");
        setMessageType("success");
        const updatedField = await res.json();
        setTimeout(() => {
          router.push("/myfield");
        }, 2000);
      } else {
        setMessage("เกิดข้อผิดพลาดในการอัปเดต");
        setMessageType("error");
        throw new Error("ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage(err.message);
      setMessageType("error");
    }
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
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="container">
        <h1>รายละเอียดสนามกีฬา</h1>
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
              <input type="file" onChange={handleImgChange} accept="image/*" />
              {previewUrl && <img src={previewUrl} alt="preview" />}
              <button className="savebtn" onClick={saveImageField}>
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
            <label>เอกสาร (ถ้าแก้ไขเอกสารเดิมจะหาย)</label>
            {editingField === "documents" ? (
              <>
                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,.pdf"
                />
                <button className="savebtn" onClick={saveDocumentField}>
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
                    (Array.isArray(field.documents)
                      ? field.documents
                      : field.documents.split(",")
                    ) // แปลงจาก string เป็น array
                      .map((doc, i) => (
                        <div className="document-container" key={i}>
                          <a
                            href={`${API_URL}/${doc.trim()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="document-link"
                          >
                            <p>เอกสารที่แนบไว้ {i + 1}</p>
                          </a>
                        </div>
                      ))
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
          <h1>สิ่งอำนวยความสะดวกในสนาม</h1>
          <div className="factcon">
            {facilities.length === 0 ? (
              <p>ยังไม่มีสิ่งอำนวยความสะดวกสำหรับสนามนี้</p>
            ) : (
              <div className="facbox">
                {facilities.map((facility) => (
                  <div className="facitem" key={facility.field_fac_id}>
                    <strong>{facility.fac_name}</strong>:{" "}
                    <span>{facility.fac_price} บาท</span>
                    <button
                      className="del-myfac-btn"
                      onClick={() =>
                        handleConfirmDelete(fieldId, facility.field_fac_id)
                      }
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <h1>สิ่งอำนวยความสะดวกทั้งหมด</h1>
          <div className="factcon">
            {allFacilities.map((fac) => (
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

                {selectedFacilities[fac.fac_id] !== undefined && (
                  <div className="input-group">
                    <div className="input-group-checkbox">
                      <input
                        type="number"
                        placeholder="กำหนดราคา ถ้าไม่มีใส่ '0'"
                        value={selectedFacilities[fac.fac_id] || ""}
                        onChange={(e) => {
                          // รับค่าที่กรอกจากผู้ใช้
                          let value = e.target.value;

                          if (value === "" || parseFloat(value) >= 0) {
                            handleFacilityPriceChange(fac.fac_id, value);
                          } else {
                            handleFacilityPriceChange(fac.fac_id, 0);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
                <button className="add-fac-myfield-btn" onClick={handleSaveFacilities}>
                 + เพิ่ม
                </button>
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
        </div>

        <div className="sub-fields-container">
          <h1>สนามย่อย</h1>
          {subFields.map((sub, index) => (
            <div key={sub.sub_field_id} className="sub-field-card">
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
                        <p key={`${sub.sub_field_id}-${addon.add_on_id}`}>
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
                                onClick={() => {
                                  setSelectedAddOn(addon);
                                  setShowDeleteAddOnModal(true);
                                }}
                              >
                                ลบกิจกรรมพิเศษ
                              </button>
                            </>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="input-group">
                  <label>ไม่มีกิจกรรมพิเศษ</label>
                </div>
              )}

              {/* ปุ่ม toggle แสดง/ซ่อนฟอร์ม Add-on */}
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
              {/* เงื่อนไขแสดงฟอร์มเพิ่ม Add-on */}
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
                      setMessage("ยังไม่ได้โหลด user_id จาก Auth");
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
        {field?.status == "ไม่ผ่านการอนุมัติ" && (
          <button onClick={upDateStatus} className="editbtn">
            ส่งคำขอลงทะเบียนอีกครั้ง
          </button>
        )}
      </div>
      {/* โมดอล */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>ยืนยันการลบสนามย่อย</h2>
            <p>คุณต้องการลบสนามย่อยนี้และกิจกรรมพิเศษทั้งหมดหรือไม่?</p>
            <div className="modal-actions">
              <button className="savebtn" onClick={confirmDeleteSubField}>
                ยืนยัน
              </button>
              <button
                className="canbtn"
                onClick={() => setShowDeleteModal(false)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteAddOnModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>ยืนยันการลบกิจกรรมพิเศษ</h2>
            <p>คุณต้องการลบกิจกรรม "{selectedAddOn?.content}" หรือไม่?</p>
            <div className="modal-actions">
              <button className="savebtn" onClick={confirmDeleteAddOn}>
                ยืนยัน
              </button>
              <button
                className="canbtn"
                onClick={() => {
                  setShowDeleteAddOnModal(false);
                  setSelectedAddOn(null);
                }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>ยืนยันการลบ</h2>
            <p>คุณแน่ใจหรือไม่ว่าต้องการลบสิ่งอำนวยความสะดวกนี้</p>
            <div className="modal-actions">
              <button className="savebtn" onClick={() => setShowModal(false)}>
                ยกเลิก
              </button>
              <button className="canbtn" onClick={handleDeleteFacility}>
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
