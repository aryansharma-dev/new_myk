import { useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (window.location.host.includes("localhost:5173") ? "http://localhost:4000" : "");

export default function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!email) return;

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/newsletter/subscribe`, { email });
      if (res.data?.success) {
        setMsg(res.data.message || "Subscribed! 🎉");
        setEmail("");
      } else {
        setMsg(res.data?.message || "Something went wrong, please try again.");
      }
    } catch (err) {
      setMsg(err?.response?.data?.message || "Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <p className="text-2xl font-medium text-gray-800">Subscribe now & get 20% off</p>
      <p className="text-gray-400 mt-3">
        Join the TinyMillion family and stay updated with exclusive offers, new arrivals,
        and style inspiration — straight to your inbox.
      </p>

      <form onSubmit={onSubmitHandler}
            className="w-full sm:w-1/2 flex items-center gap-3 mx-auto my-6 border pl-3">
        <input
          className="w-full sm:flex-1 outline-none"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}
                className="bg-black text-white text-xs px-10 py-4 disabled:opacity-60">
          {loading ? "Submitting…" : "SUBSCRIBE"}
        </button>
      </form>

      {msg && <p className="mt-3 text-green-600">{msg}</p>}
    </div>
  );
}