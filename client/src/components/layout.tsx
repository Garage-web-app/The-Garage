import { Outlet } from 'react-router-dom';
import Navbar from './navbar';

/**
 * The root layout component, responsible for rendering the main app layout.
 * Consists of a {@link Navbar} component and a main content area where the
 * current route will be rendered.
 *
 * @returns The JSX element representing the layout.
 */
export default function Layout() {
    return (
        <>
            <Navbar />
            <main className="p-4 h-screen bg-[#EDEEF6]">
                <Outlet />
            </main>
        </>
    );
}
