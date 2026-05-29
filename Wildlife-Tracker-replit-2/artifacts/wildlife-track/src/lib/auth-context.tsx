import React from "react";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
}

export const AuthContext = React.createContext<AuthContextType>({
  token: null,
  setToken: () => {},
  isAuthenticated: false,
});

export const useAuth = () => React.useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = React.useState<string | null>(() => localStorage.getItem("wt_token"));

  const setToken = React.useCallback((newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("wt_token", newToken);
    } else {
      localStorage.removeItem("wt_token");
    }
    setTokenState(newToken);
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
