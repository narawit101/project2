import React from 'react'
import Category from "@/app/components/SportType"
import Navbar from '@/app/components/Navbar'
import "@/app/css/sportTypePage.css"

export default function page() {
  return (
    <div>
      
      <Navbar></Navbar>
      <div className="containercategory">
      <Category></Category>
      </div>
    </div>
  )
}
