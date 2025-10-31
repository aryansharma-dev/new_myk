import {useState, useContext, useEffect} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ShopContext from '../context/ShopContextInstance';
import api from "../lib/api";
import { setToken as persistToken } from "../utils/auth";
import { toast } from "react-toastify";
import usePageMetadata from "../hooks/usePageMetadata";

export default function Login() {
  const { setToken: setCtxToken, token } = useContext(ShopContext);

  const [currentState, setCurrentState] = useState("Login"); // Toggle Login/Signup
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from || "/";

  usePageMetadata({
    title: currentState === "Sign Up" ? 'Create a TinyMillion Account' : 'Sign in to TinyMillion',
    description:
      'Access TinyMillion orders, track deliveries, and unlock creator mini stores by logging in or creating an account.',
    keywords: 'TinyMillion login, TinyMillion signup, customer account',
    canonical: '/login',
    robots: 'noindex, nofollow',
    structuredData: ({ absoluteCanonical, baseTitle }) => [
      {
        '@context': 'https://schema.org',
        '@type': currentState === 'Sign Up' ? 'RegisterAction' : 'LoginAction',
        '@id': `${absoluteCanonical}#auth`,
        name: baseTitle,
        target: absoluteCanonical,
      },
    ],
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (currentState === "Sign Up") {
        response = await api.post("/api/user/register", { name, email, password });
      } else {
        response = await api.post("/api/user/login", { email, password });
      }

      const data = response.data;
      if (data?.success && data?.token) {
        persistToken(data.token); // save in localStorage
        setCtxToken(data.token); // update global context
        toast.success(`${currentState} successful!`);
        navigate(from, { replace: true });
      } else {
        toast.error(data?.message || `${currentState} failed`);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || `${currentState} failed`;
      toast.error(msg);
    }
  };

  useEffect(() => {
    if (token) navigate("/");
  }, [token, navigate]);

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl">{currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {currentState === "Sign Up" && (
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          type="text"
          className="w-full px-3 py-2 border border-gray-800"
          placeholder="Name"
          required
        />
      )}

      <input
        onChange={(e) => setEmail(e.target.value)}
        value={email}
        type="email"
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Email"
        required
      />

      <input
        onChange={(e) => setPassword(e.target.value)}
        value={password}
        type="password"
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Password"
        required
      />

      <div className="w-full flex justify-between text-sm mt-[-8px]">
        <p className="cursor-pointer">Forgot your password?</p>
        {currentState === "Login" ? (
          <p onClick={() => setCurrentState("Sign Up")} className="cursor-pointer">
            Create account
          </p>
        ) : (
          <p onClick={() => setCurrentState("Login")} className="cursor-pointer">
            Login Here
          </p>
        )}
      </div>

      <button className="bg-black text-white font-light px-8 py-2 mt-4">
        {currentState === "Login" ? "Sign In" : "Sign Up"}
      </button>
    </form>
  );
}