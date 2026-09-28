import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../redux/slices/authSlice";

import "../styles/Login.css";

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isAuthenticated = useSelector( (state) => state.auth.isAuthenticated );
    const togglePassword = () => {
        setShowPassword(!showPassword);
    };
    const [errors, setErrors] = useState({
        email: "",
        password: ""
    });
    const validateForm = () => {
        const newErrors = {
            email: "",
            password: ""
        };
        let isValid = true;
        if (email.trim() === "") {
            newErrors.email = "Email is required";
            isValid = false;
        }
        if (password.trim() === "") {
            newErrors.password = "Password is required";
            isValid = false;
        }
        setErrors(newErrors);
        return isValid;
    };
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        setErrors({ ...errors, email: "" });
    };
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setErrors({ ...errors, password: "" });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            setLoading(true);
            setLoginError("");
            const response = await axios.get("http://localhost:3000/users");
            const user = response.data.find((currentUser) => {
                return (currentUser.email === email && currentUser.password === password);
            });
            if (!user) {
                setLoginError("Invalid Email or Password");
                return;
            }
            dispatch(login(user));
            localStorage.setItem("user",JSON.stringify(user));
            navigate("/dashboard");
        }
        catch (error) {
            console.log(error);
            setLoginError("Something Went Wrong.");
        }
        finally {
            setLoading(false);
        }
    };
     if (isAuthenticated) { 
        return <Navigate to="/dashboard" replace />;
    }
    
    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1>TaskFlow</h1>
                    <p>Project Management System</p>
                </div>
                <form className="login-form" onSubmit={handleSubmit} >
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" placeholder="Enter your email" value={email}
                            onChange={handleEmailChange} />
                        {errors.email && (<small className="error"> {errors.email} </small>)}
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <div className="password-box">
                            <input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password}
                                onChange={handlePasswordChange} />
                            <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        {errors.password && (<small className="error"> {errors.password} </small>)}
                    </div>
                    <div className="login-options">
                        <label className="remember">
                            <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                            Remember Me
                        </label>
                        <button type="button" className="forgot-btn" > Forgot Password? </button>
                    </div>
                    {loginError && (<p className="login-error"> {loginError}</p>)}
                    <button className="login-btn" type="submit" disabled={loading} > {loading ? "Logging In..." : "Login"} </button>
                </form>
            </div>
        </div>
    );
}

export default Login;