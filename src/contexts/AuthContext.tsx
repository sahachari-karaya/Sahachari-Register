import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase';

// Admin roles
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin'
} as const;

// List of admin emails with their roles
const ADMIN_USERS = [
  { email: 'sahacharicenterkaraya@gmail.com', role: ADMIN_ROLES.SUPER_ADMIN }, // Super Admin
  { email: 'mkshabeen@gmail.com', role: ADMIN_ROLES.ADMIN },                   // Regular Admin
  { email: 'test@gmail.com', role: ADMIN_ROLES.ADMIN },                        // Regular Admin
  // Add more admin emails here with their roles
  // { email: 'admin@example.com', role: ADMIN_ROLES.ADMIN },
];

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminRole: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user?.email) {
        const adminUser = ADMIN_USERS.find(admin => admin.email === user.email);
        if (adminUser) {
          setIsAdmin(true);
          setIsSuperAdmin(adminUser.role === ADMIN_ROLES.SUPER_ADMIN);
          setAdminRole(adminUser.role);
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setAdminRole(null);
        }
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setAdminRole(null);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    isAdmin,
    isSuperAdmin,
    adminRole,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
