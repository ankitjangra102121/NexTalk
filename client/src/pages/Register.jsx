import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../services/api";

import { connectSocket } from "../socket/socket";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
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
      const { data } = await api.post("/auth/register", formData);

      localStorage.setItem("token", data.accessToken);

      connectSocket();

      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Account Created 🚀");

      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-emerald-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-[36px] border border-slate-200/70 bg-white/85 backdrop-blur-xl shadow-[0_24px_80px_rgba(15,23,42,0.08)] p-10">
        <div className="text-center mb-8">
          <h1 className="text-[40px] leading-tight font-semibold text-slate-900 tracking-tight">
            Create Account
          </h1>

          <p className="mt-3 text-[15px] text-slate-500 leading-6">Join the real-time chat</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 hover:border-slate-300"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 hover:border-slate-300"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 hover:border-slate-300"
            required
          />

          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-900 py-4 font-medium tracking-wide text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.99]"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-slate-500 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
