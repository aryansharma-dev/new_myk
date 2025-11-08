import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import DashboardLayout from './layouts/DashboardLayout.jsx'

const Login = lazy(() => import('./pages/Login.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const StoreSettings = lazy(() => import('./pages/StoreSettings.jsx'))
const Products = lazy(() => import('./pages/Products.jsx'))
const ProductForm = lazy(() => import('./pages/ProductForm.jsx'))
const Orders = lazy(() => import('./pages/Orders.jsx'))
const Trending = lazy(() => import('./pages/Trending.jsx'))

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/store-settings" element={<StoreSettings />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/create" element={<ProductForm />} />
            <Route path="/products/edit/:productId" element={<ProductForm />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/trending" element={<Trending />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App