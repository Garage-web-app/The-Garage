import { type JSX } from 'react';
import './App.css';
import { RouterProvider } from 'react-router-dom';
import router from './router';

/**
 * The main application component.
 *
 * This component is a wrapper around the RouterProvider component
 * from react-router-dom.  It is the top-level component in the
 * application.
 *
 * @returns The JSX element for the application.
 */
function App(): JSX.Element {
    return <RouterProvider router={router} />;
}

export default App;
