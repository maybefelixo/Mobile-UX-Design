import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-80 rounded-xl bg-white p-6 text-center shadow">
        <h2 className="mb-4 text-xl font-bold">Registrieren</h2>

        <input
          type="text"
          placeholder="Vorname"
          className="mb-3 w-full rounded border p-2"
        />

        <input
          type="text"
          placeholder="Nachname"
          className="mb-3 w-full rounded border p-2"
        />

        <input
          type="password"
          placeholder="Passwort"
          className="mb-4 w-full rounded border p-2"
        />

        <button className="w-full rounded bg-blue-600 p-2 text-white">
          Registrieren
        </button>

        <p className="mt-4 text-sm">
          Schon einen Account?{" "}
          <Link to="/" className="text-blue-600 hover:underline">
            Zum Login
          </Link>
        </p>
      </div>
    </div>
  );
}