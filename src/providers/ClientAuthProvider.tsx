import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { trpc } from "@/providers/trpc";
import { useClientTheme } from "@/hooks/useClientTheme";

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
  logout: () => void;
  refetch: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
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

  // Apply client's primary color to the dashboard theme
  useClientTheme();

  return (
    <ClientAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
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
