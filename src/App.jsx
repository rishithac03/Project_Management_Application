import { useEffect } from "react";
import { useDispatch } from "react-redux";

import AppRoutes from "./routes/AppRoutes";
import { login } from "./redux/slices/authSlice";

function App() {
    const dispatch = useDispatch();
    useEffect(() => { const savedUser = localStorage.getItem("user");
        if (savedUser) {
            const user = JSON.parse(savedUser);
            dispatch(login(user));
        }
    }, [dispatch]);
    return <AppRoutes />;
}
export default App;