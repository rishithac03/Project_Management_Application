import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

import "../../styles/bugboard.css";

function BugBoard() {

    const navigate = useNavigate();

    const user = useSelector((state) => state.auth.user);

    const isAdmin = user?.role === "admin";

    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");

    // ========================================
    // LOAD BUGS
    // ========================================

    const loadBugs = async () => {

        try {

            setLoading(true);

            const response = await axios.get(
                "http://localhost:3000/bugs"
            );

            setBugs(response.data);

        } catch (error) {

            console.error(error);

            setError("Unable to load bugs.");

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {

        loadBugs();

    }, []);

    // ========================================
    // UPDATE BUG STATUS
    // ========================================

    const updateBugStatus = async (bugId, newStatus) => {

        try {

            const bugResponse = await axios.get(
                `http://localhost:3000/bugs/${bugId}`
            );

            const oldBug = bugResponse.data;

            if (oldBug.status === newStatus) {
                return;
            }

            // Developer can update only their bugs
            if (
                user?.role === "developer" &&
                Number(oldBug.assignedTo) !== Number(user.id)
            ) {
                return;
            }

            const response = await axios.patch(
                `http://localhost:3000/bugs/${bugId}`,
                {
                    status: newStatus
                }
            );

            const updatedBug = response.data;

            // ========================================
            // DEVELOPER -> ADMIN NOTIFICATION
            // ========================================

            if (user?.role === "developer") {

                const usersResponse = await axios.get(
                    "http://localhost:3000/users"
                );

                const admin = usersResponse.data.find(
                    (item) => item.role === "admin"
                );

                if (admin) {

                    await axios.post(
                        "http://localhost:3000/notifications",
                        {
                            userId: Number(admin.id),

                            type: "bug-status-changed",

                            title: "Bug Status Updated",

                            message:
                                `${user.name} changed bug "${updatedBug.title}" from ${formatBugStatus(oldBug.status)} to ${formatBugStatus(newStatus)}.`,

                            bugId: updatedBug.id,

                            taskId: updatedBug.taskId,

                            read: false,

                            createdAt:
                                new Date().toISOString()
                        }
                    );
                }
            }

            // ========================================
            // UPDATE UI
            // ========================================

            setBugs((currentBugs) =>
                currentBugs.map((bug) =>
                    bug.id === updatedBug.id
                        ? updatedBug
                        : bug
                )
            );

        } catch (error) {

            console.error(
                "Error updating bug status:",
                error
            );

            setError("Unable to update bug status.");

        }
    };

    // ========================================
    // DELETE BUG
    // ========================================

    const deleteBug = async (bugId) => {

        if (!isAdmin) {
            return;
        }

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this bug?"
        );

        if (!confirmDelete) {
            return;
        }

        try {

            await axios.delete(
                `http://localhost:3000/bugs/${bugId}`
            );

            setBugs((currentBugs) =>
                currentBugs.filter(
                    (bug) => bug.id !== bugId
                )
            );

        } catch (error) {

            console.error(error);

            setError("Unable to delete bug.");

        }
    };

    // ========================================
    // FILTER
    // ========================================

    const filteredBugs = bugs.filter((bug) => {

        const statusMatch =
            statusFilter === "all" ||
            bug.status === statusFilter;

        const priorityMatch =
            priorityFilter === "all" ||
            bug.priority === priorityFilter;

        return statusMatch && priorityMatch;
    });

    const todoBugs = filteredBugs.filter(
        (bug) => bug.status === "todo"
    );

    const inProgressBugs = filteredBugs.filter(
        (bug) => bug.status === "in-progress"
    );

    const completedBugs = filteredBugs.filter(
        (bug) => bug.status === "completed"
    );

    // ========================================
    // LOADING
    // ========================================

    if (loading) {

        return (
            <div className="bug-board-loading">
                Loading Bugs...
            </div>
        );
    }

    return (

        <div className="bug-board-layout">

            <Sidebar />

            <div className="bug-board-main">

                <Navbar />

                <main className="bug-board-content">

                    {/* HEADER */}

                    <div className="bug-board-header">

                        <div>

                            <h2>
                                Bugs
                            </h2>

                            <p>
                                Track and manage project bugs.
                            </p>

                        </div>
                        {isAdmin && (
                            <button
                                className="add-bug-btn"
                                onClick={() => navigate("/bugs/new")}
                            >
                                + Create Bug
                            </button>
                        )}
                    </div>

                    {/* ERROR */}

                    {error && (
                        <div className="bug-board-error">
                            {error}
                        </div>
                    )}

                    {/* FILTERS */}

                    <div className="bug-board-filters">

                        <div className="bug-filter-group">

                            <label>
                                Status
                            </label>

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

                        <div className="bug-filter-group">

                            <label>
                                Priority
                            </label>

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

                        <button
                            className="bug-clear-button"
                            onClick={() => {

                                setStatusFilter("all");
                                setPriorityFilter("all");

                            }}
                        >
                            Clear
                        </button>

                    </div>

                    {/* KANBAN */}

                    <div className="bug-kanban-board">

                        <BugColumn
                            title="Todo"
                            bugs={todoBugs}
                            user={user}
                            isAdmin={isAdmin}
                            updateBugStatus={updateBugStatus}
                            deleteBug={deleteBug}
                            navigate={navigate}
                        />

                        <BugColumn
                            title="In Progress"
                            bugs={inProgressBugs}
                            user={user}
                            isAdmin={isAdmin}
                            updateBugStatus={updateBugStatus}
                            deleteBug={deleteBug}
                            navigate={navigate}
                        />

                        <BugColumn
                            title="Completed"
                            bugs={completedBugs}
                            user={user}
                            isAdmin={isAdmin}
                            updateBugStatus={updateBugStatus}
                            deleteBug={deleteBug}
                            navigate={navigate}
                        />

                    </div>

                </main>

            </div>

        </div>
    );
}


