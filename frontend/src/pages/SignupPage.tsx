import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export const SignupPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showAdminField, setShowAdminField] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateForm = () => {
    if (!fullName.trim()) {
      setError("Full name is required");
      return false;
    }

    // Check if at least one identifier is provided
    const hasEmail = email && email.trim() !== "";
    const hasStudentId = studentId && studentId.trim() !== "";

    if (!hasEmail && !hasStudentId) {
      setError("Either email or student ID is required");
      return false;
    }

    // Validate email if provided
    if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    // Validate student ID if provided
    if (hasStudentId && !/^\d{9,11}$/.test(studentId)) {
      setError("Student ID must be 9-11 digits");
      return false;
    }

    if (!password) {
      setError("Password is required");
      return false;
    }

    // Password strength validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    if (!/(?=.*[a-z])/.test(password)) {
      setError("Password must contain at least one lowercase letter");
      return false;
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      setError("Password must contain at least one uppercase letter");
      return false;
    }

    if (!/(?=.*[0-9])/.test(password)) {
      setError("Password must contain at least one number");
      return false;
    }

    if (!/(?=.*[@#$%^&+=!])/.test(password)) {
      setError(
        "Password must contain at least one special character (@#$%^&+=!)",
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Send empty string for unused field, or null
      const response = await authAPI.signup(
        email.trim() || null,
        studentId.trim() || null,
        password,
        fullName.trim(),
        adminCode.trim() || undefined,
      );

      console.log("Signup successful:", response.data);
      login(response.data);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Signup error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Signup failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-2 text-teal-700">
          Create Account
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Join Campus Navigation System
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email{" "}
              <span className="text-gray-400 text-xs">
                (optional if Student ID provided)
              </span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student ID{" "}
              <span className="text-gray-400 text-xs">
                (optional if Email provided)
              </span>
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="0112310478"
            />
            <p className="text-xs text-gray-500 mt-1">
              9-11 digits (provide either Email or Student ID)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-600 space-y-1">
              <p className="font-semibold">Password must contain:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li className={password.length >= 8 ? "text-green-600" : ""}>
                  At least 8 characters
                </li>
                <li
                  className={
                    /(?=.*[a-z])/.test(password) ? "text-green-600" : ""
                  }
                >
                  One lowercase letter
                </li>
                <li
                  className={
                    /(?=.*[A-Z])/.test(password) ? "text-green-600" : ""
                  }
                >
                  One uppercase letter
                </li>
                <li
                  className={
                    /(?=.*[0-9])/.test(password) ? "text-green-600" : ""
                  }
                >
                  One number
                </li>
                <li
                  className={
                    /(?=.*[@#$%^&+=!])/.test(password) ? "text-green-600" : ""
                  }
                >
                  One special character (@#$%^&+=!)
                </li>
              </ul>
            </div>
          </div>

          {/* Admin Code Section */}
          <div className="border-t pt-4 mt-4">
            <button
              type="button"
              onClick={() => setShowAdminField(!showAdminField)}
              className="text-sm text-gray-500 hover:text-teal-600 flex items-center gap-1"
            >
              {showAdminField ? "▼" : "▶"} Admin Registration
            </button>
            {showAdminField && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Code (optional)
                </label>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter admin secret code"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only enter this if you have been provided an admin code by the
                  system administrator.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-teal-600 hover:text-teal-700 font-semibold"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
};
