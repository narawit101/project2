import React from "react";
import RegisterFieldForm from "../components/RegisterFieldForm";
import Navbar from '../components/Navbar'

export default function RegisterFieldPage() {
  return (
    <>
    <Navbar></Navbar>
    <h2>ลงทะเบียนสนามกีฬา</h2>
    <RegisterFieldForm></RegisterFieldForm>
    
    </>
  );
}