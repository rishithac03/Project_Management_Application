import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

import "../../styles/project.css";

function Project() {

    const { workspaceId } = useParams();

    const navigate = useNavigate();

    const user = useSelector(
        (state) => state.auth.user
    );

    const isAdmin = user?.role === "admin";


    const [workspace, setWorkspace] = useState(null);

    const [projects, setProjects] = useState([]);

    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);

    const [editingProject, setEditingProject] =
        useState(null);

    const [formData, setFormData] = useState({
        name: "",
        description: ""
    });

    const [error, setError] = useState("");


    // --------------------------------
    // LOAD WORKSPACE + PROJECTS
    // --------------------------------

    const loadData = async () => {

        try {

            setLoading(true);

            const [
                workspaceResponse,
                projectsResponse
            ] = await Promise.all([

                axios.get(
                    `http://localhost:3000/workspaces/${workspaceId}`
                ),

                axios.get(
                    `http://localhost:3000/projects?workspaceId=${workspaceId}`
                )

            ]);

            setWorkspace(
                workspaceResponse.data
            );

            setProjects(
                projectsResponse.data
            );

        } catch (error) {

            console.error(error);

            setError(
                "Unable to load projects."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        loadData();

    }, [workspaceId]);


    // --------------------------------
    // INPUT CHANGE
    // --------------------------------

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value
        });

    };


    // --------------------------------
    // ADD PROJECT
    // --------------------------------

    const handleAdd = () => {

        setEditingProject(null);

        setFormData({
            name: "",
            description: ""
        });

        setError("");

        setShowForm(true);

    };


    // --------------------------------
    // EDIT PROJECT
    // --------------------------------

    const handleEdit = (project) => {

        setEditingProject(project);

        setFormData({
            name: project.name,
            description: project.description
        });

        setError("");

        setShowForm(true);

    };


    // --------------------------------
    // CREATE / UPDATE
    // --------------------------------

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!formData.name.trim()) {

            setError(
                "Project name is required."
            );

            return;

        }


        try {

            if (editingProject) {

                const response = await axios.patch(

                    `http://localhost:3000/projects/${editingProject.id}`,

                    {
                        name: formData.name,
                        description: formData.description
                    }

                );

                setProjects(
                    projects.map((project) =>
                        project.id === editingProject.id
                            ? response.data
                            : project
                    )
                );

            } else {

                const response = await axios.post(

                    "http://localhost:3000/projects",

                    {
                        workspaceId: Number(workspaceId),
                        name: formData.name,
                        description: formData.description,
                        createdBy: user.id
                    }

                );

                setProjects([
                    ...projects,
                    response.data
                ]);

            }


            setFormData({
                name: "",
                description: ""
            });

            setEditingProject(null);

            setShowForm(false);

            setError("");

        } catch (error) {

            console.error(error);

            setError(
                "Unable to save project."
            );

        }

    };


    // --------------------------------
    // DELETE
    // --------------------------------

    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this project?"
        );

        if (!confirmDelete) {
            return;
        }


        try {

            await axios.delete(
                `http://localhost:3000/projects/${id}`
            );

            setProjects(
                projects.filter(
                    (project) =>
                        project.id !== id
                )
            );

        } catch (error) {

            console.error(error);

            setError(
                "Unable to delete project."
            );

        }

    };


    // --------------------------------
    // LOADING
    // --------------------------------

    if (loading) {

        return (
            <div className="project-loading">
                Loading Projects...
            </div>
        );

    }


    return (

        <div className="project-layout">

            <Sidebar />

            <div className="project-main">

                <Navbar />

                <main className="project-content">


                    {/* HEADER */}

                    <div className="project-header">

                        <div>

                            <button
                                className="back-button"
                                onClick={() =>
                                    navigate("/workspaces")
                                }
                            >
                                ← Workspaces
                            </button>

                            <h2>
                                {workspace?.name}
                            </h2>

                            <p>
                                {workspace?.description}
                            </p>

                        </div>


                        {isAdmin && (

                            <button
                                className="add-project-btn"
                                onClick={handleAdd}
                            >
                                + Add Project
                            </button>

                        )}

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="project-error">
                            {error}
                        </div>

                    )}


                    {/* FORM */}

                    {showForm && isAdmin && (

                        <div className="project-form-container">

                            <div className="project-form-header">

                                <h3>
                                    {editingProject
                                        ? "Edit Project"
                                        : "Create Project"
                                    }
                                </h3>

                                <button
                                    onClick={() =>
                                        setShowForm(false)
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            <form
                                className="project-form"
                                onSubmit={handleSubmit}
                            >

                                <div className="form-group">

                                    <label>
                                        Project Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter project name"
                                    />

                                </div>


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
                                        placeholder="Enter project description"
                                        rows="4"
                                    />

                                </div>


                                <div className="project-form-actions">

                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={() =>
                                            setShowForm(false)
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="save-btn"
                                    >
                                        {editingProject
                                            ? "Update Project"
                                            : "Create Project"
                                        }
                                    </button>

                                </div>

                            </form>

                        </div>

                    )}


                    {/* PROJECTS */}

                    {projects.length === 0 ? (

                        <div className="project-empty">

                            <h3>
                                No Projects
                            </h3>

                            <p>
                                No projects have been
                                created in this workspace.
                            </p>

                        </div>

                    ) : (

                        <div className="project-grid">

                            {projects.map(
                                (project) => (

                                    <div
                                        className="project-card"
                                        key={project.id}
                                    >

                                        <div
                                            className="project-card-content"
                                            onClick={() =>
                                                navigate(
                                                    `/projects/${project.id}/boards`
                                                )
                                            }
                                        >

                                            <h3>
                                                {project.name}
                                            </h3>

                                            <p>
                                                {project.description}
                                            </p>

                                        </div>


                                        {isAdmin && (

                                            <div className="project-actions">

                                                <button
                                                    onClick={() =>
                                                        handleEdit(
                                                            project
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            project.id
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        )}

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </main>

            </div>

        </div>

    );
}

export default Project;