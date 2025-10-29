import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  console.log('[Auth] Getting token:', token ? 'Token exists' : 'No token found');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('auth_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    const text = (await res.text()) || res.statusText;
    
    if (res.status === 403) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this resource.",
        variant: "destructive",
      });
    }
    
    // Try to parse JSON error response
    let errorData;
    try {
      errorData = JSON.parse(text);
    } catch {
      // If not JSON, use the text as is
      throw new Error(text || res.statusText);
    }
    
    // Create a custom error with message and errors properties
    const error = new Error(errorData.message || text) as Error & {
      message: string;
      errors?: Record<string, string>;
      status: number;
    };
    error.errors = errorData.errors;
    error.status = res.status;
    
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: HeadersInit = {
    ...getAuthHeaders(),
    ...(data ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      headers: getAuthHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
