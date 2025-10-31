import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import RouteSkeleton from "./components/skeletons/RouteSkeleton";

// ============================================
// LAZY LOADED MAIN SITE PAGES
// ============================================
const Home = lazy(() => import("./pages/Home"));
const Collection = lazy(() => import("./pages/Collection"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Product = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const PlaceOrder = lazy(() => import("./pages/PlaceOrder"));
const Orders = lazy(() => import("./pages/Orders"));
const Verify = lazy(() => import("./pages/Verify"));
const MiniStore = lazy(() => import("./pages/MiniStore"));

// ============================================
// SUB-ADMIN PAGES (Eager loaded for better UX)
// ============================================
import SubAdminLogin from "./pages/subadmin/SubAdminLogin";
import SubAdminLayout from "./pages/subadmin/SubAdminLayout";
import SubAdminDashboard from "./pages/subadmin/SubAdminDashboard";
import SubAdminStoreSettings from "./pages/subadmin/SubAdminStoreSettings";
import SubAdminProducts from "./pages/subadmin/SubAdminProducts";
import SubAdminProductForm from "./pages/subadmin/SubAdminProductForm";
import SubAdminOrders from "./pages/subadmin/SubAdminOrders";
import SubAdminTrending from "./pages/subadmin/SubAdminTrending";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  return (
    <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      <ToastContainer />

      <Routes>
        {/* ============================================ */}
        {/* SUB-ADMIN ROUTES (No Navbar/Footer) */}
        {/* ============================================ */}
        <Route path="/subadmin/login" element={<SubAdminLogin />} />

        <Route path="/subadmin" element={<SubAdminLayout />}>
          <Route path="dashboard" element={<SubAdminDashboard />} />
          <Route path="store-settings" element={<SubAdminStoreSettings />} />
          <Route path="products" element={<SubAdminProducts />} />
          <Route path="products/create" element={<SubAdminProductForm />} />
          <Route path="products/edit/:productId" element={<SubAdminProductForm />} />
          <Route path="orders" element={<SubAdminOrders />} />
          <Route path="trending" element={<SubAdminTrending />} />
        </Route>

        {/* ============================================ */}
        {/* MAIN SITE ROUTES (With Navbar/Footer) */}
        {/* ============================================ */}
        <Route
          path="/*"
          element={
            <>
              <Navbar />
              <SearchBar />
              <Suspense fallback={<RouteSkeleton />}>
                <Routes>
                  {/* Static routes (MUST come first) */}
                  <Route path="/" element={<Home />} />
                  <Route path="/collection" element={<Collection />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/product/:productId" element={<Product />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/place-order" element={<PlaceOrder />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/verify" element={<Verify />} />

                  {/* Mini Stores List Page */}
                  <Route path="/store" element={<MiniStore />} />

                  {/* Dynamic Mini Store Detail (MUST be LAST) */}
                  {/* Matches: /gupta, /jain, /shein, etc. */}
                  <Route path="/:slug" element={<MiniStore />} />

                  {/* Optional: 404 Page */}
                  {/* <Route path="*" element={<NotFound />} /> */}
                </Routes>
              </Suspense>
              <Footer />
            </>
          }
        />
      </Routes>
    </div>
  );
};

export default App;