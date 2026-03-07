import { createBrowserRouter, Outlet } from "react-router-dom";
import Home from "../renderer/pages/Home";
import Settings from "../renderer/pages/Settings";
import ServerDetail from "../renderer/pages/ServerDetail";
import Titlebar from "../renderer/components/layouts/Titlebar";

const Layout = () => {
    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-900 text-white">
            <Titlebar />
            <div className="flex-1 mt-10 overflow-y-auto bg-gray-950">
                <Outlet />
            </div>
        </div>
    );
};

const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            {
                path: "/",
                element: <Home />,
            },
            {
                path: "/settings",
                element: <Settings />,
            },
            {
                path: "/server/:id",
                element: <ServerDetail />,
            },
        ]
    }
]);

export default router;
