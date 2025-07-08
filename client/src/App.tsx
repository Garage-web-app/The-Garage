import { useState } from "react";
import { type JSX } from "react";
import "./App.css";

function App(): JSX.Element {
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

export default App;
