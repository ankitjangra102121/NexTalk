import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../services/api";

import { connectSocket } from "../socket/socket";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data } = await api.post("/auth/login", formData);

      localStorage.setItem("token", data.accessToken);
      connectSocket();
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Login Successful 🚀");

      navigate("/chat");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-emerald-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-[32px] border border-white/40 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight">
            Welcome Back
          </h1>

          <p className="text-slate-500 mt-3 text-sm">
            Login to your chat account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            required
          />

          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 font-medium text-white transition-all hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]"
          >
            Login
          </button>
        </form>

        <p className="text-center text-slate-500 mt-6">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
