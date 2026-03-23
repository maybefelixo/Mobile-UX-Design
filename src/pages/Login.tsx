import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-80 rounded-xl bg-white p-6 text-center shadow">
        <h2 className="mb-4 text-xl font-bold">Login</h2>

        <input
          type="text"
          placeholder="Name"
          className="mb-3 w-full rounded border p-2"
        />

        <input
          type="password"
          placeholder="Passwort"
          className="mb-4 w-full rounded border p-2"
        />

        <button className="w-full rounded bg-blue-600 p-2 text-white">
          Login
        </button>

        <p className="mt-4 text-sm">
          Kein Account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}