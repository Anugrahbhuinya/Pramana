import * as React from "react";

interface GlobalState {
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

const GlobalStateContext = React.createContext<GlobalState | undefined>(undefined);

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSessionId, setActiveSessionIdState] = React.useState<string | null>(() => {
    return localStorage.getItem("activeSessionId");
  });

  const [sidebarCollapsed, setSidebarCollapsedState] = React.useState<boolean>(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  const [theme, setThemeState] = React.useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const setActiveSessionId = (id: string | null) => {
    setActiveSessionIdState(id);
    if (id) {
      localStorage.setItem("activeSessionId", id);
    } else {
      localStorage.removeItem("activeSessionId");
    }
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem("sidebarCollapsed", String(collapsed));
  };

  const setTheme = (t: "light" | "dark") => {
    setThemeState(t);
    localStorage.setItem("theme", t);
  };

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <GlobalStateContext.Provider
      value={{
        activeSessionId,
        setActiveSessionId,
        sidebarCollapsed,
        setSidebarCollapsed,
        theme,
        setTheme,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = React.useContext(GlobalStateContext);
  if (!context) {
    throw new Error("useGlobalState must be used within a GlobalStateProvider");
  }
  return context;
};
