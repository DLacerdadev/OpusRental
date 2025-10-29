import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  clearToken: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
  };

  const clearToken = () => {
    setTokenState(null);
  };

  return (
    <AuthContext.Provider value={{ token, setToken, clearToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthToken() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthToken must be used within an AuthProvider');
  }
  return context;
}
