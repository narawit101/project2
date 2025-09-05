"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import LongdoMapPicker from "@/app/components/LongdoMapPicker";
import "@/app/css/map-edit-field.css";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Map() {
  const { user, isLoading } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { fieldId } = useParams();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }
  }, [user, isLoading, router]);

  const handleSaveLocation = async () => {
    if (!selectedLocation) {
      setMessage("กรุณาเลือกตำแหน่งบนแผนที่ก่อน");
      setMessageType("error");
      return;
    }
    setIsUpdating(true);
    try {
      const response = await fetch(
        `${API_URL}/field/edit-location/${fieldId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            gps_location: selectedLocation,
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        setMessage("บันทึกตำแหน่งสำเร็จ");
        setMessageType("success");
        setTimeout(() => {
          router.back();
        }, 1000);
      } else {
        setMessage(`เกิดข้อผิดพลาด: ${result.error}`);
        setMessageType("error");
      }
    } catch (error) {
      console.error("Save location error:", error);
      setMessage("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setMessageType("error");
    } finally {
      setIsUpdating(false);
    }
  };

  console.log("Field ID from params:", fieldId);
  console.log("Selected location:", selectedLocation);
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
    <div className="map-page-container-map-edit">
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <h2 className="map-page-title-map-edit">เลือกตำแหน่งสนามที่จะแก้ไข</h2>

      <div className="map-container-map-edit">
        <LongdoMapPicker
          onLocationSelect={(location) => {
            setSelectedLocation(location);
            console.log("Selected location:", location);
          }}
          onMapReady={() => setMapLoaded(true)}
          initialLocation={selectedLocation || "13.736717,100.523186"}
        />
      </div>

      {selectedLocation && (
        <div className="selected-location-display-map-edit">
          <img
            width={20}
            height={20}
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1756972382/bxs--map_c0lmby.png"
            alt=""
          />
          พิกัดที่เลือก: {selectedLocation}
        </div>
      )}

      <div className="map-actions-container-map-edit">
        <button
          className="btn-save-location-map-edit"
          onClick={handleSaveLocation}
          disabled={!selectedLocation || isUpdating || !mapLoaded}
        >
          {isUpdating ? (
            <span className="dot-loading">
              <span className="dot one">●</span>
              <span className="dot two">●</span>
              <span className="dot three">●</span>
            </span>
          ) : (
            "บันทึกตำแหน่ง"
          )}
        </button>
        <button className="btn-cancel-map-edit" onClick={() => router.back()}>
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
