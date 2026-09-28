import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";

import "../styles/sidebar.css";

function Sidebar() {

    const user = useSelector(
        (state) => state.auth.user
    );

    return (

        <aside className="sidebar">

            <div className="sidebar-logo">
                <h2>TaskFlow</h2>
            </div>

            <nav className="sidebar-nav">

                <NavLink
                    to="/dashboard"
                    className="sidebar-link"
                >
                    Dashboard
                </NavLink>

                <NavLink
                    to="/workspaces"
                    className="sidebar-link"
                >
                    Workspaces
                </NavLink>
                <NavLink
                    to="/my-tasks"
                    className={({ isActive }) =>
                        isActive
                            ? "sidebar-link active"
                            : "sidebar-link"
                    }> Tasks
                </NavLink>
                <NavLink to="/bugs" className={({ isActive }) =>
                        isActive
                            ? "sidebar-link active"
                            : "sidebar-link"
                    }> Bugs
                </NavLink>

                {/* {user?.role === "admin" && (

                    <NavLink
                        to="/tasks"
                        className="sidebar-link"
                    >
                        All Tasks
                    </NavLink>

                )}

                {user?.role === "developer" && (

                    <NavLink
                        to="/my-tasks"
                        className="sidebar-link"
                    >
                        My Tasks
                    </NavLink> 

                )}*/}

                <NavLink
                    to="/calendar"
                    className="sidebar-link"
                >
                    Calendar
                </NavLink>

                <NavLink
                    to="/notifications"
                    className="sidebar-link"
                >
                    Notifications
                </NavLink>

            </nav>

        </aside>

    );
}

export default Sidebar;