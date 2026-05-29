import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { trpc } from "@/providers/trpc";

interface ClientUser {
  id: number;
  name: string;
  email: string;
  role: string;
  clientId: number;
}

interface ClientAuthContextType {
  user: ClientUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  logout: () => void;
  refetch: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
  isSuperAdmin: false,
  refetch: () => {},
});

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null);

  const utils = trpc.useUtils();
  const { data, isLoading, refetch } = trpc.clientAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.clientAuth.logout.useMutation({
    onSuccess: () => {
      setUser(null);
      utils.invalidate();
      window.location.href = "/login";
    },
  });

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  useEffect(() => {
    if (data) {
      setUser(data);
    } else if (!isLoading) {
      setUser(null);
    }
  }, [data, isLoading]);

  return (
    <ClientAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        isSuperAdmin: user?.role === "super_admin",
        refetch,
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  return useContext(ClientAuthContext);
}
