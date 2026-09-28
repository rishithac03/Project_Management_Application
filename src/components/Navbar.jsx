import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import NotificationBell from "../components/notifications/NotificationBell.jsx";

import "../styles/navbar.css";

function Navbar() {

    const dispatch = useDispatch();

    const navigate = useNavigate();

    const user = useSelector(
        (state) => state.auth.user
    );

    const handleLogout = () => {

        dispatch(logout());

        localStorage.removeItem("user");

        navigate("/", {
            replace: true
        });

    };

    return (

        <header className="navbar">

            <div className="navbar-title">

                <h1>Dashboard</h1>

            </div>

            <div className="navbar-user">

                <div className="user-info">

                    <span className="user-name">
                        {user?.name}
                    </span>

                    <span className="user-role">
                        {user?.role}
                    </span>

                </div>
                <NotificationBell />
                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>

        </header>

    );
}

export default Navbar;