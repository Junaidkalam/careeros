import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthState {
  token: string | null;
  email: string | null;
  name: string | null;
}

interface AuthContextType extends AuthState {
  login: (data: AuthState) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    email: null,
    name: null,
  });

  const login = (data: AuthState) => {
    (window as any).__token = data.token;
    setAuthState(data);
  };

  const logout = () => {
    (window as any).__token = null;
    setAuthState({ token: null, email: null, name: null });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        isAuthenticated: !!authState.token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}