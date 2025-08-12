"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import "@/app/css/register.css";
import { useAuth } from "@/app/contexts/AuthContext";
import Link from "next/link";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

export default function Register() {
  const { user, isLoading } = useAuth();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.replace("/");
    }
  }, [user, isLoading]);

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
    password: "",
    serverError: "",
  });
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (value.trim() !== "") {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    }

    if (name === "password" || name === "confirmPassword") {
      const updatedPassword = name === "password" ? value : formData.password;
      const updatedConfirmPassword =
        name === "confirmPassword" ? value : formData.confirmPassword;

      if (updatedPassword.length < 10) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordLength: "*รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร",
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
          passwordMatch: "*รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordMatch: "",
        }));
      }
    }
    const allowDomain = ["@gmail.com", "@hotmail.com", "@rmuti.ac.th"];
    if (name === "email" && value.length > 0) {
      if (!allowDomain.some((domain) => value.endsWith(domain))) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          email:
            "*โดเมนที่ใช้ได้ ได้แก่ @gmail.com, @hotmail.com, @rmuti.ac.th",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          email: "",
        }));
      }
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (name === "password" && value.length > 0) {
      if (!passwordRegex.test(formData.password)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password:
            "*รหัสผ่านต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่[A-Z], พิมพ์เล็ก[a-z], ตัวเลข[0-9] และอักขระพิเศษ[!@#$%^&*]",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "",
        }));
      }
    }

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
                name === "user_name" ? "*ชื่อผู้ใช้" : "*อีเมล"
              } นี้ถูกใช้แล้ว`,
            }));
          } else {
            setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
          }
        } catch (error) {
          console.error("Error checking duplicates:", error);
        }
      }, 500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    Object.keys(formData).forEach((field) => {
      if (formData[field].trim() === "") {
        newErrors[field] = "*กรุณากรอกข้อมูลในช่องนี้";
      }
    });

    if (formData.password.length < 10) {
      newErrors.passwordLength = "*รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.passwordMatch = "*รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน";
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!passwordRegex.test(formData.password)) {
      newErrors.password =
        "*รหัสผ่านต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่[A-Z], พิมพ์เล็ก[a-z], ตัวเลข[0-9] และอักขระพิเศษ[!@#$%^&*]";
    }

    const allowDomain = ["@gmail.com", "@hotmail.com", "@rmuti.ac.th"];
    if (!allowDomain.some((domain) => formData.email.endsWith(domain))) {
      newErrors.email =
        "*โดเมนที่ใช้ได้ ได้แก่ @gmail.com, @hotmail.com, @rmuti.ac.th";
    }

    if (!newErrors.user_name && !newErrors.email) {
      SetstartProcessLoad(true);
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
          newErrors.user_name = "*ชื่อผู้ใช้ซ้ำ";
        }

        if (emailData.isDuplicate) {
          newErrors.email = "*อีเมลซ้ำ";
        }
      } catch (error) {
        console.error("Error checking duplicates:", error);
        newErrors.serverError =
          "เกิดข้อผิดพลาดระหว่างการตรวจสอบอีเมล/ชื่อผู้ใช้";
      } finally {
        SetstartProcessLoad(false);
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }
    SetstartProcessLoad(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrors({ serverError: errorData.message || "การลงทะเบียนล้มเหลว" });
        return;
      }

      setSuccessMessage("ลงทะเบียนบัญชีสำเร็จ");
      setTimeout(() => {
        router.push("/login");
      }, 3000);

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
    } finally {
      SetstartProcessLoad(false);
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-head">ลงทะเบียน</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group-register">
          <label>ชื่อผู้ใช้:</label>
          <input
            maxLength={20}
            type="text"
            name="user_name"
            value={formData.user_name}
            onChange={handleChange}
            className={errors.user_name ? "errors" : ""}
          />
          {errors.user_name && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i> {errors.user_name}
            </p>
          )}
        </div>

        <div className="input-group-register">
          <label>อีเมล:</label>
          <input
            maxLength={100}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "errors" : ""}
          />
          {errors.email && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i> {errors.email}
            </p>
          )}
        </div>
        <div className="input-group-register">
          <label>ชื่อจริง:</label>
          <input
            maxLength={100}
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className={errors.first_name ? "errors" : ""}
          />
          {errors.first_name && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i> {errors.first_name}
            </p>
          )}
        </div>

        <div className="input-group-register">
          <label>นามสกุล:</label>
          <input
            maxLength={100}
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className={errors.last_name ? "errors" : ""}
          />
          {errors.last_name && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i> {errors.last_name}
            </p>
          )}
        </div>

        <div className="input-group-register">
          <label>รหัสผ่าน:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={errors.passwordLength ? "errors" : ""}
          />
          {errors.passwordLength && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i>{" "}
              {errors.passwordLength}
            </p>
          )}
          {errors.password && (
            <p className="error-message">{errors.password}</p>
          )}
        </div>

        <div className="input-group-register">
          <label>ยืนยันรหัสผ่าน:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={errors.passwordMatch ? "errors" : ""}
          />
          {errors.passwordMatch && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i>{" "}
              {errors.passwordMatch}
            </p>
          )}
          {errors.password && (
            <p className="error-message">{errors.password}</p>
          )}
        </div>

        <button
          className="register-button"
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
              <span className="dot three">●</span>
            </span>
          ) : (
            "ลงทะเบียน"
          )}
        </button>
        {successMessage && (
          <div className="success-message">
            <i className="fas fa-check-circle"></i> {successMessage}
          </div>
        )}
        <div className="login-title">
          <Link href="/login" className="login-link">
            หรือคุณมีบัญชีอยู่แล้ว เข้าสู่ระบบ
          </Link>
        </div>

        {errors.serverError && (
          <p className="error-message">
            <i className="fas fa-exclamation-circle"></i> {errors.serverError}
          </p>
        )}
      </form>
    </div>
  );
}
