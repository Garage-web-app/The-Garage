import type { JSX } from "react";

/**
 * Returns a JSX element containing the text "About Us" with a red color and large font size.
 * Note that this is a dummy about page. The really about page will be implemented in the future.
 */
function AboutUs(): JSX.Element {
    return <div className="text-3xl text-red-600">About Us</div>;
}

export default AboutUs;
