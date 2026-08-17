import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [message, setMessage] = useState("Connecting...");

  useEffect(() => {
    api.get("/")
      .then((res) => {
        setMessage(res.data.message);
      })
      .catch((err) => {
        console.error(err);
        setMessage("Backend connection failed");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900">
          Nyawit POS
        </h1>

        <p className="mt-3 text-gray-600">
          {message}
        </p>

        <div className="mt-5 inline-block rounded-lg bg-green-100 px-4 py-2 text-green-700">
          System Ready
        </div>
      </div>
    </div>
  );
}

export default App;
