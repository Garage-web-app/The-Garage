import { Link } from "react-router-dom";

/**
 * A navigation bar component for the app.
 *
 * The navbar is a column of links with a blue background. It is
 * positioned at the top of the page and has a border on the left
 * side of each link.
 *
 * The links, thus far, are:
 * - Home
 * - About
 *
 * The links are rendered using the Link component from
 * react-router-dom.
 *
 * The navbar is yet not responsive and a hamburger menu would be
 * nice to add for smaller screens.
 */
function Navbar() {
    return (
        <div className="flex-col bg-[#0C3A64]">
            <nav className="flex justify-end text-white ">
                <Link className="p-4 border-l-1 border-white" to="/about">
                    About
                </Link>
                <Link className="p-4 border-l-1 border-white" to="/">
                    Home
                </Link>
            </nav>
        </div>
    );
}

export default Navbar;
