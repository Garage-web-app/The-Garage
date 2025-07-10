import { Link } from "react-router-dom";

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
