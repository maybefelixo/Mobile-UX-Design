import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authApi";

export default function Login() {
  const navigate = useNavigate();
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

    if (!result.ok || !result.data?.token) {
      setError(result.error || "Login fehlgeschlagen.");
      return;
    }

    localStorage.setItem("token", result.data.token);
    localStorage.setItem("hash", result.data.hash);
    localStorage.setItem("userid", userid.trim());
    setSuccess("Login erfolgreich. Weiterleitung ...");
    setTimeout(() => navigate("/chat"), 200);
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-left shadow-lg transform transition-all duration-300 hover:scale-[1.01]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="#4c51bf"/>
              <path d="M4 20.5c0-3.5 4-6.5 8-6.5s8 3 8 6.5v.5H4v-.5z" fill="#667eea"/>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Login</h2>
          <p className="mt-1 text-sm text-gray-500">Please login.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="mb-1 block text-sm font-medium text-gray-700">UserID</label>
          <div className="mb-3 flex items-center rounded-md border border-gray-200 bg-white p-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200">
            <svg className="mr-2 h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="currentColor"/><path d="M4 20.5c0-3.5 4-6.5 8-6.5s8 3 8 6.5v.5H4v-.5z" fill="currentColor"/></svg>
            <input
              type="text"
              value={userid}
              onChange={(e) => setUserid(e.target.value)}
              className="w-full border-0 bg-transparent p-1 text-sm outline-none"
            />
          </div>

          <label className="mb-1 block text-sm font-medium text-gray-700">Passwort</label>
          <div className="mb-3 flex items-center rounded-md border border-gray-200 bg-white p-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200">
            <svg className="mr-2 h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 8V7a5 5 0 00-10 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-0 bg-transparent p-1 text-sm outline-none"
            />
          </div>

          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
          {success ? <p className="mb-3 text-sm text-green-600">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mb-2 w-full rounded-md bg-gradient-to-r from-indigo-600 to-blue-500 p-3 text-sm font-medium text-white shadow hover:brightness-105 disabled:opacity-60"
          >
            {loading ? "Lade..." : "Login"}
          </button>


        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Kein Account?{" "}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}