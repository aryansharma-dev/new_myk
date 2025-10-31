import React from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'

const Sidebar = () => {
  return (
    <div className='w-[18%] min-h-screen border-r-2'>
      <div className='flex flex-col gap-4 pt-6 pl-[20%] text-[15px]'>

        {/* Products */}
        <NavLink
          className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
          to="/add"
        >
          <img className='w-5 h-5' src={assets.add_icon} alt="" />
          <p className='hidden md:block'>Add Items</p>
        </NavLink>

        <NavLink
          className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
          to="/list"
        >
          <img className='w-5 h-5' src={assets.order_icon} alt="" />
          <p className='hidden md:block'>List Items</p>
        </NavLink>

        <NavLink
          className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
          to="/orders"
        >
          <img className='w-5 h-5' src={assets.order_icon} alt="" />
          <p className='hidden md:block'>Orders</p>
        </NavLink>

        {/* --- NEW: Mini Stores --- */}
        <NavLink
          className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
          to="/ministores"
        >
          <img className='w-5 h-5' src={assets.order_icon} alt="" />
          <p className='hidden md:block'>Mini Stores</p>
        </NavLink>

        <NavLink
          className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
          to="/ministores/add"
        >
          <img className='w-5 h-5' src={assets.add_icon} alt="" />
          <p className='hidden md:block'>Add Mini Store</p>
        </NavLink>

      </div>
    </div>
  )
}

export default Sidebar
