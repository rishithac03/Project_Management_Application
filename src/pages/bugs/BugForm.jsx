import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

import "../../styles/bugform.css";

function BugForm() {
    const navigate = useNavigate();
    const { bugId } = useParams();
    const user = useSelector((state) => state.auth.user);
    const isAdmin = user?.role === "admin";
    const isEditMode = Boolean(bugId);
    const [tasks, setTasks] = useState([]);
    const [formData, setFormData] = useState({title: "", description: "", taskId: "", priority: "medium", status: "open"});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // ========================================
    // LOAD DATA
    // ========================================

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const tasksResponse = await axios.get( "http://localhost:3000/tasks" );

                // Only completed tasks
                const completedTasks =
                    tasksResponse.data.filter(
                        (task) =>
                            task.status === "completed"
                    );

                setTasks(completedTasks);


                // --------------------------------
                // EDIT MODE
                // --------------------------------

                if (isEditMode) {

                    const bugResponse =
                        await axios.get(
                            `http://localhost:3000/bugs/${bugId}`
                        );

                    const bug =
                        bugResponse.data;

                    setFormData({
                        title: bug.title || "",
                        description:
                            bug.description || "",
                        taskId:
                            bug.taskId
                                ? String(bug.taskId)
                                : "",
                        priority:
                            bug.priority || "medium",
                        status:
                            bug.status || "open"
                    });

                }

            } catch (error) {

                console.error(error);

                setError(
                    "Unable to load bug information."
                );

            } finally {

                setLoading(false);

            }

        };


        loadData();

    }, [bugId, isEditMode]);


    // ========================================
    // ACCESS CHECK
    // ========================================

    if (!isAdmin) {

        return (

            <div className="bug-form-layout">

                <Sidebar />

                <div className="bug-form-main">

                    <Navbar />

                    <main className="bug-form-content">

                        <div className="bug-form-error-page">

                            <h2>
                                Access Denied
                            </h2>

                            <p>
                                Only administrators
                                can manage bugs.
                            </p>

                            <button
                                onClick={() =>
                                    navigate("/bugs")
                                }
                            >
                                Back to Bugs
                            </button>

                        </div>

                    </main>

                </div>

            </div>

        );

    }


    // ========================================
    // INPUT CHANGE
    // ========================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setFormData(
            (previousData) => ({
                ...previousData,
                [name]: value
            })
        );

    };


    // ========================================
    // SUBMIT
    // ========================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");


        // --------------------------------
        // VALIDATION
        // --------------------------------

        if (!formData.title.trim()) {

            setError(
                "Bug title is required."
            );

            return;

        }


        if (!formData.description.trim()) {

            setError(
                "Bug description is required."
            );

            return;

        }


        if (!formData.taskId) {

            setError(
                "Please select a completed task."
            );

            return;

        }


        try {

            setSaving(true);


            // --------------------------------
            // CHECK SELECTED TASK
            // --------------------------------

            const selectedTask =
                tasks.find(
                    (task) =>
                        Number(task.id) ===
                        Number(formData.taskId)
                );


            if (!selectedTask) {

                setError(
                    "Selected task is not valid."
                );

                return;

            }


            // --------------------------------
            // EXTRA SAFETY CHECK
            // --------------------------------

            if (
                selectedTask.status !==
                "completed"
            ) {

                setError(
                    "Bug can only be created for a completed task."
                );

                return;

            }


            // ========================================
            // CREATE BUG
            // ========================================

            if (!isEditMode) {

                const newBug = {

                    title:
                        formData.title.trim(),

                    description:
                        formData.description.trim(),

                    taskId:
                        Number(formData.taskId),

                    projectId:
                        Number(selectedTask.projectId),

                    priority:
                        formData.priority,

                    status:
                        "open",

                    createdBy:
                        Number(user.id),

                    createdAt:
                        new Date().toISOString()

                };


                const response =
                    await axios.post(
                        "http://localhost:3000/bugs",
                        newBug
                    );


                // --------------------------------
                // CREATE NOTIFICATION
                // --------------------------------

                const usersResponse =
                    await axios.get(
                        "http://localhost:3000/users"
                    );


                const developer =
                    usersResponse.data.find(
                        (currentUser) =>
                            currentUser.role ===
                                "developer" &&
                            Number(
                                currentUser.id
                            ) ===
                                Number(
                                    selectedTask.assignedTo
                                )
                    );


                if (developer) {

                    await axios.post(
                        "http://localhost:3000/notifications",
                        {

                            userId:
                                Number(
                                    developer.id
                                ),

                            type:
                                "bug-created",

                            title:
                                "New Bug Created",

                            message:
                                `${user.name} created a bug for "${selectedTask.title}".`,

                            bugId:
                                Number(
                                    response.data.id
                                ),

                            taskId:
                                Number(
                                    selectedTask.id
                                ),

                            read: false,

                            createdAt:
                                new Date().toISOString()

                        }
                    );

                }


                navigate("/bugs");

                return;

            }


            // ========================================
            // UPDATE BUG
            // ========================================

            const updatedBug = {

                title:
                    formData.title.trim(),

                description:
                    formData.description.trim(),

                taskId:
                    Number(formData.taskId),

                projectId:
                    Number(selectedTask.projectId),

                priority:
                    formData.priority,

                status:
                    formData.status

            };


            await axios.patch(
                `http://localhost:3000/bugs/${bugId}`,
                updatedBug
            );


            setSuccess(
                "Bug updated successfully."
            );


            setTimeout(() => {

                navigate("/bugs");

            }, 700);


        } catch (error) {

            console.error(error);

            setError(
                "Unable to save bug."
            );

        } finally {

            setSaving(false);

        }

    };


    // ========================================
    // LOADING
    // ========================================

    if (loading) {

        return (

            <div className="bug-form-loading">

                Loading...

            </div>

        );

    }


    return (

        <div className="bug-form-layout">

            <Sidebar />

            <div className="bug-form-main">

                <Navbar />

                <main className="bug-form-content">


                    {/* HEADER */}

                    <div className="bug-form-header">

                        <div>

                            <button
                                className="bug-back-button"
                                onClick={() =>
                                    navigate("/bugs")
                                }
                            >
                                ← Bugs
                            </button>

                            <h2>
                                {isEditMode
                                    ? "Edit Bug"
                                    : "Create Bug"}
                            </h2>

                            <p>
                                {isEditMode
                                    ? "Update bug information."
                                    : "Create a bug for a completed task."}
                            </p>

                        </div>

                    </div>


                    {/* FORM */}

                    <form
                        className="bug-form"
                        onSubmit={handleSubmit}
                    >


                        {/* ERROR */}

                        {error && (

                            <div className="bug-form-error">
                                {error}
                            </div>

                        )}


                        {/* SUCCESS */}

                        {success && (

                            <div className="bug-form-success">
                                {success}
                            </div>

                        )}


                        {/* TITLE */}

                        <div className="bug-form-group">

                            <label>
                                Bug Title
                            </label>

                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter bug title"
                            />

                        </div>


                        {/* DESCRIPTION */}

                        <div className="bug-form-group">

                            <label>
                                Description
                            </label>

                            <textarea
                                name="description"
                                value={
                                    formData.description
                                }
                                onChange={handleChange}
                                placeholder="Describe the bug"
                                rows="5"
                            />

                        </div>


                        {/* TASK */}

                        <div className="bug-form-group">

                            <label>
                                Completed Task
                            </label>

                            <select
                                name="taskId"
                                value={
                                    formData.taskId
                                }
                                onChange={handleChange}
                            >

                                <option value="">
                                    Select completed task
                                </option>

                                {tasks.map(
                                    (task) => (

                                        <option
                                            key={task.id}
                                            value={task.id}
                                        >
                                            {task.title}
                                        </option>

                                    )
                                )}

                            </select>

                            {tasks.length === 0 && (

                                <small>
                                    No completed tasks
                                    are available.
                                </small>

                            )}

                        </div>


                        {/* PRIORITY */}

                        <div className="bug-form-group">

                            <label>
                                Priority
                            </label>

                            <select
                                name="priority"
                                value={
                                    formData.priority
                                }
                                onChange={handleChange}
                            >

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


                        {/* STATUS */}

                        {isEditMode && (

                            <div className="bug-form-group">

                                <label>
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={
                                        formData.status
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    <option value="open">
                                        Open
                                    </option>

                                    <option value="in-progress">
                                        In Progress
                                    </option>

                                    <option value="resolved">
                                        Resolved
                                    </option>

                                </select>

                            </div>

                        )}


                        {/* BUTTONS */}

                        <div className="bug-form-actions">

                            <button
                                type="button"
                                className="bug-cancel-button"
                                onClick={() =>
                                    navigate("/bugs")
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="bug-submit-button"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : isEditMode
                                        ? "Update Bug"
                                        : "Create Bug"}
                            </button>

                        </div>

                    </form>

                </main>

            </div>

        </div>

    );

}

export default BugForm;