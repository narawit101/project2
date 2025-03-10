'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import Navbar from './Navbar';
export default function Register() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter()
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

    setFormData({
      ...formData,
      [name]: value,
    });

    if (value.trim() !== '') {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: '',
      }));
    }

    if (name === 'password' || name === 'confirmPassword') {
      const updatedPassword = name === 'password' ? value : formData.password;
      const updatedConfirmPassword =
        name === 'confirmPassword' ? value : formData.confirmPassword;

      if (updatedPassword.length < 10) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordLength: 'รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร',
        }));
      } else if (updatedPassword === updatedConfirmPassword) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordLength: '',
          passwordMatch: '',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          passwordMatch: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน',
        }));
      }
    }

    if (name === 'user_name' || name === 'email') {
      try {
        const response = await fetch(
          `${API_URL}/register/check-duplicate?field=${name}&value=${value}`
        );
        const data = await response.json();
        if (data.isDuplicate) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: `${name === 'user_name' ? 'ชื่อผู้ใช้' : 'อีเมล'} ซ้ำ`,
          }));
        } else {
          setErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
        }
      } catch (error) {
        console.error('Error checking duplicates:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = { ...errors };

    Object.keys(formData).forEach((field) => {
      if (formData[field].trim() === '') {
        newErrors[field] = `กรุณากรอก${field === 'first_name' ? 'ชื่อจริง' : field === 'last_name' ? 'นามสกุล' : 'ข้อมูลในช่องนี้'}`;
      }
    });

    if (formData.password.length < 10) {
      newErrors.passwordLength = 'รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.passwordMatch = 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน';
    }

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== '')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrors((prevErrors) => ({
          ...prevErrors,
          serverError: errorData.message || 'การลงทะเบียนล้มเหลว',
        }));
        return;
      }

      alert('ลงทะเบียนผู้ใช้สำเร็จ');
      router.push('/login')
      setFormData({
        user_name: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'customer',
      });
      setErrors({
        user_name: '',
        first_name: '',
        last_name: '',
        email: '',
        passwordMatch: '',
        passwordLength: '',
        serverError: '',
      });
    } catch (error) {
      console.error('Error:', error);
      setErrors((prevErrors) => ({
        ...prevErrors,
        serverError: 'เกิดข้อผิดพลาดระหว่างการลงทะเบียน',
      }));
    }
  };

  return (
    <div>
      <h2>ลงทะเบียน</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="user_name">ชื่อผู้ใช้:</label>
          <input
            type="text"
            id="user_name"
            name="user_name"
            value={formData.user_name}
            onChange={handleChange}
          />
          <p style={{ color: 'red' }}>{errors.user_name}</p>
        </div>

        <div>
          <label htmlFor="first_name">ชื่อจริง:</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
          />
          <p style={{ color: 'red' }}>{errors.first_name}</p>
        </div>

        <div>
          <label htmlFor="last_name">นามสกุล:</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
          />
          <p style={{ color: 'red' }}>{errors.last_name}</p>
        </div>

        <div>
          <label htmlFor="email">อีเมล:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <p style={{ color: 'red' }}>{errors.email}</p>
        </div>

        <div>
          <label htmlFor="password">รหัสผ่าน:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          <p style={{ color: 'red' }}>{errors.passwordMatch}</p>
        </div>

        <p style={{ color: 'red' }}>{errors.passwordLength}</p>

        {/* <div>
          <label htmlFor="role">บทบาท:</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="customer">ผู้ใช้</option>
            <option value="field_owner">เจ้าของสนาม</option>
          </select>
        </div> */}

        <button type="submit">Register</button>
        <p style={{ color: 'red' }}>{errors.serverError}</p>
      </form>
    </div>
  );
}
