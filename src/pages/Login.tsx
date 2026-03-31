import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { loginUser, deregisterUser } from "../services/authApi";

export default function Login() {
  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!userid.trim() || !password.trim()) {
      setError("Bitte UserID und Passwort ausfuellen.");
      return;
    }

    setLoading(true);

    const result = await loginUser({
      userid: userid.trim(),
      password: password.trim(),
    });

    setLoading(false);

    if (!result.ok || !result.data) {
      setError(result.error || "Login fehlgeschlagen.");
      return;
    }

    localStorage.setItem("token", result.data);
    localStorage.setItem("userid", userid.trim());
    setSuccess("Login erfolgreich. Token wurde gespeichert.");
  }

  async function handleDeregister() {
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Kein Token gefunden. Bitte zuerst einloggen.");
      return;
    }

    setLoading(true);
    const result = await deregisterUser(token);
    setLoading(false);

    if (!result.ok) {
      setError(result.error || "Deregistrieren fehlgeschlagen.");
      return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("userid");
    setSuccess("Account wurde deregistriert und Token entfernt.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-80 rounded-xl bg-white p-6 text-center shadow">
        <h2 className="mb-4 text-xl font-bold">Login</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="UserID"
            value={userid}
            onChange={(e) => setUserid(e.target.value)}
            className="mb-3 w-full rounded border p-2"
          />

          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-3 w-full rounded border p-2"
          />

          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
          {success ? <p className="mb-3 text-sm text-green-600">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 p-2 text-white disabled:opacity-60"
          >
            {loading ? "Lade..." : "Login"}
          </button>

          <button
            type="button"
            onClick={handleDeregister}
            disabled={loading}
            className="mt-3 w-full rounded border border-red-500 p-2 text-red-600 disabled:opacity-60"
          >
            Account deregistrieren
          </button>
        </form>

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