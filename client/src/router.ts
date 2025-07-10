import { createBrowserRouter } from "react-router-dom";
import Home from "./views/home";
import AboutUs from "./views/about";
import Layout from "./components/layout";

const router = createBrowserRouter([
    {
        path: "/",
        Component: Layout,
        children: [
            {
                index: true,
                Component: Home,
            },
            {
                path: "about",
                Component: AboutUs,
            },
        ],
    },
]);

export default router;
