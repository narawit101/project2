"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import "@/app/css/edit-field.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

export default function CheckFieldDetail() {
  const { fieldId } = useParams();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [userId, setUserId] = useState(null);
  const [newSportId, setNewSportId] = useState("");
  const [sportsCategories, setSportsCategories] = useState([]);
  const [updatedSubFieldName, setUpdatedSubFieldName] = useState("");
  const [updatedSubFieldPlayer, setUpdatedSubFieldPlayer] = useState("");
  const [updatedSubFieldWid, setUpdatedSubFieldWid] = useState("");
  const [updatedSubFieldLength, setUpdatedSubFieldLength] = useState("");
  const [updatedSubFieldFieldSurface, setUpdatedSubFieldFieldSurface] =
    useState("");
  const [updatedPrice, setUpdatedPrice] = useState("");
  const [updatedSportId, setUpdatedSportId] = useState("");
  const [field, setField] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [updatedValue, setUpdatedValue] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [subFields, setSubFields] = useState([]);
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
    players_per_team: "",
    wid_field: "",
    length_field: "",
    field_surface: "",
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
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubField, setSelectedSubField] = useState(null);
  const [showDeleteAddOnModal, setShowDeleteAddOnModal] = useState(false);
  const [selectedAddOn, setSelectedAddOn] = useState(null);
  const { user, isLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  usePreventLeave(startProcessLoad);

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
    const fetchFieldData = async () => {
      try {
        const res = await fetch(`${API_URL}/field/${fieldId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await res.json();

        if (data.error) {
          setMessage("ไม่พบข้อมูลสนามกีฬา");
          setMessageType("error");
          router.push("/");
          return;
        }

        setField(data);
        setSubFields(data.sub_fields || []);
      } catch (error) {
        console.error("Error fetching field data:", error);
        setMessage("เกิดข้อผิดพลาดในการโหลดข้อมูลสนามกีฬา");
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchFieldData();
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
          setSportsCategories(data);
          setDataLoading(false);
        } else {
          console.error("Error fetching sports categories:", data.error);
          setMessage(data.error);
          setMessageType("error");
        }
      } catch (error) {
        console.error("Error fetching sports categories:", error);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchSportsCategories();
  }, []);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await fetch(`${API_URL}/facilities`, {
          headers: {},
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("ไม่สามารถโหลดข้อมูลสิ่งอำนวยความสะดวกได้");
        }

        const data = await response.json();
        setAllFacilities(data);
      } catch (error) {
        console.error("Error fetching facilities:", error);
        setMessage("เกิดข้อผิดพลาดในการโหลดข้อมูล", error);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchFacilities();
  }, []);

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
    SetstartProcessLoad(true);
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
        setFacilities(updated.data);
      } else {
        setMessage(result.message || "เกิดข้อผิดพลาด");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };
  const handleConfirmDelete = (field_id, field_fac_id) => {
    setSelectedFacility({ field_id, field_fac_id });
    setShowModal(true);
  };
  const handleDeleteFacility = async () => {
    const { field_id, field_fac_id } = selectedFacility;
    SetstartProcessLoad(true);
    try {
      const res = await fetch(
        `${API_URL}/field/facilities/${field_id}/${field_fac_id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {},
        }
      );

      const result = await res.json();

      if (res.ok) {
        setFacilities((prev) =>
          prev.filter((f) => f.field_fac_id !== field_fac_id)
        );
        setMessage(result.message);
        setMessageType("success");
        setShowModal(false);
      } else {
        setMessage(result.message || "เกิดข้อผิดพลาด");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", err);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const addNewFacility = async () => {
    if (!newFacility.trim()) return;
    SetstartProcessLoad(true);
    try {
      const res = await fetch(`${API_URL}/facilities/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ fac_name: newFacility }),
      });

      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
        setMessageType("error");
        return;
      }
      setAllFacilities((prev) => [...prev, data]);
      SetstartProcessLoad(false);
      setNewFacility("");
      setMessage("เพิ่มสิ่งอำนวยความสะดวกสำเร็จ");
      setMessageType("success");
    } catch (err) {
      console.error("Fetch error:", err);
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await fetch(`${API_URL}/facilities/${fieldId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch facilities");
        }

        const data = await response.json();
        setFacilities(data.data);
      } catch (err) {
        console.error(err);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", err);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchFacilities();
  }, [fieldId]);

  const startEditing = (fieldName, currentValue) => {
    setEditingField(fieldName);
    if (fieldName === "open_days") {
      setSelectedDays(
        Array.isArray(field?.open_days) ? [...field.open_days] : []
      );
      setUpdatedValue("");
    } else {
      setUpdatedValue(currentValue);
    }
  };

  const saveSubField = async (sub_field_id) => {
    if (!updatedSportId) {
      setMessage("กรุณาเลือกประเภทกีฬาก่อนบันทึก");
      setMessageType("error");
      return;
    }
    SetstartProcessLoad(true);
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
            players_per_team: updatedSubFieldPlayer,
            wid_field: updatedSubFieldWid,
            length_field: updatedSubFieldLength,
            field_surface: updatedSubFieldFieldSurface,
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
                  players_per_team: updatedSubFieldPlayer,
                  wid_field: updatedSubFieldWid,
                  length_field: updatedSubFieldLength,
                  field_surface: updatedSubFieldFieldSurface,
                  price: updatedPrice,
                  sport_id: updatedSportId,
                }
              : sub
          )
        );
        cancelEditing();
      } else {
        setMessage("เกิดข้อผิดพลาดในการอัปเดตข้อมูลสนาม", response.error);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error saving sub-field:", error);
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const startEditingSubField = (sub) => {
    setEditingField(sub.sub_field_id);
    setUpdatedSubFieldName(sub.sub_field_name);
    setUpdatedSubFieldPlayer(sub.players_per_team);
    setUpdatedSubFieldWid(sub.wid_field);
    setUpdatedSubFieldLength(sub.length_field);
    setUpdatedSubFieldFieldSurface(sub.field_surface);
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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setEditingField(null);
    setUpdatedSubFieldName("");
    setUpdatedSubFieldPlayer("");
    setUpdatedSubFieldWid("");
    setUpdatedSubFieldLength("");
    setUpdatedSubFieldFieldSurface("");
    setUpdatedPrice("");
    setUpdatedSportId("");
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
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

      if (file.size > MAX_FILE_SIZE) {
        isValid = false;
        setMessage("ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)");
        setMessageType("error");
        e.target.value = null;
        break;
      }

      const fileType = file.type;
      if (!fileType.startsWith("image/") && fileType !== "application/pdf") {
        isValid = false;
        setMessage("โปรดเลือกเฉพาะไฟล์รูปภาพหรือ PDF เท่านั้น");
        setMessageType("error");
        break;
      }
    }

    if (isValid) {
      setSelectedFile(files);
      setUpdatedValue(files[0].name);
    } else {
      e.target.value = null;
    }
  };

  const saveImageField = async () => {
    SetstartProcessLoad(true);
    try {
      if (!selectedFile) {
        setMessage("กรุณาเลือกไฟล์ก่อนอัปโหลด");
        setMessageType("error");
        return;
      }

      const formData = new FormData();
      formData.append("img_field", selectedFile);
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
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const saveDocumentField = async () => {
    SetstartProcessLoad(true);
    try {
      if (!selectedFile || selectedFile.length === 0) {
        setMessage("กรุณาเลือกไฟล์เอกสารก่อนอัปโหลด");
        setMessageType("error");
        return;
      }
      const formData = new FormData();
      for (let i = 0; i < selectedFile.length; i++) {
        formData.append("documents", selectedFile[i]);
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
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const isEmptyValue = (value) => {
    if (value === null || value === undefined) return true;

    if (typeof value === "string") {
      return value.trim() === "";
    }

    if (typeof value === "number") {
      return false;
    }

    if (value instanceof File) {
      return value.size === 0;
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    if (typeof value === "object") {
      return Object.keys(value).length === 0;
    }

    return false;
  };

  const saveField = async (fieldName) => {
    if (fieldName === "open_days") {
      if (!selectedDays || selectedDays.length === 0) {
        setMessage("กรุณาเลือกอย่างน้อย 1 วัน");
        setMessageType("error");
        return;
      }
      SetstartProcessLoad(true);
      try {
        const response = await fetch(`${API_URL}/field/edit/${fieldId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ open_days: selectedDays }),
        });

        let result = {};
        try {
          result = await response.json();
        } catch (err) {
          console.error("แปลง JSON ล้มเหลว:", err);
        }

        if (response.ok) {
          setField({ ...field, open_days: [...selectedDays] });
          setEditingField(null);
          setMessage("อัปเดตข้อมูลสำเร็จ");
          setMessageType("success");
        } else {
          setMessage("เกิดข้อผิดพลาด: " + (result.error || "ไม่ทราบสาเหตุ"));
          setMessageType("error");
        }
      } catch (error) {
        console.error("Error saving field:", error);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
        setMessageType("error");
      } finally {
        SetstartProcessLoad(false);
      }
      return;
    }

    if (isEmptyValue(updatedValue)) {
      setMessage("ห้ามปล่อยค่าว่าง หรือ ลบออกทั้งหมด");
      setMessageType("error");
      return;
    }
    SetstartProcessLoad(true);
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
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const addSubField = async (userId) => {
    if (!newSportId) {
      setMessage("กรุณาเลือกประเภทกีฬาก่อนเพิ่มสนาม");
      setMessageType("error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      const response = await fetch(`${API_URL}/field/subfield/${fieldId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sub_field_name: newSubField.sub_field_name,
          players_per_team: newSubField.players_per_team,
          wid_field: newSubField.wid_field,
          length_field: newSubField.length_field,
          field_surface: newSubField.field_surface,
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

      const selectedSport = sportsCategories.find(
        (sport) => sport.sport_id === parseInt(newSportId)
      );

      const newFieldWithSportName = {
        ...newField,
        sport_name: selectedSport
          ? selectedSport.sport_name
          : "ไม่ระบุประเภทกีฬา",
      };

      setSubFields([...subFields, newFieldWithSportName]);
      setMessage("เพิ่มสนามย่อยสำเร็จ");
      setMessageType("success");
    } catch (error) {
      console.error("Error: ", error);
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
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
    SetstartProcessLoad(true);
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
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const addAddOn = async (subFieldId, content, price) => {
    SetstartProcessLoad(true);
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
      if (res.ok) {
        setSubFields((prevSubFields) =>
          prevSubFields.map((sub) =>
            sub.sub_field_id === subFieldId
              ? {
                  ...sub,
                  add_ons: [...(sub.add_ons || []), result],
                }
              : sub
          )
        );
        setMessage("เพิ่มสำเร็จ");
        setMessageType("success");
      } else {
        setMessage(result.message || "เกิดข้อผิดพลาด");
        setMessageType("error");
      }
    } catch (err) {
      console.error("ผิดพลาดขณะเพิ่ม Add-on:", err);
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", err);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };
  const confirmDeleteAddOn = async () => {
    if (!selectedAddOn) return;

    await deleteAddOn(selectedAddOn.add_on_id);

    setShowDeleteAddOnModal(false);
    setSelectedAddOn(null);
  };

  const deleteAddOn = async (add_on_id) => {
    SetstartProcessLoad(true);
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
        setSubFields((prevSubFields) =>
          prevSubFields.map((sub) => ({
            ...sub,
            add_ons: sub.add_ons.filter(
              (addon) => addon.add_on_id !== add_on_id
            ),
          }))
        );
      } else {
        setMessage("เกิดข้อผิดพลาดในการลบ Add-On");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error deleting add-on:", error);
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const saveAddon = async () => {
    SetstartProcessLoad(true);
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
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
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
    SetstartProcessLoad(true);
    try {
      const res = await fetch(`${API_URL}/field/appeal/${field.field_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: "รอตรวจสอบ",
        }),
      });

      if (res.ok) {
        setMessage("ส่งคำขอสำเร็จ");
        setMessageType("success");
        const updatedField = await res.json();
        setTimeout(() => {
          router.push("/my-field");
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
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const daysInThai = {
    Mon: "จันทร์",
    Tue: "อังคาร",
    Wed: "พุธ",
    Thu: "พฤหัสบดี",
    Fri: "ศุกร์",
    Sat: "เสาร์",
    Sun: "อาทิตย์",
  };
  const dayCodes = Object.keys(daysInThai); 
  const weekdayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const sortDays = (arr) => arr.slice().sort((a, b) => weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b));

  const handleDayToggle = (dayCode) => {
    setSelectedDays((prev) => {
      let next = prev.includes(dayCode)
        ? prev.filter((d) => d !== dayCode)
        : [...prev, dayCode];
      return sortDays(next);
    });
  };

  const handleSelectAllDays = () => {
    setSelectedDays([...weekdayOrder]);
  };

  const handleClearDays = () => {
    setSelectedDays([]);
  };
  const formatPrice = (value) => new Intl.NumberFormat("th-TH").format(value);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 2500);

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
      <div className="editfield-container">
        <h1>แก้ไขสนามกีฬา</h1>
        <div className="input-group-editfield-profile">
          {editingField === "img_field" ? (
            <>
              <div className="preview-container-editfield">
                {previewUrl && <img src={previewUrl} alt="preview" />}
              </div>
              <div>
                <input
                  type="file"
                  onChange={handleImgChange}
                  accept="image/*"
                />
                <div className="btn-group-editfield">
                  <button
                    className="savebtn-editfield"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    onClick={saveImageField}
                  >
                    {startProcessLoad ? (
                      <span className="dot-loading">
                        <span className="dot one">●</span>
                        <span className="dot two">●</span>
                        <span className="dot three">●</span>
                      </span>
                    ) : (
                      "บันทึก"
                    )}
                  </button>
                  <button
                    className="canbtn-editfield"
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    onClick={cancelEditing}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <img
                src={`${field?.img_field}`}
                alt="รูปสนามกีฬา"
                className="preview-container-editfield"
              />
              <div className="btn-group-editfield">
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="editbtn-editfield-center"
                  onClick={() => startEditing("img_field", field?.img_field)}
                >
                  แก้ไขรูปโปรไฟล์
                </button>
              </div>
            </>
          )}
        </div>

        <div className="check-field-info">
          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>วันที่เปิดสนาม:</strong>
              <div className="field-value-checkfield">
                {editingField === "open_days" ? (
                  <div className="edit-field-inline">
                    <div className="days-checkbox-container">
                      {/* <div style={{display:"flex", gap:"8px", flexWrap:"wrap", width:"100%"}}> */}
                        {/* <button
                          type="button"
                          className="edit-btn-inline"
                          style={{background:selectedDays.length===7?"#16a34a":"#6c757d"}}
                          disabled={startProcessLoad}
                          onClick={handleSelectAllDays}
                        >
                          เลือกทั้งหมด
                        </button>
                        <button
                          type="button"
                          className="canbtn-inline"
                          style={{padding:"0.3rem 0.6rem"}}
                          disabled={startProcessLoad || selectedDays.length===0}
                          onClick={handleClearDays}
                        >
                          ล้าง
                        </button> */}
                      {/* </div> */}
                      {dayCodes.map((code) => (
                        <label key={code} className="day-checkbox">
                          <input
                            type="checkbox"
                            value={code}
                            checked={selectedDays.includes(code)}
                            disabled={startProcessLoad}
                            onChange={() => handleDayToggle(code)}
                          />
                          {daysInThai[code]}
                        </label>
                      ))}
                    </div>
                    <div className="inline-buttons">
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="savebtn-inline"
                        onClick={() => saveField("open_days")}
                      >
                        {startProcessLoad ? "..." : "✓"}
                      </button>
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="canbtn-inline"
                        onClick={cancelEditing}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-field-inline">
                    <div
                      className="field-value-checkfield"
                      style={{ marginBottom: "4px" }}
                    >
                      {field?.open_days && field.open_days.length > 0
            ? (field.open_days.length === 7
              ? "เปิดทุกวัน"
              : field.open_days
                .slice()
                .sort((a,b)=>["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(a)-["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].indexOf(b))
                .map((d) => daysInThai[d]).join(", "))
                        : "ไม่มีข้อมูล"}
                    </div>
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="edit-btn-inline"
                      onClick={() => startEditing("open_days", "")}
                    >
                      แก้ไข
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>เวลาที่ให้จอง:</strong>
              <div className="field-value-checkfield">
                {editingField === "booking_slot" ? (
                  <div className="edit-field-inline">
                    <select
                      value={updatedValue}
                      onChange={(e) => setUpdatedValue(e.target.value)}
                      className="inline-select"
                    >
                      <option value="30">30 นาที</option>
                      <option value="60">1 ชั่วโมง</option>
                      <option value="90">1.5 ชั่วโมง</option>
                      <option value="120">2 ชั่วโมง</option>
                    </select>
                    <div className="inline-buttons">
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="savebtn-inline"
                        onClick={() => saveField("booking_slot")}
                      >
                        {startProcessLoad ? "..." : "✓"}
                      </button>
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="canbtn-inline"
                        onClick={cancelEditing}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-field-inline">
                    <span>1 ชั่วโมง</span>
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="edit-btn-inline"
                      onClick={() => startEditing("booking_slot", "60")}
                    >
                      แก้ไข
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="check-field-info">
          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>ชื่อสนาม:</strong>
              <div className="field-value-checkfield">
                {editingField === "field_name" ? (
                  <div className="edit-field-inline">
                    <input
                      maxLength={50}
                      type="text"
                      value={updatedValue}
                      onChange={(e) => setUpdatedValue(e.target.value)}
                      className="inline-input"
                    />
                    <div className="inline-buttons">
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="savebtn-inline"
                        onClick={() => saveField("field_name")}
                      >
                        {startProcessLoad ? "..." : "✓"}
                      </button>
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="canbtn-inline"
                        onClick={cancelEditing}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-field-inline">
                    <span>{field?.field_name || "ไม่มีข้อมูล"}</span>
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="edit-btn-inline"
                      onClick={() =>
                        startEditing("field_name", field?.field_name)
                      }
                    >
                      แก้ไข
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>ที่อยู่:</strong>
              <div className="field-value-checkfield">
                {editingField === "address" ? (
                  <div className="edit-field-inline">
                    <input
                      maxLength={100}
                      type="text"
                      value={updatedValue}
                      onChange={(e) => setUpdatedValue(e.target.value)}
                      className="inline-input"
                    />
                    <div className="inline-buttons">
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="savebtn-inline"
                        onClick={() => saveField("address")}
                      >
                        {startProcessLoad ? "..." : "✓"}
                      </button>
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="canbtn-inline"
                        onClick={cancelEditing}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-field-inline">
                    <span>{field?.address || "ไม่มีข้อมูล"}</span>
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="edit-btn-inline"
                      onClick={() => startEditing("address", field?.address)}
                    >
                      แก้ไข
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>พิกัด GPS:</strong>
              <div className="field-value-checkfield">
                {editingField === "gps_location" ? (
                  <div className="edit-field-inline">
                    <input
                      maxLength={200}
                      type="text"
                      value={updatedValue}
                      onChange={(e) => setUpdatedValue(e.target.value)}
                      className="inline-input"
                    />
                    <div className="inline-buttons">
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="savebtn-inline"
                        onClick={() => saveField("gps_location")}
                      >
                        {startProcessLoad ? "..." : "✓"}
                      </button>
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="canbtn-inline"
                        onClick={cancelEditing}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-field-inline">
                    <span>
                      {field?.gps_location ? (
                        <a
                          href={field.gps_location}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {field.gps_location}
                        </a>
                      ) : (
                        "ไม่มีข้อมูล"
                      )}
                    </span>
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="edit-btn-inline"
                      onClick={() =>
                        startEditing("gps_location", field?.gps_location)
                      }
                    >
                      แก้ไข
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ข้อมูลเวลาทำการและการตั้งค่าต่างๆ */}
        <div className="check-field-info">
          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>เวลาเปิด:</strong>
              <div className="field-value-checkfield">
                {editingField === "open_hours" ? (
                  <div className="edit-field-inline">
                    <input
                      type="time"
                      value={updatedValue}
                      onChange={(e) => setUpdatedValue(e.target.value)}
                      className="inline-input"
                    />
                    <div className="inline-buttons">
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="savebtn-inline"
                        onClick={() => saveField("open_hours")}
                      >
                        {startProcessLoad ? "..." : "✓"}
                      </button>
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="canbtn-inline"
                        onClick={cancelEditing}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-field-inline">
                    <span>{field?.open_hours || "ไม่มีข้อมูล"}</span>
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="edit-btn-inline"
                      onClick={() =>
                        startEditing("open_hours", field?.open_hours)
                      }
                    >
                      แก้ไข
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>เวลาปิด:</strong>
              <div className="field-value-checkfield">
                {editingField === "close_hours" ? (
                  <div className="edit-field-inline">
                    <input
                      type="time"
                      value={updatedValue}
                      onChange={(e) => setUpdatedValue(e.target.value)}
                      className="inline-input"
                    />
                    <div className="inline-buttons">
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="savebtn-inline"
                        onClick={() => saveField("close_hours")}
                      >
                        {startProcessLoad ? "..." : "✓"}
                      </button>
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="canbtn-inline"
                        onClick={cancelEditing}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-field-inline">
                    <span>{field?.close_hours || "ไม่มีข้อมูล"}</span>
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="edit-btn-inline"
                      onClick={() =>
                        startEditing("close_hours", field?.close_hours)
                      }
                    >
                      แก้ไข
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>ยกเลิกก่อนถึงเวลา:</strong>
              <div className="field-value-checkfield">
                {editingField === "cancel_hours" ? (
                  <div className="edit-field-inline">
                    <input
                      type="text"
                      value={updatedValue}
                      pattern="[0-9]*"
                      maxLength={2}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val > 24) {
                          setMessage("ใส่ไม่เกินไม่เกิน 24 ชั่วโมง ");
                          setMessageType("error");
                          return;
                        }
                        setMessage(null);
                        if (/^\d{0,2}$/.test(val)) {
                          setUpdatedValue(val);
                        }
                      }}
                      placeholder="ใส่ได้ไม่เกิน 24 ชม."
                      className="inline-input"
                    />
                    <div className="inline-buttons">
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="savebtn-inline"
                        onClick={() => saveField("cancel_hours")}
                      >
                        {startProcessLoad ? "..." : "✓"}
                      </button>
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="canbtn-inline"
                        onClick={cancelEditing}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-field-inline">
                    <span>{field?.cancel_hours || "0"} ชั่วโมง</span>
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="edit-btn-inline"
                      onClick={() =>
                        startEditing("cancel_hours", field?.cancel_hours)
                      }
                    >
                      แก้ไข
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>ค่ามัดจำ:</strong>
              <div className="field-value-checkfield">
                {editingField === "price_deposit" ? (
                  <div className="edit-field-inline">
                    <input
                      min="0"
                      type="text"
                      maxLength={7}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={updatedValue}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length > 6) {
                          setMessage("ใส่ได้ไม่เกิน 6 หลัก");
                          setMessageType("error");
                          return;
                        }
                        setMessage(null);
                        setMessageType(null);
                        setUpdatedValue(Math.abs(Number(value)));
                      }}
                      className="inline-input"
                    />
                    <div className="inline-buttons">
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="savebtn-inline"
                        onClick={() => saveField("price_deposit")}
                      >
                        {startProcessLoad ? "..." : "✓"}
                      </button>
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="canbtn-inline"
                        onClick={cancelEditing}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-field-inline">
                    <span>
                      {field?.price_deposit === 0
                        ? "ไม่มีค่ามัดจำ"
                        : `${field?.price_deposit || "ไม่มีข้อมูล"} บาท`}
                    </span>
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="edit-btn-inline"
                      onClick={() =>
                        startEditing("price_deposit", field?.price_deposit)
                      }
                    >
                      แก้ไข
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>ธนาคาร:</strong>
              <div className="field-value-checkfield">
                {editingField === "name_bank" ? (
                  <div className="edit-field-inline">
                    <input
                      maxLength={50}
                      type="text"
                      value={updatedValue}
                      onChange={(e) => setUpdatedValue(e.target.value)}
                      className="inline-input"
                    />
                    <div className="inline-buttons">
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="savebtn-inline"
                        onClick={() => saveField("name_bank")}
                      >
                        {startProcessLoad ? "..." : "✓"}
                      </button>
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="canbtn-inline"
                        onClick={cancelEditing}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-field-inline">
                    <span>{field?.name_bank || "ไม่มีข้อมูล"}</span>
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="edit-btn-inline"
                      onClick={() =>
                        startEditing("name_bank", field?.name_bank)
                      }
                    >
                      แก้ไข
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>ชื่อเจ้าของบัญชี:</strong>
              <div className="field-value-checkfield">
                {editingField === "account_holder" ? (
                  <div className="edit-field-inline">
                    <input
                      maxLength={50}
                      type="text"
                      value={updatedValue}
                      onChange={(e) => setUpdatedValue(e.target.value)}
                      className="inline-input"
                    />
                    <div className="inline-buttons">
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="savebtn-inline"
                        onClick={() => saveField("account_holder")}
                      >
                        {startProcessLoad ? "..." : "✓"}
                      </button>
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="canbtn-inline"
                        onClick={cancelEditing}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-field-inline">
                    <span>{field?.account_holder || "ไม่มีข้อมูล"}</span>
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="edit-btn-inline"
                      onClick={() =>
                        startEditing("account_holder", field?.account_holder)
                      }
                    >
                      แก้ไข
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>เลขบัญชี:</strong>
              <div className="field-value-checkfield">
                {editingField === "number_bank" ? (
                  <div className="edit-field-inline">
                    <input
                      type="text"
                      maxLength={13}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={updatedValue || ""}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        setUpdatedValue(val);
                        setMessage(null);
                        setMessageType(null);
                      }}
                      onBlur={() => {
                        const len = updatedValue?.length ?? 0;
                        if (len !== 10 && len !== 13) {
                          setMessage("ใส่เลขบัญชีต้อง 10 หรือ 13 หลัก");
                          setMessageType("error");
                          setUpdatedValue("");
                        }
                      }}
                      placeholder="เลขบัญชีต้อง 10 หรือ 13 หลัก"
                      className="inline-input"
                    />
                    <div className="inline-buttons">
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="savebtn-inline"
                        onClick={() => saveField("number_bank")}
                      >
                        {startProcessLoad ? "..." : "✓"}
                      </button>
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="canbtn-inline"
                        onClick={cancelEditing}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-field-inline">
                    <span>{field?.number_bank || "ไม่มีข้อมูล"}</span>
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="edit-btn-inline"
                      onClick={() =>
                        startEditing("number_bank", field?.number_bank)
                      }
                    >
                      แก้ไข
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>คำแนะนำของสนาม:</strong>
              <div className="field-value-checkfield">
                {editingField === "field_description" ? (
                  <div className="edit-field-inline">
                    <textarea
                      maxLength={256}
                      className="inline-textarea"
                      value={updatedValue}
                      onChange={(e) => setUpdatedValue(e.target.value)}
                    />
                    <div className="inline-buttons">
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="savebtn-inline"
                        onClick={() => saveField("field_description")}
                      >
                        {startProcessLoad ? "..." : "✓"}
                      </button>
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="canbtn-inline"
                        onClick={cancelEditing}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-field-inline">
                    <span>{field?.field_description || "ไม่มีข้อมูล"}</span>
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="edit-btn-inline"
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
                )}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield">
            <div className="field-details-checkfield">
              <strong>เอกสาร:</strong>
              <div className="field-value-checkfield">
                {editingField === "documents" ? (
                  <div className="edit-field-inline">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      multiple
                      accept="image/*,.pdf"
                      className="inline-file-input"
                    />
                    <div className="inline-buttons">
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="savebtn-inline"
                        onClick={saveDocumentField}
                      >
                        {startProcessLoad ? "..." : "✓"}
                      </button>
                      <button
                        className="canbtn-inline"
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        onClick={cancelEditing}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-field-inline">
                    <div className="documents-display">
                      {field?.documents ? (
                        (Array.isArray(field.documents)
                          ? field.documents
                          : field.documents.split(",")
                        ).map((doc, i) => (
                          <a
                            key={i}
                            href={`${doc.trim()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="document-link-inline"
                          >
                            เอกสาร {i + 1}
                          </a>
                        ))
                      ) : (
                        <span>ไม่มีเอกสารแนบ</span>
                      )}
                    </div>
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="edit-btn-inline"
                      onClick={() => startEditing("documents", field.documents)}
                    >
                      แก้ไข
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="field-row-checkfield facilities-section">
            <div className="field-details-checkfield">
              <strong>สิ่งอำนวยความสะดวกในสนาม:</strong>
              <div className="field-value-checkfield">
                <div className="facilities-display">
                  {Array.isArray(facilities) && facilities.length === 0 ? (
                    <div className="no-facilities-message">
                      <span>ยังไม่มีสิ่งอำนวยความสะดวกสำหรับสนามนี้</span>
                    </div>
                  ) : Array.isArray(facilities) && facilities.length > 0 ? (
                    <div className="facilities-grid">
                      {facilities.map((facility) => (
                        <div
                          className="facility-card"
                          key={facility.field_fac_id}
                        >
                          <div className="facility-info">
                            <h4
                              className="facility-name"
                              title={facility.fac_name}
                            >
                              {facility.fac_name.length > 20
                                ? `${facility.fac_name.substring(0, 20)}...`
                                : facility.fac_name}
                            </h4>
                            <p className="facility-price">
                              {formatPrice(facility.fac_price)} บาท
                            </p>
                          </div>
                          <button
                            style={{
                              cursor: startProcessLoad
                                ? "not-allowed"
                                : "pointer",
                            }}
                            disabled={startProcessLoad}
                            className="delete-facility-btn"
                            onClick={() =>
                              handleConfirmDelete(
                                fieldId,
                                facility.field_fac_id
                              )
                            }
                            title="ลบสิ่งอำนวยความสะดวก"
                          >
                            ลบ
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="error-message">
                      <span>ข้อมูลผิดพลาด</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="field-row-checkfield facilities-section">
            <div className="field-details-checkfield">
              <strong>เพิ่มสิ่งอำนวยความสะดวก:</strong>
              <div className="field-value-checkfield">
                <div className="facilities-selector">
                  <div className="facilities-list">
                    {allFacilities.map((fac) => (
                      <div key={fac.fac_id} className="facility-selector-item">
                        <div className="facility-checkbox-wrapper">
                          <input
                            type="checkbox"
                            id={`facility-${fac.fac_id}`}
                            checked={
                              selectedFacilities[fac.fac_id] !== undefined
                            }
                            onChange={() => handleFacilityChange(fac.fac_id)}
                          />
                          <label
                            htmlFor={`facility-${fac.fac_id}`}
                            className="facility-label"
                            title={fac.fac_name}
                          >
                            {fac.fac_name.length > 25
                              ? `${fac.fac_name.substring(0, 25)}...`
                              : fac.fac_name}
                          </label>
                        </div>

                        {selectedFacilities[fac.fac_id] !== undefined && (
                          <div className="price-input-wrapper">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={6}
                              placeholder="ราคา (บาท)"
                              value={selectedFacilities[fac.fac_id] || ""}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, "");

                                if (value > 999999) {
                                  setMessage("ใส่ได้ไม่เกิน 6 หลัก ");
                                  setMessageType("error");
                                  return;
                                }
                                setMessage(null);
                                setMessageType(null);
                                if (value === "" || parseFloat(value) >= 0) {
                                  handleFacilityPriceChange(fac.fac_id, value);
                                } else {
                                  handleFacilityPriceChange(fac.fac_id, 0);
                                }
                              }}
                              className="price-input"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="facilities-actions">
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="add-selected-facilities-btn"
                      onClick={handleSaveFacilities}
                    >
                      เพิ่มไปยังสนาม
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="field-row-checkfield facilities-section">
            <div className="field-details-checkfield">
              <strong>เพิ่มสิ่งอำนวยความสะดวกใหม่:</strong>
              <div className="field-value-checkfield">
                {!showNewFacilityInput ? (
                  <div className="add-new-facility-prompt">
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="add-new-facility-btn"
                      type="button"
                      onClick={() => setShowNewFacilityInput(true)}
                    >
                      สร้างสิ่งอำนวยความสะดวกใหม่
                    </button>
                  </div>
                ) : (
                  <div className="new-facility-form">
                    <input
                      maxLength={50}
                      type="text"
                      placeholder="ชื่อสิ่งอำนวยความสะดวกใหม่"
                      value={newFacility}
                      onChange={(e) => setNewFacility(e.target.value)}
                      className="new-facility-input"
                    />
                    <div className="new-facility-actions">
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="save-new-facility-btn"
                        type="button"
                        onClick={addNewFacility}
                      >
                        {startProcessLoad ? "..." : "บันทึก"}
                      </button>
                      <button
                        style={{
                          cursor: startProcessLoad ? "not-allowed" : "pointer",
                        }}
                        disabled={startProcessLoad}
                        className="cancel-new-facility-btn"
                        type="button"
                        onClick={() => setShowNewFacilityInput(false)}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="sub-fields-container-editfield">
          {subFields.map((sub, index) => (
            <div key={sub.sub_field_id} className="sub-field-card-editfield">
              <div className="sub-field-header">
                <h3>สนามย่อย {sub.sub_field_name}</h3>
                <span className="sub-field-sport">{sub.sport_name}</span>
              </div>

              {editingField === sub.sub_field_id ? (
                <div className="sub-field-edit-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>ชื่อสนามย่อย</label>
                      <input
                        maxLength={20}
                        type="text"
                        value={updatedSubFieldName}
                        onChange={(e) => setUpdatedSubFieldName(e.target.value)}
                        placeholder="ชื่อสนามย่อย"
                      />
                    </div>

                    <div className="form-group">
                      <label>ราคา (บาท)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={7}
                        value={updatedPrice || ""}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, "");
                          if (value.length > 6) {
                            setMessage("ใส่ได้ไม่เกิน 6 หลัก");
                            setMessageType("error");
                            return;
                          }
                          setMessage(null);
                          setMessageType(null);
                          setUpdatedPrice(Math.abs(e.target.value));
                        }}
                        placeholder="ราคา"
                      />
                    </div>

                    <div className="form-group">
                      <label>ผู้เล่นต่อทีม</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={2}
                        value={updatedSubFieldPlayer || ""}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, "");
                          if (value > 24) {
                            setMessage("ใส่ได้ไม่เกิน 24 คน");
                            setMessageType("error");
                            return;
                          }
                          setMessage(null);
                          setMessageType(null);
                          setUpdatedSubFieldPlayer(Math.abs(e.target.value));
                        }}
                        placeholder="จำนวนผู้เล่น"
                      />
                    </div>

                    <div className="form-group">
                      <label>ความกว้าง (เมตร)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={updatedSubFieldWid || ""}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, "");
                          if (value > 1000) {
                            setMessage("ใส่ได้ไม่เกิน 1000 เมตร");
                            setMessageType("error");
                            return;
                          }
                          setMessage(null);
                          setMessageType(null);
                          setUpdatedSubFieldWid(Math.abs(e.target.value));
                        }}
                        placeholder="ความกว้าง"
                      />
                    </div>

                    <div className="form-group">
                      <label>ความยาว (เมตร)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={updatedSubFieldLength || ""}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, "");
                          if (value > 1000) {
                            setMessage("ใส่ได้ไม่เกิน 1000 เมตร");
                            setMessageType("error");
                            return;
                          }
                          setMessage(null);
                          setMessageType(null);
                          setUpdatedSubFieldLength(Math.abs(e.target.value));
                        }}
                        placeholder="ความยาว"
                      />
                    </div>

                    <div className="form-group">
                      <label>ประเภทพื้นสนาม</label>
                      <input
                        maxLength={20}
                        type="text"
                        value={updatedSubFieldFieldSurface}
                        onChange={(e) =>
                          setUpdatedSubFieldFieldSurface(e.target.value)
                        }
                        placeholder="เช่น หญ้าเทียม, คอนกรีต"
                      />
                    </div>

                    <div className="form-group form-group-full">
                      <label>ประเภทกีฬา</label>
                      <select
                        value={updatedSportId}
                        onChange={(e) => setUpdatedSportId(e.target.value)}
                        className="sport-select-editfield"
                      >
                        <option value="">เลือกประเภทกีฬา</option>
                        {sportsCategories.map((category) => (
                          <option
                            key={category.sport_id}
                            value={category.sport_id}
                          >
                            {category.sport_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-actions-editfield">
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="save-btn"
                      onClick={() => saveSubField(sub.sub_field_id)}
                    >
                      {startProcessLoad ? (
                        <span className="dot-loading">
                          <span className="dot one">●</span>
                          <span className="dot two">●</span>
                          <span className="dot three">●</span>
                        </span>
                      ) : (
                        "บันทึก"
                      )}
                    </button>
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="cancel-btn"
                      onClick={() => cancelEditing()}
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <div className="sub-field-display">
                  <div className="field-info-grid">
                    <div className="info-item">
                      <span className="info-label">ราคา:</span>
                      <span className="info-value">
                        {formatPrice(sub.price)} บาท
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">ผู้เล่นต่อทีม:</span>
                      <span className="info-value">
                        {sub?.players_per_team} คน
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">ขนาดสนาม:</span>
                      <span className="info-value">
                        {formatPrice(sub?.wid_field)} ×{" "}
                        {formatPrice(sub?.length_field)} เมตร
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">ประเภทพื้น:</span>
                      <span className="info-value">{sub?.field_surface}</span>
                    </div>
                  </div>

                  <div className="sub-field-actions">
                    <button
                      className="edit-btn"
                      onClick={() => startEditingSubField(sub)}
                    >
                      แก้ไข
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteClick(sub)}
                    >
                      ลบสนามย่อย
                    </button>
                  </div>
                </div>
              )}

              <div className="addons-section">
                <div className="addons-header">
                  <h4>กิจกรรมพิเศษ</h4>
                  <button
                    style={{
                      cursor: startProcessLoad ? "not-allowed" : "pointer",
                    }}
                    disabled={startProcessLoad}
                    className="toggle-addon-btn"
                    onClick={() =>
                      setShowAddOnForm((prev) => ({
                        ...prev,
                        [sub.sub_field_id]: !prev[sub.sub_field_id],
                      }))
                    }
                  >
                    {showAddOnForm[sub.sub_field_id]
                      ? "ยกเลิก"
                      : "เพิ่มกิจกรรม"}
                  </button>
                </div>

                {sub.add_ons && sub.add_ons.length > 0 ? (
                  <div className="addons-list">
                    {sub.add_ons.map((addon) => (
                      <div
                        key={`${sub.sub_field_id}-${addon.add_on_id}`}
                        className="addon-item"
                      >
                        {editingAddon.addOnId === addon.add_on_id ? (
                          <div className="addon-edit-form">
                            <input
                              maxLength={50}
                              type="text"
                              value={editingAddon.content}
                              onChange={(e) =>
                                setEditingAddon({
                                  ...editingAddon,
                                  content: e.target.value,
                                })
                              }
                              placeholder="ชื่อกิจกรรม"
                            />
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={7}
                              value={editingAddon.price}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, "");
                                if (value.length > 6) {
                                  setMessage("ใส่ได้ไม่เกิน 6 หลัก");
                                  setMessageType("error");
                                  return;
                                }
                                setEditingAddon({
                                  ...editingAddon,
                                  price: Math.abs(e.target.value),
                                });
                              }}
                              placeholder="ราคา"
                            />
                            <div className="addon-actions">
                              <button
                                style={{
                                  cursor: startProcessLoad
                                    ? "not-allowed"
                                    : "pointer",
                                }}
                                disabled={startProcessLoad}
                                className="save-btn"
                                onClick={saveAddon}
                              >
                                {startProcessLoad ? (
                                  <span className="dot-loading">
                                    <span className="dot one">●</span>
                                    <span className="dot two">●</span>
                                    <span className="dot three">●</span>
                                  </span>
                                ) : (
                                  "บันทึก"
                                )}
                              </button>
                              <button
                                style={{
                                  cursor: startProcessLoad
                                    ? "not-allowed"
                                    : "pointer",
                                }}
                                disabled={startProcessLoad}
                                className="cancel-btn"
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
                            </div>
                          </div>
                        ) : (
                          <div className="addon-display">
                            <div className="addon-info">
                              <span className="addon-name">
                                {addon.content}
                              </span>
                              <span className="addon-price">
                                {formatPrice(addon.price)} บาท
                              </span>
                            </div>
                            <div className="addon-actions">
                              <button
                                className="edit-btn"
                                onClick={() => startEditingAddon(addon)}
                              >
                                แก้ไข
                              </button>
                              <button
                                style={{
                                  cursor: startProcessLoad
                                    ? "not-allowed"
                                    : "pointer",
                                }}
                                disabled={startProcessLoad}
                                className="delete-btn"
                                onClick={() => {
                                  setSelectedAddOn(addon);
                                  setShowDeleteAddOnModal(true);
                                }}
                              >
                                ลบ
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-addons">
                    <span>ไม่มีกิจกรรมพิเศษ</span>
                  </div>
                )}

                {showAddOnForm[sub.sub_field_id] && (
                  <div className="add-addon-form">
                    <input
                      type="text"
                      maxLength={50}
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
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={7}
                      placeholder="ราคา"
                      value={addOnInputs[sub.sub_field_id]?.price || ""}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length >= 6) {
                          setMessage("ใส่ได้ไม่เกิน 6 หลัก");
                          setMessageType("error");
                          return;
                        }
                        handleAddOnInputChange(
                          sub.sub_field_id,
                          "price",
                          Math.abs(e.target.value)
                        );
                      }}
                    />
                    <button
                      style={{
                        cursor: startProcessLoad ? "not-allowed" : "pointer",
                      }}
                      disabled={startProcessLoad}
                      className="save-btn"
                      onClick={async () => {
                        const content = addOnInputs[sub.sub_field_id]?.content;
                        const price = addOnInputs[sub.sub_field_id]?.price;
                        if (!content || !price) {
                          setMessage("กรุณากรอกชื่อและราคาของกิจกรรมพิเศษ");
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
                      {startProcessLoad ? (
                        <span className="dot-loading">
                          <span className="dot one">●</span>
                          <span className="dot two">●</span>
                          <span className="dot three">●</span>
                        </span>
                      ) : (
                        "บันทึกกิจกรรม"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="input-group-editfield-addsubfield">
          {!showAddSubFieldForm ? (
            <button
              className="editbtn-editfield"
              onClick={() => setShowAddSubFieldForm(true)}
            >
              เพิ่มสนามย่อย
            </button>
          ) : (
            <div>
              <div className="subfield-form-editfield">
                <input
                  type="text"
                  maxLength={20}
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
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={7}
                  placeholder="ราคา"
                  value={newSubField.price ?? ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");

                    if (value > 999999) {
                      setMessage("ใส่ได้ไม่เกิน 6 หลัก");
                      setMessageType("error");
                      return;
                    }
                    setMessage(null);
                    setMessageType(null);

                    setNewSubField({
                      ...newSubField,
                      price: Math.abs(Number(value)),
                    });
                  }}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  placeholder="ผู้เล่น"
                  value={newSubField.players_per_team || ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");

                    if (value > 11) {
                      setMessage("ใส่ได้ไม่เกิน 11 คน");
                      setMessageType("error");
                      return;
                    }
                    setMessage(null);
                    setMessageType(null);
                    setNewSubField({
                      ...newSubField,
                      players_per_team: Math.abs(e.target.value),
                    });
                  }}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="กว้าง"
                  value={newSubField.wid_field || ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");

                    if (value > 1000) {
                      setMessage("ใส่ได้ไม่เกิน 1000 เมตร");
                      setMessageType("error");
                      return;
                    }
                    setMessage(null);
                    setMessageType(null);
                    setNewSubField({
                      ...newSubField,
                      wid_field: Math.abs(e.target.value),
                    });
                  }}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="ยาว"
                  value={newSubField.length_field || ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");

                    if (value > 1000) {
                      setMessage("ใส่ได้ไม่เกิน 1000 เมตร");
                      setMessageType("error");
                      return;
                    }
                    setMessage(null);
                    setMessageType(null);
                    setNewSubField({
                      ...newSubField,
                      length_field: Math.abs(e.target.value),
                    });
                  }}
                />
                <input
                  type="text"
                  maxLength={20}
                  placeholder="ประเภทของพื้นสนาม"
                  value={newSubField.field_surface}
                  onChange={(e) =>
                    setNewSubField({
                      ...newSubField,
                      field_surface: e.target.value,
                    })
                  }
                />
                <select
                  value={newSportId}
                  onChange={(e) => setNewSportId(e.target.value)}
                  className="sport-select-editfield"
                >
                  <option value="">เลือกประเภทกีฬา</option>
                  {sportsCategories.map((category) => (
                    <option key={category.sport_id} value={category.sport_id}>
                      {category.sport_name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                className="savebtn-editfield"
                onClick={async () => {
                  if (!userId) {
                    setMessage("ยังไม่ได้โหลด user_id ");
                    setMessageType("error");
                    return;
                  }
                  await addSubField(userId);
                  setNewSubField({
                    sub_field_name: "",
                    price: "",
                    sport_id: "",
                    players_per_team: "",
                    wid_field: "",
                    length_field: "",
                    field_surface: "",
                  });
                  setShowAddSubFieldForm(false);
                }}
              >
                {startProcessLoad ? (
                  <span className="dot-loading">
                    <span className="dot one">●</span>
                    <span className="dot two">●</span>
                    <span className="dot three">●</span>
                  </span>
                ) : (
                  "บันทึกสนามย่อย"
                )}
              </button>

              <button
                className="canbtn-editfield"
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
                onClick={() => setShowAddSubFieldForm(false)}
              >
                ยกเลิก
              </button>
            </div>
          )}
        </div>
        {field?.status == "ไม่ผ่านการอนุมัติ" && (
          <div className="editbtn-editfield-request">
            <button
              onClick={upDateStatus}
              style={{
                cursor: startProcessLoad ? "not-allowed" : "pointer",
              }}
              disabled={startProcessLoad}
              className="editbtn-editfield"
            >
              {startProcessLoad ? (
                <span className="dot-loading">
                  <span className="dot one">●</span>
                  <span className="dot two">●</span>
                  <span className="dot three">●</span>
                </span>
              ) : (
                "ส่งคำขอลงทะเบียนสนามอีกครั้ง"
              )}
            </button>
          </div>
        )}

        {showDeleteModal && (
          <div className="modal-overlay-editfield">
            <div className="modal-editfield">
              <h2>ยืนยันการลบสนามย่อย</h2>
              <p>คุณต้องการลบสนามย่อยนี้และกิจกรรมพิเศษทั้งหมดหรือไม่?</p>
              <div className="modal-actions-editfield">
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="savebtn-editfield"
                  onClick={confirmDeleteSubField}
                >
                  ยืนยัน
                </button>
                <button
                  className="canbtn-editfield"
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  onClick={() => setShowDeleteModal(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
        {showDeleteAddOnModal && (
          <div className="modal-overlay-editfield">
            <div className="modal-editfield">
              <h2>ยืนยันการลบกิจกรรมพิเศษ</h2>
              <p>คุณต้องการลบกิจกรรม "{selectedAddOn?.content}" หรือไม่?</p>
              <div className="modal-actions-editfield">
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="savebtn-editfield"
                  onClick={confirmDeleteAddOn}
                >
                  ยืนยัน
                </button>
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="canbtn-editfield"
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
          <div className="modal-overlay-editfield">
            <div className="modal-editfield">
              <h2>ยืนยันการลบ</h2>
              {startProcessLoad && (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                </div>
              )}
              <p>คุณแน่ใจหรือไม่ว่าต้องการลบสิ่งอำนวยความสะดวกนี้</p>
              <div className="modal-actions-editfield">
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="canbtn-editfield"
                  onClick={() => setShowModal(false)}
                >
                  ยกเลิก
                </button>
                <button
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                  className="savebtn-editfield"
                  onClick={handleDeleteFacility}
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
