import { useEffect, useState } from "react"; // Fixed: drop unused default React import flagged by lint.
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";

import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import MiniStoreAdd from "./pages/MiniStoreAdd";
import MiniStoreList from "./pages/MiniStoreList";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      try {
        sessionStorage.setItem("token", token);
      } catch (_) {
        // ignore
      }
    } else {
      localStorage.removeItem("token");
      try {
        sessionStorage.removeItem("token");
      } catch (_) {
        // ignore
      }
    }
  }, [token]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer />
      {token === "" ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <Navbar setToken={setToken} />
          <hr />
          <div className="flex w-full">
            <Sidebar />
            <div className="w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base">
              <Routes>
                <Route path="/add" element={<Add />} />
                <Route path="/list" element={<List token={token} />} />
                <Route path="/orders" element={<Orders token={token} />} />
                <Route path="/ministores" element={<MiniStoreList token={token} />} />
                <Route path="/ministores/add" element={<MiniStoreAdd token={token} />} />
                <Route path="*" element={<MiniStoreList token={token} />} />
              </Routes>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;