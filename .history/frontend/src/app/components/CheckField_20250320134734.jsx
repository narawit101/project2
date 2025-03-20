import React, { useState, useEffect } from 'react';

const FieldDetails = ({ fieldId }) => {
  const [fieldData, setFieldData] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // ดึงข้อมูลสนามจาก API
  useEffect(() => {
    fetch(`/api/fields/${fieldId}`)
      .then((res) => res.json())
      .then((data) => {
        setFieldData(data);
        setStatus(data.status);  // กำหนดสถานะเริ่มต้น
        setLoading(false);
      })
      .catch((error) => {
        setMessage("ไม่สามารถดึงข้อมูลสนามได้");
        setLoading(false);
      });
  }, [fieldId]);

  // ฟังก์ชันอัปเดตสถานะ
  const handleStatusChange = (newStatus) => {
    fetch(`/api/fields/${fieldId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.field.status);  // อัปเดตสถานะที่ UI
        setMessage("อัปเดตสถานะสำเร็จ");
      })
      .catch((error) => {
        setMessage("ไม่สามารถอัปเดตสถานะได้");
      });
  };

  if (loading) return <div>กำลังโหลดข้อมูล...</div>;

  return (
    <div>
      <h2>ข้อมูลสนามกีฬา</h2>
      {message && <p>{message}</p>}
      <div>
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

        <h4>สนามย่อย:</h4>
        {fieldData.sub_fields && fieldData.sub_fields.map((subField, index) => (
          <div key={index}>
            <p>ชื่อสนามย่อย: {subField.sub_field_name}</p>
            <p>ราคา: {subField.price} บาท/ชั่วโมง</p>
            <p>ประเภทกีฬา: {subField.sport_id}</p>
            <h5>กิจกรรมเพิ่มเติม:</h5>
            {subField.add_ons.map((addon, addOnIndex) => (
              <div key={addOnIndex}>
                <p>กิจกรรม: {addon.content}</p>
                <p>ราคา: {addon.price} บาท/ชั่วโมง</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldDetails;
