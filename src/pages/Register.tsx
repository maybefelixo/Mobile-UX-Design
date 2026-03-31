import { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../services/authApi";

export default function Register() {
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
    setSuccess("Registrierung erfolgreich. Token wurde gespeichert.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-80 rounded-xl bg-white p-6 text-center shadow">
        <h2 className="mb-4 text-xl font-bold">Registrieren</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="UserID"
            value={userid}
            onChange={(e) => setUserid(e.target.value)}
            className="mb-3 w-full rounded border p-2"
          />

          <input
            type="text"
            placeholder="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="mb-3 w-full rounded border p-2"
          />

          <input
            type="text"
            placeholder="Vollständiger Name"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
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
            {loading ? "Lade..." : "Registrieren"}
          </button>
        </form>

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