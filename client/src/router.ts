import { createBrowserRouter } from "react-router-dom";
import Home from "./views/home";
import AboutUs from "./views/about";
import Layout from "./components/layout";

/**
 * The router is a collection of routes, each route has a path and a component
 * note that all future routes will be added here and shall be a child of the root route
 * which is the Layout component
 */
const router = createBrowserRouter([
    {
        path: "/",
        Component: Layout,
        children: [
            {
                index: true, // this is the default route
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
