import React from 'react'
import Register from '../components/Register'
import Navbar from '../components/Navbar'
export default function page() {
  return (
    <>
    <Navbar></Navbar>
    <Register>
      
    </Register>
    <div>
        <a href="/login">หรือคุณมีบัญชีอยู่แล้ว Login เลย</a>
      </div>
    </>
  )
}
