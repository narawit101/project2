"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import "@/app/css/register.css";

export default function Register() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [formData, setFormData] = useState({
    user_name: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });

  const [errors, setErrors] = useState({
    user_name: "",
    first_name: "",
    last_name: "",
    email: "",
    passwordMatch: "",
    passwordLength: "",
    serverError: "",
  });
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // เคลียร์ข้อผิดพลาดเมื่อกรอกข้อมูล
    if (value.trim() !== "") {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    }

    // ตรวจสอบรหัสผ่านและยืนยันรหัสผ่านแบบ Real-Time
    if (name === "password" || name === "confirmPassword") {
      const updatedPassword = name === "password" ? value : formData.password;
      const updatedConfirmPassword =
        name === "confirmPassword" ? value : formData.confirmPassword;

      if (updatedPassword.length < 10) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordLength: "รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordLength: "",
        }));
      }

      if (updatedPassword !== updatedConfirmPassword) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordMatch: "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordMatch: "",
        }));
      }
    }

    // ตรวจสอบ Username และ Email แบบ Real-Time
    if (name === "user_name" || name === "email") {
      clearTimeout(window.checkDuplicateTimeout);
      window.checkDuplicateTimeout = setTimeout(async () => {
        try {
          const response = await fetch(
            `${API_URL}/register/check-duplicate?field=${name}&value=${value}`
          );
          const data = await response.json();
          if (data.isDuplicate) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              [name]: `${
                name === "user_name" ? "ชื่อผู้ใช้" : "อีเมล"
              } นี้ถูกใช้แล้ว`,
            }));
          } else {
            setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
          }
        } catch (error) {
          console.error("Error checking duplicates:", error);
        }
      }, 500); // ลดการร้องขอ API โดยรอ 500ms ก่อนตรวจสอบ
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    Object.keys(formData).forEach((field) => {
      if (formData[field].trim() === "") {
        newErrors[field] = "กรุณากรอกข้อมูลในช่องนี้";
      }
    });

    if (formData.password.length < 10) {
      newErrors.passwordLength = "รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.passwordMatch = "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน";
    }

    if (!newErrors.user_name && !newErrors.email) {
      try {
        const response = await Promise.all([
          fetch(
            `${API_URL}/register/check-duplicate?field=user_name&value=${formData.user_name}`
          ),
          fetch(
            `${API_URL}/register/check-duplicate?field=email&value=${formData.email}`
          ),
        ]);

        const [userNameData, emailData] = await Promise.all([
          response[0].json(),
          response[1].json(),
        ]);

        if (userNameData.isDuplicate) {
          newErrors.user_name = "ชื่อผู้ใช้ซ้ำ";
        }

        if (emailData.isDuplicate) {
          newErrors.email = "อีเมลซ้ำ";
        }
      } catch (error) {
        console.error("Error checking duplicates:", error);
        newErrors.serverError =
          "เกิดข้อผิดพลาดระหว่างการตรวจสอบอีเมล/ชื่อผู้ใช้";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setSuccessMessage("ลงทะเบียนสำเร็จ ! กรุณาเข้าสู่ระบบ");
      setTimeout(() => {        
        router.push("/login");
      }, 2000); 

      if (!response.ok) {
        const errorData = await response.json();
        setErrors({ serverError: errorData.message || "การลงทะเบียนล้มเหลว" });
        return;
      }

      setFormData({
        user_name: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "customer",
      });
      setErrors({
        user_name: "",
        first_name: "",
        last_name: "",
        email: "",
        passwordMatch: "",
        passwordLength: "",
        serverError: "",
      });
    } catch (error) {
      setErrors({ serverError: "เกิดข้อผิดพลาดระหว่างการลงทะเบียน" });
    }
  };

  return (
    <div className="register-container">
      <h2>ลงทะเบียน</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>ชื่อผู้ใช้:</label>
          <input
            type="text"
            name="user_name"
            value={formData.user_name}
            onChange={handleChange}
            className={errors.user_name ? "error" : ""}
          />
          {errors.user_name && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i> {errors.user_name}
            </p>
          )}
        </div>

        <div className="input-group">
          <label>อีเมล:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "error" : ""}
          />
          {errors.email && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i> {errors.email}
            </p>
          )}
        </div>
        <div className="input-group">
          <label>ชื่อจริง:</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className={errors.first_name ? "error" : ""}
          />
          {errors.first_name && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i> {errors.first_name}
            </p>
          )}
        </div>

        <div className="input-group">
          <label>นามสกุล:</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className={errors.last_name ? "error" : ""}
          />
          {errors.last_name && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i> {errors.last_name}
            </p>
          )}
        </div>

        <div className="input-group">
          <label>รหัสผ่าน:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={errors.passwordLength ? "error" : ""}
          />
          {errors.passwordLength && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i>{" "}
              {errors.passwordLength}
            </p>
          )}
        </div>

        <div className="input-group">
          <label>ยืนยันรหัสผ่าน:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={errors.passwordMatch ? "error" : ""}
          />
          {errors.passwordMatch && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i>{" "}
              {errors.passwordMatch}
            </p>
          )}
        </div>

        <button type="submit">ลงทะเบียน</button>

        {successMessage && (
          <div className="success-message">
            <i className="fas fa-check-circle"></i> {successMessage}
          </div>
        )}

        {errors.serverError && (
          <p className="error-message">
            <i className="fas fa-exclamation-circle"></i> {errors.serverError}
          </p>
        )}
      </form>
    </div>
  );
}