// ========================================
// BUG COLUMN
// ========================================

function BugColumn({
    title,
    bugs,
    user,
    isAdmin,
    updateBugStatus,
    deleteBug,
    navigate
}) {

    return (

        <div className="bug-kanban-column">

            <div className="bug-kanban-column-header">

                <h3>
                    {title}
                </h3>

                <span>
                    {bugs.length}
                </span>

            </div>

            <div className="bug-kanban-tasks">

                {bugs.length === 0 ? (

                    <div className="bug-empty-column">
                        No bugs
                    </div>

                ) : (

                    bugs.map((bug) => (

                        <BugCard
                            key={bug.id}
                            bug={bug}
                            user={user}
                            isAdmin={isAdmin}
                            updateBugStatus={updateBugStatus}
                            deleteBug={deleteBug}
                            navigate={navigate}
                        />

                    ))

                )}

            </div>

        </div>
    );
}


// ========================================
// BUG CARD
// ========================================

function BugCard({
    bug,
    user,
    isAdmin,
    updateBugStatus,
    deleteBug,
    navigate
}) {

    const canUpdate =
        isAdmin ||
        Number(bug.assignedTo) === Number(user?.id);

    const moveToNextStatus = () => {

        if (!canUpdate) {
            return;
        }

        if (bug.status === "todo") {

            updateBugStatus(
                bug.id,
                "in-progress"
            );

        } else if (bug.status === "in-progress") {

            updateBugStatus(
                bug.id,
                "completed"
            );
        }
    };

    return (

        <div className="bug-card">

            <div
                className="bug-card-content"
                onClick={() =>
                    navigate(`/bugs/${bug.id}`)
                }
            >

                <div className="bug-card-top">

                    <span className="bug-card-priority">
                        {bug.priority}
                    </span>

                    <span className="bug-card-status">
                        {formatBugStatus(
                            bug.status
                        )}
                    </span>

                </div>

                <h4>
                    {bug.title}
                </h4>

                <p>
                    {bug.description}
                </p>

                <div className="bug-card-footer">

                    <span>
                        {bug.assignedDeveloperName ||
                            "Assigned Developer"}
                    </span>

                    {bug.createdAt && (
                        <span>
                            {formatDate(
                                bug.createdAt
                            )}
                        </span>
                    )}

                </div>

            </div>

            <div className="bug-card-actions">

                {canUpdate &&
                    bug.status !== "completed" && (

                        <button
                            onClick={moveToNextStatus}
                        >
                            {bug.status === "todo"
                                ? "Start"
                                : "Complete"
                            }
                        </button>

                    )}

                {isAdmin && (

                    <>

                        <button
                            onClick={() =>
                                navigate(
                                    `/bugs/${bug.id}/edit`
                                )
                            }
                        >
                            Edit
                        </button>

                        <button
                            onClick={() =>
                                deleteBug(bug.id)
                            }
                        >
                            Delete
                        </button>

                    </>
                )}

            </div>

        </div>
    );
}


// ========================================
// HELPERS
// ========================================

function formatBugStatus(status) {

    if (status === "in-progress") {
        return "In Progress";
    }

    if (status === "completed") {
        return "Completed";
    }

    return "Todo";
}

function formatDate(date) {

    if (!date) {
        return "";
    }

    return new Date(date).toLocaleDateString();
}

export default BugBoard;