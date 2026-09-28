import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

import "../../styles/bugs.css";

function Bugs() {

    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);
    const isAdmin = user?.role === "admin";
    const [bugs, setBugs] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [developers, setDevelopers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    // ========================================
    // LOAD BUGS + TASKS + USERS
    // ========================================

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const [bugsResponse,tasksResponse,usersResponse] = await Promise.all([
                axios.get("http://localhost:3000/bugs"),
                axios.get("http://localhost:3000/tasks"),
                axios.get("http://localhost:3000/users")
            ]);

            setBugs(bugsResponse.data);
            setTasks(tasksResponse.data);
            setDevelopers(usersResponse.data.filter((currentUser) => currentUser.role === "developer"));

        }
        catch (error) {
            console.error(error);
            setError("Unable to load bugs.");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {loadData();}, []);
    // ========================================
    // GET TASK
    // ========================================
    const getTask = (taskId) => {
        return tasks.find((task) => Number(task.id) === Number(taskId));
    };

    // ========================================
    // GET DEVELOPER NAME
    // ========================================

    const getDeveloperName = (taskId) => {
        const task = getTask(taskId);
        if (!task) {
            return "Unknown";
        }
        const developer = developers.find((currentDeveloper) => Number(currentDeveloper.id) === Number(task.assignedTo));
        return developer? developer.name: "Unassigned";
    };

    // ========================================
    // FILTER BUGS
    // ========================================

    const visibleBugs = bugs.filter((bug) => {
        const task = getTask(bug.taskId);
        // Developer sees only bugs
        // belonging to their tasks
        if (!isAdmin) {
            if (!task || Number(task.assignedTo) !== Number(user?.id))
            {
                return false;
            }
        }
        // SEARCH
        const searchMatch = bug.title?.toLowerCase().includes(search.toLowerCase()) ||
            bug.description ?.toLowerCase().includes(search.toLowerCase());
        // STATUS
        const statusMatch = statusFilter === "all" || bug.status === statusFilter;
        // PRIORITY
        const priorityMatch = priorityFilter === "all" || bug.priority === priorityFilter;
        return (
            searchMatch &&
            statusMatch &&
            priorityMatch
        );

    });


    // ========================================
    // KANBAN COLUMNS
    // ========================================

    const openBugs = visibleBugs.filter((bug) => bug.status === "open");
    const inProgressBugs = visibleBugs.filter((bug) => bug.status === "in-progress");
    const resolvedBugs = visibleBugs.filter((bug) => bug.status === "resolved");
    // ========================================
    // UPDATE BUG STATUS
    // ========================================
    const updateBugStatus = async (bugId, newStatus) => {
        try {
            const bugResponse = await axios.get(`http://localhost:3000/bugs/${bugId}`);
            const oldBug = bugResponse.data;
            if (oldBug.status === newStatus)
            {
                return;
            }
            const response = await axios.patch( `http://localhost:3000/bugs/${bugId}`,{status: newStatus});
            const updatedBug = response.data;
            // Update UI immediately
            setBugs((previousBugs) =>previousBugs.map((bug) =>Number(bug.id) === Number(updatedBug.id)? updatedBug: bug));
            // Developer status notification
            // goes to admin

            if (user?.role === "developer")
            {
                const usersResponse = await axios.get("http://localhost:3000/users");
                const admin = usersResponse.data.find((currentUser) => currentUser.role === "admin");
                if (admin) {
                    await axios.post("http://localhost:3000/notifications",
                        {
                            userId: Number(admin.id),
                            type: "bug-status-changed",
                            title: "Bug Status Updated",
                            message: `${user.name} changed "${updatedBug.title}" from ${formatStatus(oldBug.status)} to ${formatStatus(newStatus)}.`,
                            bugId: updatedBug.id,
                            read: false,
                            createdAt: new Date().toISOString()
                        }
                    );
                }
            }
        } catch (error) {
            console.error("Error updating bug status:",error);
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
        const confirmDelete = window.confirm("Are you sure you want to delete this bug?");
        if (!confirmDelete) {
            return;
        }
        try {
            await axios.delete(`http://localhost:3000/bugs/${bugId}`);
            setBugs((previousBugs) => previousBugs.filter((bug) => Number(bug.id) !== Number(bugId)));
        } catch (error) {
            console.error(error);
            setError("Unable to delete bug.");
        }
    };
    // ========================================
    // CLEAR FILTERS
    // ========================================
    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setPriorityFilter("all");
    };
    // ========================================
    // LOADING
    // ========================================
    if (loading) {
        return (
            <div className="bugs-loading">
                Loading Bugs...
            </div>
        );

    }
    // ========================================
    // MAIN UI
    // ========================================

    return (
        <div className="bugs-layout">
            <Sidebar />
            <div className="bugs-main">
                <Navbar />
                <main className="bugs-content">
                    {/* ================================= */}
                    {/* HEADER */}
                    {/* ================================= */}
                    <div className="bugs-header">
                        <div>
                            <h2> Bugs </h2>
                            <p> Track and manage project bugs. </p>
                        </div>
                        {isAdmin && (
                            <button className="create-bug-button" onClick={() =>
                                    navigate("/bugs/new")
                                }> + Create Bug
                            </button>
                        )}
                    </div>
                    {/* ================================= */}
                    {/* ERROR */}
                    {/* ================================= */}
                    {error && (
                        <div className="bugs-error">
                            {error}
                        </div>
                    )}
                    {/* ================================= */}
                    {/* FILTERS */}
                    {/* ================================= */}
                    <div className="bugs-filters">
                        <div className="bug-search">
                            <input type="text" placeholder="Search bugs..." value={search} onChange={(e) => setSearch(e.target.value)}/>
                        </div>
                        <div className="bug-filter">
                            <select value={statusFilter} onChange={(e) =>setStatusFilter(e.target.value)}>
                                <option value="all"> All Status </option>
                                <option value="open"> Open </option>
                                <option value="in-progress"> In Progress </option>
                                <option value="resolved"> Resolved </option>
                            </select>
                        </div>
                        <div className="bug-filter">
                            <select value={priorityFilter} onChange={(e) => setPriorityFilter( e.target.value )}>
                                <option value="all"> All Priority </option>
                                <option value="high"> High </option>
                                <option value="medium"> Medium </option>
                                <option value="low"> Low </option>
                            </select>
                        </div>
                        <button className="clear-bug-filter" onClick={clearFilters}> Clear </button>
                    </div>
                    {/* ================================= */}
                    {/* BUG COUNT */}
                    {/* ================================= */}
                    <div className="bugs-count">
                        {visibleBugs.length}{" "}
                        {visibleBugs.length === 1 ? "Bug" : "Bugs"}
                    </div>
                    {/* ================================= */}
                    {/* KANBAN BOARD */}
                    {/* ================================= */}
                    <div className="bug-kanban-board">
                        {/* ================================= */}
                        {/* OPEN */}
                        {/* ================================= */}
                        <BugColumn
                            title="Open"
                            status="open"
                            bugs={openBugs}
                            getTask={getTask}
                            getDeveloperName={getDeveloperName}
                            isAdmin={isAdmin}
                            user={user}
                            updateBugStatus={updateBugStatus}
                            deleteBug={deleteBug}
                            navigate={navigate}
                        />
                        {/* ================================= */}
                        {/* IN PROGRESS */}
                        {/* ================================= */}
                        <BugColumn
                            title="In Progress"
                            status="in-progress"
                            bugs={inProgressBugs}
                            getTask={getTask}
                            getDeveloperName={getDeveloperName}
                            isAdmin={isAdmin}
                            user={user}
                            updateBugStatus={updateBugStatus}
                            deleteBug={deleteBug}
                            navigate={navigate}
                        />
                        {/* ================================= */}
                        {/* RESOLVED */}
                        {/* ================================= */}
                        <BugColumn
                            title="Resolved"
                            status="resolved"
                            bugs={resolvedBugs}
                            getTask={getTask}
                            getDeveloperName={getDeveloperName}
                            isAdmin={isAdmin}
                            user={user}
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


// ======================================================
// BUG COLUMN
// ======================================================

function BugColumn({
    title,
    status,
    bugs,
    getTask,
    getDeveloperName,
    isAdmin,
    user,
    updateBugStatus,
    deleteBug,
    navigate
}) {

    return (

        <div
            className={`bug-kanban-column bug-column-${status}`}
        >


            {/* COLUMN HEADER */}

            <div className="bug-kanban-column-header">

                <h3>
                    {title}
                </h3>

                <span>
                    {bugs.length}
                </span>

            </div>


            {/* BUGS */}

            <div className="bug-kanban-tasks">

                {bugs.length === 0 ? (

                    <div className="empty-bug-column">

                        No bugs

                    </div>

                ) : (

                    bugs.map((bug) => (

                        <BugCard
                            key={bug.id}
                            bug={bug}
                            getTask={getTask}
                            getDeveloperName={
                                getDeveloperName
                            }
                            isAdmin={isAdmin}
                            user={user}
                            updateBugStatus={
                                updateBugStatus
                            }
                            deleteBug={deleteBug}
                            navigate={navigate}
                        />

                    ))

                )}

            </div>

        </div>

    );

}


// ======================================================
// BUG CARD
// ======================================================

function BugCard({
    bug,
    getTask,
    getDeveloperName,
    isAdmin,
    user,
    updateBugStatus,
    deleteBug,
    navigate
}) {

    const task =
        getTask(bug.taskId);


    // Developer can update only
    // bugs belonging to their task

    const canUpdate =
        !isAdmin &&
        task &&
        Number(task.assignedTo) ===
            Number(user?.id);


    // ========================================
    // NEXT STATUS
    // ========================================

    const getNextStatus = () => {

        if (bug.status === "open") {
            return "in-progress";
        }

        if (bug.status === "in-progress") {
            return "resolved";
        }
        return null;

    };


    const nextStatus =
        getNextStatus();


    const moveToNextStatus = () => {

        if (!canUpdate) {
            return;
        }

        if (!nextStatus) {
            return;
        }

        updateBugStatus(
            bug.id,
            nextStatus
        );

    };


    return (

        <div className="bug-card">


            {/* ================================= */}
            {/* CARD CONTENT */}
            {/* ================================= */}

            <div
                className="bug-card-content"
                onClick={() =>
                    navigate(
                        `/bugs/${bug.id}`
                    )
                }
            >

                <div className="bug-card-top">

                    <span className="bug-id">
                        BUG-{bug.id}
                    </span>

                    <span
                        className={`bug-priority bug-priority-${bug.priority}`}
                    >
                        {formatText(
                            bug.priority
                        )}
                    </span>

                </div>


                <h3>
                    {bug.title}
                </h3>


                <p>
                    {bug.description}
                </p>


                <div className="bug-card-meta">

                    <span>
                        Task:{" "}
                        {task?.title ||
                            "Unknown"}
                    </span>

                    <span>
                        Developer:{" "}
                        {getDeveloperName(
                            bug.taskId
                        )}
                    </span>

                </div>

            </div>


            {/* ================================= */}
            {/* CARD FOOTER */}
            {/* ================================= */}

            <div className="bug-card-footer">


                <span
                    className={`bug-status bug-status-${bug.status}`}
                >
                    {formatStatus(
                        bug.status
                    )}
                </span>


                {/* DEVELOPER STATUS BUTTON */}

                {canUpdate &&
                    nextStatus && (

                        <button
                            className="bug-status-button"
                            onClick={moveToNextStatus}
                        >

                            {bug.status === "open"
                                ? "Start"
                                : bug.status === "in-progress"
                                ? "Resolve"
                                : "Close"}

                        </button>

                    )}


                {/* ADMIN ACTIONS */}

                {isAdmin && (

                    <div className="bug-actions">

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
                                deleteBug(
                                    bug.id
                                )
                            }
                        >
                            Delete
                        </button>

                    </div>

                )}

            </div>

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

    if (status === "resolved") {
        return "Resolved";
    }


    return "Open";

}


// ======================================================
// FORMAT TEXT
// ======================================================

function formatText(text) {

    if (!text) {
        return "";
    }

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );

}


export default Bugs;