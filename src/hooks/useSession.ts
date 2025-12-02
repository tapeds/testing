import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface Session {
  email: string;
  role: 'admin' | 'user';
}

async function fetchSession(): Promise<Session | null> {
  try {
    const response = await axios.get<Session>('/api/auth/session');
    return response.data;
  } catch (error) {
    // If 401 or 403, user is not authenticated
    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      return null;
    }
    throw error;
  }
}

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
