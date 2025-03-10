'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import "../css/register.css";

export default function Register() {
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [formData, setFormData] = useState({
    user_name: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
  });

  const [errors, setErrors] = useState({
    user_name: '',
    first_name: '',
    last_name: '',
    email: '',
    passwordMatch: '',
    passwordLength: '',
    serverError: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (value.trim() !== '') {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};

    Object.keys(formData).forEach((field) => {
      if (formData[field].trim() === '') {
        newErrors[field] = 'กรุณากรอกข้อมูลในช่องนี้';
      }
    });

    if (formData.password.length < 10) {
      newErrors.passwordLength = 'รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.passwordMatch = 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrors({ serverError: errorData.message || 'การลงทะเบียนล้มเหลว' });
        return;
      }

      alert('ลงทะเบียนสำเร็จ');
      router.push('/login');
    } catch (error) {
      setErrors({ serverError: 'เกิดข้อผิดพลาดระหว่างการลงทะเบียน' });
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
          <label>รหัสผ่าน:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={errors.passwordLength ? "error" : ""}
          />
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
              <i className="fas fa-exclamation-circle"></i> {errors.passwordMatch}
            </p>
          )}
        </div>

        <p className="error-message">
          {errors.passwordLength && (
            <><i className="fas fa-exclamation-circle"></i> {errors.passwordLength}</>
          )}
        </p>

        <button type="submit">ลงทะเบียน</button>
        {errors.serverError && (
          <p className="error-message">
            <i className="fas fa-exclamation-circle"></i> {errors.serverError}
          </p>
        )}
      </form>
    </div>
  );
}
