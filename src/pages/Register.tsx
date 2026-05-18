import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authApi";

export default function Register() {
  const navigate = useNavigate();
  const [userid, setUserid] = useState("");
  const [nickname, setNickname] = useState("");
  const [fullname, setFullname] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!userid.trim() || !nickname.trim() || !fullname.trim() || !password.trim()) {
      setError("Bitte alle Felder ausfüllen.");
      return;
    }

    setLoading(true);

    const result = await registerUser({
      userid: userid.trim(),
      password: password.trim(),
      nickname: nickname.trim(),
      fullname: fullname.trim(),
    });

    setLoading(false);

    if (!result.ok || !result.data) {
      setError(result.error || "Registrierung fehlgeschlagen.");
      return;
    }

    localStorage.setItem("token", result.data);
    localStorage.setItem("userid", userid.trim());
    setSuccess("Registrierung erfolgreich. Weiterleitung ...");
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
          <h2 className="text-2xl font-semibold text-gray-800">Registrieren</h2>
          <p className="mt-1 text-sm text-gray-500">Erstelle einen neuen Account.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="mb-1 block text-sm font-medium text-gray-700">UserID</label>
          <div className="mb-3 flex items-center rounded-md border border-gray-200 bg-white p-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200">
            <input
              type="text"
              value={userid}
              onChange={(e) => setUserid(e.target.value)}
              className="w-full border-0 bg-transparent p-1 text-sm outline-none"
            />
          </div>

          <label className="mb-1 block text-sm font-medium text-gray-700">Nickname</label>
          <div className="mb-3 flex items-center rounded-md border border-gray-200 bg-white p-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full border-0 bg-transparent p-1 text-sm outline-none"
            />
          </div>

          <label className="mb-1 block text-sm font-medium text-gray-700">Vollständiger Name</label>
          <div className="mb-3 flex items-center rounded-md border border-gray-200 bg-white p-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200">
            <input
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              className="w-full border-0 bg-transparent p-1 text-sm outline-none"
            />
          </div>

          <label className="mb-1 block text-sm font-medium text-gray-700">Passwort</label>
          <div className="mb-3 flex items-center rounded-md border border-gray-200 bg-white p-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200">
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
            className="w-full rounded-md bg-gradient-to-r from-indigo-600 to-blue-500 p-3 text-sm font-medium text-white shadow hover:brightness-105 disabled:opacity-60"
          >
            {loading ? "Lade..." : "Registrieren"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Schon einen Account?{" "}
          <Link to="/" className="font-medium text-indigo-600 hover:underline">
            Zum Login
          </Link>
        </p>
      </div>
    </div>
  );
}