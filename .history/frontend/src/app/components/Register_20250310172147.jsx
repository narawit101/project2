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

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // เคลียร์ข้อผิดพลาดเมื่อกรอกข้อมูล
    if (value.trim() !== '') {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
    }

    // ตรวจสอบรหัสผ่านและยืนยันรหัสผ่านแบบ Real-Time
    if (name === 'password' || name === 'confirmPassword') {
      const updatedPassword = name === 'password' ? value : formData.password;
      const updatedConfirmPassword = name === 'confirmPassword' ? value : formData.confirmPassword;

      if (updatedPassword.length < 10) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordLength: 'รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordLength: '',
        }));
      }

      if (updatedPassword !== updatedConfirmPassword) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordMatch: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordMatch: '',
        }));
      }
    }

    // ตรวจสอบ Username และ Email แบบ Real-Time
    if (name === 'user_name' || name === 'email') {
      clearTimeout(window.checkDuplicateTimeout);
      window.checkDuplicateTimeout = setTimeout(async () => {
        try {
          const response = await Promise.all([
            fetch(
              `${API_URL}/register/check-duplicate?field=user_name&value=${formData.user_name}`
            ),
            fetch(`${API_URL}/register/check-duplicate?field=email&value=${formData.email}`),
          ]);

          const [userNameData, emailData] = await Promise.all([
            response[0].json(),
            response[1].json(),
          ]);

          if (userNameData.isDuplicate) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              user_name: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว',
            }));
          } else {
            setErrors((prevErrors) => ({ ...prevErrors, user_name: '' }));
          }

          if (emailData.isDuplicate) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              email: 'อีเมลนี้ถูกใช้แล้ว',
            }));
          } else {
            setErrors((prevErrors) => ({ ...prevErrors, email: '' }));
          }
        } catch (error) {
          console.error('Error checking duplicates:', error);
          setErrors({ serverError: 'เกิดข้อผิดพลาดระหว่างการตรวจสอบอีเมล/ชื่อผู้ใช้' });
        }
      }, 500); // ลดการร้องขอ API โดยรอ 500ms ก่อนตรวจสอบ
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};

    // ตรวจสอบข้อผิดพลาด
    Object.keys(formData).forEach((field) => {
      if (formData[field].trim() === '') {
        newErrors[field] = 'กรุณากรอกข้อมูลในช่องนี้';
      }
    });

    // ตรวจสอบรหัสผ่าน
    if (formData.password.length < 10) {
      newErrors.passwordLength = 'รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.passwordMatch = 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน';
    }

    setErrors(newErrors);
    console.log('Errors:', newErrors); // ตรวจสอบว่า errors ถูกตั้งค่าแล้วหรือไม่

    // ถ้ามีข้อผิดพลาดจะไม่ส่งฟอร์ม
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // ส่งข้อมูลไปยัง API
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
            className={errors.user_name ? 'error' : ''}
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
            className={errors.email ? 'error' : ''}
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
            className={errors.passwordLength ? 'error' : ''}
          />
          {errors.passwordLength && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i> {errors.passwordLength}
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
            className={errors.passwordMatch ? 'error' : ''}
          />
          {errors.passwordMatch && (
            <p className="error-message">
              <i className="fas fa-exclamation-circle"></i> {errors.passwordMatch}
            </p>
          )}
        </div>

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
