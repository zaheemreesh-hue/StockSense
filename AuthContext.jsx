import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem("ss_token");
    const cached = localStorage.getItem("ss_user");
    if (token && cached) {
      setUser(JSON.parse(cached));
      // Verify token is still valid
      authService.getMe()
        .then(({ data }) => { setUser(data.user); localStorage.setItem("ss_user", JSON.stringify(data.user)); })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Listen for forced logout (401 from api interceptor)
    const handle = () => logout();
    window.addEventListener("ss:logout", handle);
    return () => window.removeEventListener("ss:logout", handle);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login({ email, password });
    localStorage.setItem("ss_token", data.token);
    localStorage.setItem("ss_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await authService.register(payload);
    localStorage.setItem("ss_token", data.token);
    localStorage.setItem("ss_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ss_token");
    localStorage.removeItem("ss_user");
    setUser(null);
  }, []);

  const updateUser = useCallback(async (payload) => {
    const { data } = await authService.updateProfile(payload);
    localStorage.setItem("ss_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
