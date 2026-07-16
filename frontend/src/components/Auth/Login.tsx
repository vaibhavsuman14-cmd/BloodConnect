import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import "./Auth.css";

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [userType, setUserType] = useState<"user" | "hospital">("user");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password, userType);
      toast.success("Login successful!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🩸 BloodConnect</h1>
          <p>Connect donors with those in need</p>
        </div>

        <div className="user-type-toggle">
          <button
            type="button"
            className={userType === "user" ? "active" : ""}
            onClick={() => setUserType("user")}
          >
            I'm a Donor
          </button>
          <button
            type="button"
            className={userType === "hospital" ? "active" : ""}
            onClick={() => setUserType("hospital")}
          >
            I'm a Hospital
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              placeholder="Enter your email"
            />
            {errors.email && (
              <span className="error">{errors.email.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              placeholder="Enter your password"
            />
            {errors.password && (
              <span className="error">{errors.password.message}</span>
            )}
          </div>

          <button type="submit" disabled={isLoading} className="submit-btn">
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="demo-credentials">
          <h3>Demo Credentials:</h3>
          <div className="demo-section">
            <h4>Hospital Login:</h4>
            <p>Email: aiims@hospital.com</p>
            <p>Password: hospital123</p>
          </div>
          <div className="demo-section">
            <h4>Donor Login:</h4>
            <p>Email: aarav.sharma0@gmail.com</p>
            <p>Password: user123</p>
          </div>
        </div>
      </div>
      <div className="extra">
        <p>&#169;Made by Vaibhav Suman</p>
      </div>
    </div>
  );
};

export default Login;
