import { createBrowserRouter, Outlet } from "react-router-dom";
import Home from "../renderer/pages/Home";
import Settings from "../renderer/pages/Settings";
import ServerDetail from "../renderer/pages/ServerDetail";
import TerminalWindow from "../renderer/pages/TerminalWindow";
import Titlebar from "../renderer/components/layouts/Titlebar";
import { SecurityProvider } from "../renderer/components/SecurityProvider";

const AppWrapper = () => (
    <SecurityProvider>
        <Outlet />
    </SecurityProvider>
);

const Layout = () => {
    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
            <Titlebar />
            <div className="flex-1 mt-10 overflow-y-auto min-h-0" style={{ background: 'var(--bg-base)' }}>
                <Outlet />
            </div>
        </div>
    );
};

const router = createBrowserRouter([
    {
        element: <AppWrapper />,
        children: [
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
            },
            {
                path: "/terminal/:id",
                element: <TerminalWindow />,
            },
        ]
    }
]);

export default router;
