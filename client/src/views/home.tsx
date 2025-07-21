import { useState } from 'react';
import type { JSX } from 'react';

/**
 * The home page component.
 *
 * This component, for now, displays a counter that can be incremented with a button.
 * The real home page will be implemented in the future.
 *
 * @returns The JSX element representing the home page.
 */
export default function Home(): JSX.Element {
    const [count, setCount] = useState(0);

    return (
        <>
            <div>
                <p className="text-3xl text-red-600">Count: {count}</p>
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => setCount(count + 1)}
                >
                    Increment
                </button>
            </div>
        </>
    );
}
