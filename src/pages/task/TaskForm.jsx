import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

import "../../styles/taskform.css";

function TaskForm() {

    const { projectId, taskId } = useParams();

    const navigate = useNavigate();

    const user = useSelector(
        (state) => state.auth.user
    );

    const isAdmin = user?.role === "admin";

    const isEdit = Boolean(taskId);


    const [project, setProject] = useState(null);

    const [developers, setDevelopers] = useState([]);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        assignedTo: "",
        status: "todo",
        priority: "medium",
        label: "Frontend",
        deadline: ""
    });

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");


    // --------------------------------
    // LOAD DATA
    // --------------------------------

    const loadData = async () => {

        try {

            setLoading(true);

            const requests = [

                axios.get(
                    `http://localhost:3000/projects/${projectId}`
                ),

                axios.get(
                    "http://localhost:3000/users?role=developer"
                )

            ];


            if (isEdit) {

                requests.push(
                    axios.get(
                        `http://localhost:3000/tasks/${taskId}`
                    )
                );

            }


            const responses =
                await Promise.all(requests);


            setProject(
                responses[0].data
            );

            setDevelopers(
                responses[1].data
            );


            if (isEdit) {

                const task =
                    responses[2].data;

                setFormData({
                    title: task.title,
                    description: task.description,
                    assignedTo: String(
                        task.assignedTo
                    ),
                    status: task.status,
                    priority: task.priority,
                    label: task.label,
                    deadline: task.deadline
                });

            }

        } catch (error) {

            console.error(error);

            setError(
                "Unable to load task information."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        if (!isAdmin) {

            navigate(
                `/projects/${projectId}/boards`
            );

            return;

        }

        loadData();

    }, [projectId, taskId, isAdmin]);


    // --------------------------------
    // INPUT CHANGE
    // --------------------------------

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });

    };


    // --------------------------------
    // SUBMIT
    // --------------------------------
    const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");


    // --------------------------------
    // VALIDATION
    // --------------------------------

    if (!formData.title.trim()) {

        setError("Task title is required.");

        return;
    }


    if (!formData.assignedTo) {

        setError(
            "Please assign the task to a developer."
        );

        return;
    }


    if (!formData.deadline) {

        setError(
            "Please select a deadline."
        );

        return;
    }


    try {

        setSaving(true);


        // --------------------------------
        // TASK DATA
        // --------------------------------

        const taskData = {

            projectId: Number(projectId),

            title: formData.title.trim(),

            description:
                formData.description.trim(),

            assignedTo:
                Number(formData.assignedTo),

            status: formData.status,

            priority: formData.priority,

            label: formData.label,

            deadline: formData.deadline

        };


        // --------------------------------
        // EDIT TASK
        // --------------------------------

        if (isEdit) {

            // First get the existing task

            const oldResponse = await axios.get(
                `http://localhost:3000/tasks/${taskId}`
            );

            const oldTask = oldResponse.data;


            // Update task

            const response = await axios.patch(
                `http://localhost:3000/tasks/${taskId}`,
                taskData
            );

            const updatedTask = response.data;


            // --------------------------------
            // CHECK DEVELOPER CHANGE
            // --------------------------------

            const developerChanged =
                Number(oldTask.assignedTo) !==
                Number(updatedTask.assignedTo);


            // --------------------------------
            // CREATE NOTIFICATION
            // --------------------------------

            if (
                developerChanged &&
                updatedTask.assignedTo
            ) {

                await axios.post(
                    "http://localhost:3000/notifications",
                    {

                        userId:
                            Number(
                                updatedTask.assignedTo
                            ),

                        type:
                            "task-assigned",

                        title:
                            "New Task Assigned",

                        message:
                            `You have been assigned the task "${updatedTask.title}"`,

                        taskId:
                            updatedTask.id,

                        read:
                            false,

                        createdAt:
                            new Date().toISOString()

                    }
                );

            }

        }


        // --------------------------------
        // CREATE TASK
        // --------------------------------

        else {

            const response = await axios.post(
                "http://localhost:3000/tasks",
                taskData
            );

            const newTask = response.data;


            // --------------------------------
            // CREATE NOTIFICATION
            // --------------------------------

            if (newTask.assignedTo) {

                await axios.post(
                    "http://localhost:3000/notifications",
                    {

                        userId:
                            Number(
                                newTask.assignedTo
                            ),

                        type:
                            "task-assigned",

                        title:
                            "New Task Assigned",

                        message:
                            `You have been assigned the task "${newTask.title}"`,

                        taskId:
                            newTask.id,

                        read:
                            false,

                        createdAt:
                            new Date().toISOString()

                    }
                );

            }

        }


        // --------------------------------
        // GO BACK TO BOARD
        // --------------------------------

        navigate(
            `/projects/${projectId}/boards`
        );


    } catch (error) {

        console.error(error);

        setError(
            "Unable to save task."
        );

    } finally {

        setSaving(false);

    }

};

    // --------------------------------
    // LOADING
    // --------------------------------

    if (loading) {

        return (
            <div className="task-form-loading">
                Loading...
            </div>
        );

    }


    return (

        <div className="task-form-layout">

            <Sidebar />

            <div className="task-form-main">

                <Navbar />

                <main className="task-form-content">


                    {/* HEADER */}

                    <div className="task-form-header">

                        <button
                            className="back-button"
                            onClick={() =>
                                navigate(
                                    `/projects/${projectId}/boards`
                                )
                            }
                        >
                            ← Board
                        </button>

                        <h2>
                            {isEdit
                                ? "Edit Task"
                                : "Create Task"
                            }
                        </h2>

                        <p>
                            {project?.name}
                        </p>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="task-form-error">
                            {error}
                        </div>

                    )}


                    {/* FORM */}

                    <form
                        className="task-form"
                        onSubmit={handleSubmit}
                    >


                        {/* TITLE */}

                        <div className="form-group">

                            <label>
                                Task Title
                            </label>

                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter task title"
                            />

                        </div>


                        {/* DESCRIPTION */}

                        <div className="form-group">

                            <label>
                                Description
                            </label>

                            <textarea
                                name="description"
                                value={
                                    formData.description
                                }
                                onChange={handleChange}
                                placeholder="Enter task description"
                                rows="5"
                            />

                        </div>


                        {/* DEVELOPER */}

                        <div className="form-group">

                            <label>
                                Assign Developer
                            </label>

                            <select
                                name="assignedTo"
                                value={
                                    formData.assignedTo
                                }
                                onChange={handleChange}
                            >

                                <option value="">
                                    Select Developer
                                </option>

                                {developers.map(
                                    (developer) => (

                                        <option
                                            key={
                                                developer.id
                                            }
                                            value={
                                                developer.id
                                            }
                                        >
                                            {developer.name}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* TWO COLUMN */}

                        <div className="task-form-row">


                            {/* STATUS */}

                            <div className="form-group">

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

                            <div className="form-group">

                                <label>
                                    Priority
                                </label>

                                <select
                                    name="priority"
                                    value={
                                        formData.priority
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    <option value="low">
                                        Low
                                    </option>

                                    <option value="medium">
                                        Medium
                                    </option>

                                    <option value="high">
                                        High
                                    </option>

                                </select>

                            </div>

                        </div>


                        {/* TWO COLUMN */}

                        <div className="task-form-row">


                            {/* LABEL */}

                            <div className="form-group">

                                <label>
                                    Label
                                </label>

                                <select
                                    name="label"
                                    value={
                                        formData.label
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    <option value="Frontend">
                                        Frontend
                                    </option>

                                    <option value="Backend">
                                        Backend
                                    </option>

                                    <option value="Design">
                                        Design
                                    </option>

                                    <option value="Testing">
                                        Testing
                                    </option>

                                </select>

                            </div>


                            {/* DEADLINE */}

                            <div className="form-group">

                                <label>
                                    Deadline
                                </label>

                                <input
                                    type="date"
                                    name="deadline"
                                    value={
                                        formData.deadline
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>

                        </div>


                        {/* BUTTONS */}

                        <div className="task-form-actions">

                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() =>
                                    navigate(
                                        `/projects/${projectId}/boards`
                                    )
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="save-btn"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : isEdit
                                    ? "Update Task"
                                    : "Create Task"
                                }
                            </button>

                        </div>

                    </form>

                </main>

            </div>

        </div>

    );
}

export default TaskForm;