import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs = [
    {
      path: "/profile",
      label: "Profil",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
    },
    {
      path: "/chat",
      label: "Chats",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      ),
    },
    {
      path: "/settings",
      label: "Einstellungen",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l1.72-1.34c.15-.12.19-.34.1-.51l-1.63-2.83c-.12-.22-.37-.29-.59-.22l-2.03.81c-.42-.32-.9-.6-1.44-.81l-.31-2.15c-.05-.24-.24-.41-.48-.41h-3.26c-.24 0-.43.17-.49.41l-.31 2.15c-.54.21-1.02.49-1.44.81l-2.03-.81c-.22-.09-.47 0-.59.22l-1.63 2.83c-.1.17-.06.39.1.51l1.72 1.34c-.05.3-.07.62-.07.94s.02.64.07.94l-1.72 1.34c-.15.12-.19.34-.1.51l1.63 2.83c.12.22.37.29.59.22l2.03-.81c.42.32.9.6 1.44.81l.31 2.15c.05.24.24.41.48.41h3.26c.24 0 .43-.17.49-.41l.31-2.15c.54-.21 1.02-.49 1.44-.81l2.03.81c.22.09.47 0 .59-.22l1.63-2.83c.1-.17.06-.39-.1-.51l-1.72-1.34zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="border-t border-slate-200 bg-white">
      <div className="flex items-center justify-around py-2">
        {tabs.map(({ path, label, icon }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={[
                "flex flex-col items-center gap-1 px-6 py-2 transition-colors",
                active ? "text-blue-600" : "text-slate-400 hover:text-slate-600",
              ].join(" ")}
            >
              {icon}
              <span className={["text-xs font-medium", active ? "text-blue-600" : ""].join(" ")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}