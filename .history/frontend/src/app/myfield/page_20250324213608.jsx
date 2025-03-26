import React from "react";
import MyFields from "@/app/components/Myfields"; 

export default function page() {
  return (
    <div className="bg-blue-100 min-h-screen py-8">
      <h2 className="text-3xl font-bold text-center mb-6">สนามของฉัน</h2>

      <div className="max-w-5xl mx-auto">
        <MyFields />
      </div>
    </div>
  );
}