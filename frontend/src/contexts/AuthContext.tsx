import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithSso: () => Promise<boolean>;
  loginWithSsoToken: (ssoToken: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSsoAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'https://api.secure.cognition.com.ar';
const SUITE_URL = import.meta.env.VITE_SUITE_URL || 'https://suite.cognition.com.ar';

// SSO Helper functions
const ssoHelper = {
  getSuiteToken: () => localStorage.getItem('cognition_token'),
  isLoggedInSuite: () => !!localStorage.getItem('cognition_token'),
  redirectToSuiteLogin: () => {
    const returnUrl = encodeURIComponent(window.location.origin + '/login');
    window.location.href = `${SUITE_URL}?sso_return=${returnUrl}`;
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSsoAvailable, setIsSsoAvailable] = useState(false);

  // Validate user object has required fields
  const isValidUser = (u: unknown): u is User => {
    if (!u || typeof u !== 'object') return false;
    const obj = u as Record<string, unknown>;
    return typeof obj.id === 'string' && 
           typeof obj.email === 'string' && 
           obj.id.length > 0 && 
           obj.email.length > 0;
  };

  // Clear invalid session and redirect to login
  const clearInvalidSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Only redirect if not already on login page
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (isValidUser(parsedUser)) {
          setUser(parsedUser);
        } else {
          console.warn('Invalid user data in localStorage, clearing session');
          clearInvalidSession();
        }
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        clearInvalidSession();
      }
    }
    
    // Check if Suite SSO is available
    setIsSsoAvailable(ssoHelper.isLoggedInSuite());
    setIsLoading(false);
  }, []);

  // Helper to extract user from API response (handles both {user: ...} and flat response)
  const extractUserFromResponse = (data: Record<string, unknown>): User => {
    // If response has a user object, use it
    if (data.user && typeof data.user === 'object') {
      return data.user as User;
    }
    // Otherwise, build user from flat response fields
    return {
      id: (data.id as string) || (data.email as string) || '',
      email: (data.email as string) || '',
      fullName: data.firstName && data.lastName 
        ? `${data.firstName} ${data.lastName}` 
        : (data.fullName as string) || (data.username as string) || '',
      role: (data.role as string) || 'user',
    };
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Credenciales inválidas');
    }

    const data = await response.json();
    const user = extractUserFromResponse(data);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const loginWithSso = async (): Promise<boolean> => {
    const suiteToken = ssoHelper.getSuiteToken();
    
    if (!suiteToken) {
      ssoHelper.redirectToSuiteLogin();
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/sso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suiteToken }),
      });

      if (!response.ok) {
        ssoHelper.redirectToSuiteLogin();
        return false;
      }

      const data = await response.json();
      const user = extractUserFromResponse(data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return true;
    } catch {
      ssoHelper.redirectToSuiteLogin();
      return false;
    }
  };

  // Login with SSO token received from URL (cross-domain flow)
  const loginWithSsoToken = async (ssoToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/sso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suiteToken: ssoToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const user = extractUserFromResponse(data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return true;
    } catch (error) {
      console.error('SSO token login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginWithSso,
      loginWithSsoToken,
      logout,
      isAuthenticated: !!user,
      isLoading,
      isSsoAvailable,
    }}>
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
