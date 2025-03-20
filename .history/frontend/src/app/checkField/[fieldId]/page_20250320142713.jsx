import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const CheckField = () => {
  const router = useRouter();
  const { field_id } = router.query;  // ดึง field_id จาก URL

  const [fieldData, setFieldData] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!field_id) return; // ถ้ายังไม่มี field_id ไม่ต้องทำอะไร

    // ดึงข้อมูลสนามจาก API
    fetch(`http://localhost:5000/fields/${field_id}`)
      .then((res) => res.json())
      .then((data) => {
        setFieldData(data);
        setStatus(data.status);
        setLoading(false);
      })
      .catch((error) => {
        setMessage('ไม่สามารถดึงข้อมูลสนามได้');
        setLoading(false);
      });
  }, [field_id]);

  if (loading) return <div>กำลังโหลดข้อมูล...</div>;
  if (!fieldData) return <div>ไม่พบข้อมูลสนาม</div>;

  return (
    <div>
      <h2>ข้อมูลสนามกีฬา</h2>
      {message && <p>{message}</p>}
      <h3>{fieldData.field_name}</h3>
      <p>ที่อยู่: {fieldData.address}</p>
      <p>สถานะ: {status}</p>
      <button onClick={() => handleStatusChange("ผ่านการอนุมัติ")}>ผ่านการอนุมัติ</button>
      <button onClick={() => handleStatusChange("ไม่ผ่านการอนุมัติ")}>ไม่ผ่านการอนุมัติ</button>

      <h4>ข้อมูลเพิ่มเติม:</h4>
      <p>เอกสาร: <a href={fieldData.documents} target="_blank" rel="noopener noreferrer">คลิกเพื่อดู</a></p>
      <p>รูปภาพสนาม: <img src={fieldData.img_field} alt="สนาม" width="100" /></p>

      <h4>เวลาเปิด-ปิด:</h4>
      <p>เปิด: {fieldData.open_hours} - ปิด: {fieldData.close_hours}</p>

      <h4>วันเปิดบริการ:</h4>
      <ul>
        {fieldData.open_days && fieldData.open_days.map((day, index) => (
          <li key={index}>{day}</li>
        ))}
      </ul>
    </div>
  );
};

export default CheckField;
