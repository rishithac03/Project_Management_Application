import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/dashboard.css";


// ======================================================
// MAIN DASHBOARD
// ======================================================

function Dashboard() {
    const user = useSelector((state) => state.auth.user);
    const navigate = useNavigate();
    if (!user) {
        navigate("/");
        return null;
    }
    if (user.role === "admin") {
        return <AdminDashboard />;
    }
    if (user.role === "developer") {
        return <DeveloperDashboard />;
    }
    return null;
}


// ======================================================
// ADMIN DASHBOARD
// ======================================================

function AdminDashboard() {
    const user = useSelector((state) => state.auth.user);
    const [workspaces, setWorkspaces] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                const [ workspaceResponse, projectResponse, taskResponse] = await Promise.all([
                    axios.get("http://localhost:3000/workspaces"),
                    axios.get("http://localhost:3000/projects"),
                    axios.get("http://localhost:3000/tasks")
                ]);
                setWorkspaces(workspaceResponse.data);
                setProjects(projectResponse.data);
                setTasks(taskResponse.data);
            } catch (error) {
                console.error(error);
                setError("Unable to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);
    const todoTasks = tasks.filter((task) => task.status === "todo");
    const inProgressTasks = tasks.filter((task) => task.status === "in-progress");
    const completedTasks = tasks.filter((task) => task.status === "completed");
    const upcomingTasks = [...tasks].filter((task) => task.status !== "completed")
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 5);
    const recentTasks = [...tasks].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 5);
    if (loading) {
        return (
            <div className="dashboard-loading">
                Loading Dashboard...
            </div>
        );
    }
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-main">
                <Navbar />
                <main className="dashboard-content">
                    <div className="dashboard-header">
                        <h2> Admin Dashboard </h2>
                        <p> Welcome back,{" "} {user?.name} </p>
                    </div>
                    {error && (
                        <div className="dashboard-error"> {error} </div>
                    )}
                    <div className="dashboard-stats">
                        <DashboardCard
                            title="Workspaces"
                            value={
                                workspaces.length
                            }
                        />
                        <DashboardCard
                            title="Projects"
                            value={
                                projects.length
                            }
                        />
                        <DashboardCard
                            title="Total Tasks"
                            value={
                                tasks.length
                            }
                        />
                        <DashboardCard
                            title="Completed"
                            value={
                                completedTasks.length
                            }
                        />
                    </div>
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h3> Task Summary </h3>
                        </div>
                        <div className="task-summary">
                            <SummaryItem
                                label="Todo"
                                value={
                                    todoTasks.length
                                }
                            />

                            <SummaryItem
                                label="In Progress"
                                value={
                                    inProgressTasks.length
                                }
                            />

                            <SummaryItem
                                label="Completed"
                                value={
                                    completedTasks.length
                                }
                            />
                        </div>
                    </section>
                    <div className="dashboard-two-columns">
                        <section className="dashboard-section">
                            <div className="section-header">
                                <h3> Upcoming Deadlines </h3>
                            </div>
                            <div className="upcoming-list">
                                {upcomingTasks.map(
                                    (task) => (
                                        <div
                                            className="upcoming-item"
                                            key={task.id}
                                        >
                                            <div>
                                                <strong> {task.title} </strong>
                                                <span> {task.deadline} </span>
                                            </div>
                                            <span> {formatPriority(task.priority)} </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </section>

                        <section className="dashboard-section">
                            <div className="section-header">
                                <h3> Recent Tasks </h3>
                            </div>
                            <div className="recent-task-list">
                                {recentTasks.map(
                                    (task) => (
                                        <div className="recent-task" key={task.id} >
                                            <div>
                                                <strong> {task.title} </strong>
                                                <p> {task.description} </p>
                                            </div>
                                            <div className="recent-task-info">
                                                <span>{formatStatus(task.status)}</span>
                                                <span>{formatPriority(task.priority)}</span>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}


// ======================================================
// DEVELOPER DASHBOARD
// ======================================================

function DeveloperDashboard() {

    const user = useSelector(
        (state) => state.auth.user
    );


    const [tasks, setTasks] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // ==================================================
    // LOAD ONLY MY TASKS
    // ==================================================

    useEffect(() => {

        const loadDeveloperTasks = async () => {

            try {

                setLoading(true);

                const response = await axios.get(
                    "http://localhost:3000/tasks"
                );


                const myTasks =
                    response.data.filter(
                        (task) =>
                            Number(task.assignedTo) ===
                            Number(user.id)
                    );


                setTasks(myTasks);

            } catch (error) {

                console.error(error);

                setError(
                    "Unable to load your tasks."
                );

            } finally {

                setLoading(false);

            }

        };


        loadDeveloperTasks();

    }, [user.id]);


    // ==================================================
    // TASK COUNTS
    // ==================================================

    const todoTasks = tasks.filter(
        (task) =>
            task.status === "todo"
    );


    const inProgressTasks = tasks.filter(
        (task) =>
            task.status === "in-progress"
    );


    const completedTasks = tasks.filter(
        (task) =>
            task.status === "completed"
    );


    // ==================================================
    // UPCOMING DEADLINES
    // ==================================================

    const upcomingTasks = [...tasks]
        .filter(
            (task) =>
                task.status !== "completed"
        )
        .sort(
            (a, b) =>
                new Date(a.deadline) -
                new Date(b.deadline)
        )
        .slice(0, 5);


    if (loading) {

        return (
            <div className="dashboard-loading">
                Loading Dashboard...
            </div>
        );

    }


    return (

        <div className="dashboard-layout">

            <Sidebar />

            <div className="dashboard-main">

                <Navbar />

                <main className="dashboard-content">


                    {/* HEADER */}

                    <div className="dashboard-header">

                        <h2>
                            Developer Dashboard
                        </h2>

                        <p>
                            Welcome back,{" "}
                            {user?.name}
                        </p>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="dashboard-error">
                            {error}
                        </div>

                    )}


                    {/* STAT CARDS */}

                    <div className="dashboard-stats">

                        <DashboardCard
                            title="My Tasks"
                            value={
                                tasks.length
                            }
                        />

                        <DashboardCard
                            title="Todo"
                            value={
                                todoTasks.length
                            }
                        />

                        <DashboardCard
                            title="In Progress"
                            value={
                                inProgressTasks.length
                            }
                        />

                        <DashboardCard
                            title="Completed"
                            value={
                                completedTasks.length
                            }
                        />

                    </div>


                    {/* TASK SUMMARY */}

                    <section className="dashboard-section">

                        <div className="section-header">

                            <h3>
                                My Task Summary
                            </h3>

                        </div>


                        <div className="task-summary">

                            <SummaryItem
                                label="Todo"
                                value={
                                    todoTasks.length
                                }
                            />

                            <SummaryItem
                                label="In Progress"
                                value={
                                    inProgressTasks.length
                                }
                            />

                            <SummaryItem
                                label="Completed"
                                value={
                                    completedTasks.length
                                }
                            />

                        </div>

                    </section>


                    {/* UPCOMING DEADLINES */}

                    <section className="dashboard-section">

                        <div className="section-header">

                            <h3>
                                My Upcoming Deadlines
                            </h3>

                        </div>


                        <div className="upcoming-list">

                            {upcomingTasks.length === 0 ? (

                                <p className="empty-text">
                                    No upcoming deadlines.
                                </p>

                            ) : (

                                upcomingTasks.map(
                                    (task) => (

                                        <div
                                            className="upcoming-item"
                                            key={task.id}
                                        >

                                            <div>

                                                <strong>
                                                    {task.title}
                                                </strong>

                                                <span>
                                                    {
                                                        task.deadline
                                                    }
                                                </span>

                                            </div>

                                            <span>
                                                {
                                                    formatPriority(
                                                        task.priority
                                                    )
                                                }
                                            </span>

                                        </div>

                                    )
                                )

                            )}

                        </div>

                    </section>

                </main>

            </div>

        </div>

    );

}


// ======================================================
// REUSABLE DASHBOARD CARD
// ======================================================

function DashboardCard({
    title,
    value
}) {

    return (

        <div className="dashboard-card">

            <span>
                {title}
            </span>

            <strong>
                {value}
            </strong>

        </div>

    );

}


// ======================================================
// SUMMARY ITEM
// ======================================================

function SummaryItem({
    label,
    value
}) {

    return (

        <div className="summary-item">

            <span>
                {label}
            </span>

            <strong>
                {value}
            </strong>

        </div>

    );

}


// ======================================================
// FORMAT STATUS
// ======================================================

function formatStatus(status) {

    if (status === "in-progress") {

        return "In Progress";

    }

    if (status === "completed") {

        return "Completed";

    }

    return "Todo";

}


// ======================================================
// FORMAT PRIORITY
// ======================================================

function formatPriority(priority) {

    if (!priority) {

        return "";

    }

    return (
        priority.charAt(0).toUpperCase() +
        priority.slice(1)
    );

}


export default Dashboard;



// import { useEffect, useState } from "react";
// import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// import Sidebar from "../components/Sidebar";
// import Navbar from "../components/Navbar";

// import "../styles/dashboard.css";

// function Dashboard() {
//     const user = useSelector((state) => state.auth.user);
//     const navigate= useNavigate();

//     const [workspaces, setWorkspaces] = useState([]);
//     const [projects, setProjects] = useState([]);
//     const [tasks, setTasks] = useState([]);
//     const [developers, setDevelopers] = useState([]);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const loadDashboard = async () => {
//             try {
//                 const [ workspaceResponse, projectResponse, taskResponse, userResponse] = await Promise.all([
//                     axios.get("http://localhost:3000/workspaces"),
//                     axios.get("http://localhost:3000/projects"),
//                     axios.get("http://localhost:3000/tasks"),
//                     axios.get("http://localhost:3000/users")
//                 ]);
//                 setWorkspaces(workspaceResponse.data);
//                 setProjects(projectResponse.data);
//                 setTasks(taskResponse.data);
//                 setDevelopers( userResponse.data.filter((currentUser) => currentUser.role === "developer"));
//             }
//             catch (error) {
//                 console.error( "Dashboard error:", error );
//             }
//             finally {
//                 setLoading(false);
//             }
//         };
//         loadDashboard();
//     }, []);

//     const visibleTasks = isAdmin ? tasks : tasks.filter((task) => task.assignedTo === user?.id);
//     const myTasks = tasks.filter((task) => task.assignedTo === user?.id );
//     const inProgressTasks = myTasks.filter((task) => task.status === "in-progress");
//     const completedTasks = myTasks.filter((task) => task.status === "completed");

//     if (loading) {
//         return (
//             <div className="dashboard-loading"> Loading Dashboard... </div>
//         );
//     }
//     return (
//         <div className="dashboard-layout">
//             <Sidebar />
//             <div className="dashboard-main">
//                 <Navbar />
//                 <main className="dashboard-content">
//                     <div className="dashboard-welcome">
//                         <h2> Welcome back, {user?.name} </h2>
//                         <p> Here's what's happening with your projects today. </p>
//                     </div>
//                     {user?.role === "admin" ? (
//                         <AdminDashboard
//                             workspaces={workspaces}
//                             projects={projects}
//                             tasks={tasks}
//                             developers={developers}
//                         />
//                     ) : (
//                         <DeveloperDashboard
//                             tasks={myTasks}
//                             inProgressTasks={inProgressTasks}
//                             completedTasks={completedTasks}
//                         />
//                     )}
//                 </main>
//             </div>
//         </div>
//     );
// }
// export default Dashboard;


// function AdminDashboard({workspaces, projects, tasks, developers}){
//     return (
//         <>
//             <div className="dashboard-cards">
//                 <div className="dashboard-card">
//                     <span>Workspaces</span>
//                     <strong> {workspaces.length} </strong>
//                 </div>
//                 <div className="dashboard-card">
//                     <span>Projects</span>
//                     <strong> {projects.length} </strong>
//                 </div>
//                 <div className="dashboard-card">
//                     <span> Total Tasks </span>
//                     <strong> {tasks.length} </strong>
//                 </div>
//                 <div className="dashboard-card">
//                     <span>Developers</span>
//                     <strong> {developers.length} </strong>
//                 </div>
//             </div>
//             <div className="dashboard-section">
//                 <div className="section-header">
//                     <h3> Recent Tasks </h3>
//                     <button> View All </button>
//                 </div>
//                 {tasks.length === 0 ? (
//                     <div className="empty-state">
//                         <p> No tasks available. </p>
//                     </div>
//                 ) : (
//                     <div className="task-list">
//                         {tasks.slice(0, 5).map(
//                             (task) => (
//                                 <div className="dashboard-task" key={task.id} >
//                                     <div>
//                                         <strong> {task.title} </strong>
//                                         <p> {task.description} </p>
//                                     </div>
//                                     <span> {task.status} </span>
//                                 </div>
//                             ))}
//                     </div>
//                 )}
//             </div>
//         </>
//     );
// }


// function DeveloperDashboard({ tasks, inProgressTasks, completedTasks }) {
//     return (
//         <>
//             <div className="dashboard-cards">
//                 <div className="dashboard-card">
//                     <span>Assigned Tasks</span>
//                     <strong> {tasks.length} </strong>
//                 </div>
//                 <div className="dashboard-card">
//                     <span>In Progress</span>
//                     <strong> {inProgressTasks.length} </strong>
//                 </div>
//                 <div className="dashboard-card">
//                     <span>Completed</span>
//                     <strong> {completedTasks.length} </strong>
//                 </div>
//                 <div className="dashboard-card">
//                     <span>Deadlines</span>
//                     <strong> {tasks.length} </strong>
//                 </div>
//             </div>
//             <div className="dashboard-section">
//                 <div className="section-header">
//                     <h3> My Tasks </h3>
//                     <button> View All </button>
//                 </div>
//                 {tasks.length === 0 ? (
//                     <div className="empty-state">
//                         <p> No tasks assigned to you. </p>
//                     </div>
//                 ) : (
//                     <div className="task-list">
//                         {tasks.map((task) => (
//                             <div className="dashboard-task" key={task.id} >
//                                 <div>
//                                     <strong> {task.title} </strong>
//                                     <p> Deadline: {task.deadline} </p>
//                                 </div>
//                                 <span> {task.status} </span>
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </div>
//         </>
//     );
// }