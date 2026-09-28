import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import "../styles/mytasks.css";

function MyTasks() {

    const user = useSelector(
        (state) => state.auth.user
    );

    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ========================================
    // LOAD TASKS
    // ========================================

    useEffect(() => {
        const loadTasks = async () => {
            try {
                setLoading(true);
                const response = await axios.get("http://localhost:3000/tasks");
                let taskData = response.data;
                // Developer → only assigned tasks
                if (user?.role === "developer") {
                    taskData = taskData.filter(
                        (task) =>
                            Number(task.assignedTo) ===
                            Number(user.id)
                    );

                }
                setTasks(taskData);
            } catch (error) {
                console.error(error);
                setError( "Unable to load tasks." );
            } finally {
                setLoading(false);
            }
        };
        if (user) {loadTasks();}
    }, [user]);


    // ========================================
    // FILTER TASKS
    // ========================================

    const filteredTasks = tasks.filter(
        (task) => {

            const searchMatch =
                task.title
                    ?.toLowerCase()
                    .includes(
                        search.toLowerCase()
                    );


            const statusMatch =
                statusFilter === "all" ||
                task.status === statusFilter;


            const priorityMatch =
                priorityFilter === "all" ||
                task.priority === priorityFilter;


            return (
                searchMatch &&
                statusMatch &&
                priorityMatch
            );

        }
    );


    // ========================================
    // STATUS FORMAT
    // ========================================

    const formatStatus = (status) => {

        if (status === "in-progress") {
            return "In Progress";
        }

        if (status === "completed") {
            return "Completed";
        }

        return "Todo";

    };


    // ========================================
    // PRIORITY FORMAT
    // ========================================

    const formatPriority = (priority) => {

        if (!priority) {
            return "-";
        }

        return (
            priority.charAt(0).toUpperCase() +
            priority.slice(1)
        );

    };


    // ========================================
    // DEADLINE FORMAT
    // ========================================

    const formatDeadline = (deadline) => {

        if (!deadline) {
            return "-";
        }

        const date = new Date(deadline);

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    };


    // ========================================
    // LOADING
    // ========================================

    if (loading) {

        return (
            <div className="mytasks-loading">
                Loading Tasks...
            </div>
        );

    }


    return (

        <div className="mytasks-layout">

            <Sidebar />

            <div className="mytasks-main">

                <Navbar />

                <main className="mytasks-content">


                    {/* HEADER */}

                    <div className="mytasks-header">

                        <div>

                            <h2>
                                My Tasks
                            </h2>

                            <p>
                                Manage and track your assigned tasks
                            </p>

                        </div>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="mytasks-error">
                            {error}
                        </div>

                    )}


                    {/* FILTERS */}

                    <div className="mytasks-filters">


                        {/* SEARCH */}

                        <div className="task-search">

                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                            />

                        </div>


                        {/* STATUS */}

                        <div className="task-filter">

                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="all">
                                    All Status
                                </option>

                                <option value="todo">
                                    Todo
                                </option>

                                <option value="in-progress">
                                    In Progress
                                </option>

                                <option value="completed">
                                    Completed
                                </option>

                            </select>

                        </div>


                        {/* PRIORITY */}

                        <div className="task-filter">

                            <select
                                value={priorityFilter}
                                onChange={(e) =>
                                    setPriorityFilter(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="all">
                                    All Priority
                                </option>

                                <option value="high">
                                    High
                                </option>

                                <option value="medium">
                                    Medium
                                </option>

                                <option value="low">
                                    Low
                                </option>

                            </select>

                        </div>

                    </div>


                    {/* TASK COUNT */}

                    <div className="mytasks-count">

                        {filteredTasks.length}{" "}
                        task
                        {filteredTasks.length !== 1
                            ? "s"
                            : ""}

                    </div>


                    {/* TASK TABLE */}

                    <div className="mytasks-table-container">

                        {filteredTasks.length === 0 ? (

                            <div className="no-tasks">

                                <h3>
                                    No tasks found
                                </h3>

                                <p>
                                    Try changing your search
                                    or filters.
                                </p>

                            </div>

                        ) : (

                            <table className="mytasks-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Task
                                        </th>

                                        <th>
                                            Project
                                        </th>

                                        <th>
                                            Priority
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Deadline
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {filteredTasks.map(
                                        (task) => (

                                            <tr
                                                key={task.id}
                                                onClick={() =>
                                                    navigate(
                                                        `/tasks/${task.id}`
                                                    )
                                                }
                                            >

                                                <td>

                                                    <div className="task-title">

                                                        <strong>
                                                            {
                                                                task.title
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                task.description
                                                            }
                                                        </span>

                                                    </div>

                                                </td>


                                                <td>

                                                    {task.projectName ||
                                                        "-"}

                                                </td>


                                                <td>

                                                    <span
                                                        className={`priority priority-${task.priority}`}
                                                    >
                                                        {
                                                            formatPriority(
                                                                task.priority
                                                            )
                                                        }
                                                    </span>

                                                </td>


                                                <td>

                                                    <span
                                                        className={`status status-${task.status}`}
                                                    >
                                                        {
                                                            formatStatus(
                                                                task.status
                                                            )
                                                        }
                                                    </span>

                                                </td>


                                                <td>

                                                    {
                                                        formatDeadline(
                                                            task.deadline
                                                        )
                                                    }

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        )}

                    </div>

                </main>

            </div>

        </div>

    );

}

export default MyTasks;