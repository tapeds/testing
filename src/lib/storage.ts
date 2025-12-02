import axios from 'axios';
import type {
  User,
  Developer,
  Client,
  Engagement,
  DayOffRequest,
  HolidayCredit,
  Holiday,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generic API helpers
async function apiGet<T>(endpoint: string): Promise<T[]> {
  const response = await api.get<T[]>(endpoint);
  return response.data;
}

async function apiPost<T>(endpoint: string, data: T): Promise<T> {
  const response = await api.post<T>(endpoint, data);
  return response.data;
}

async function apiPut<T>(endpoint: string, id: string, updates: Partial<T>): Promise<void> {
  await api.put(endpoint, { id, ...updates });
}

async function apiDelete(endpoint: string, id: string): Promise<void> {
  await api.delete(endpoint, { params: { id } });
}

// Auth
export const logout = async (): Promise<void> => {
  await apiPost('/auth/logout', {});
} 

// Users
export const getUsers = async (): Promise<User[]> => {
  return apiGet<User>('/users');
};

export const addUser = async (user: User): Promise<void> => {
  await apiPost('/users', user);
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
  await apiPut('/users', id, updates);
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiDelete('/users', id);
};

// Developers
export const getDevelopers = async (): Promise<Developer[]> => {
  return apiGet<Developer>('/developers');
};

export const addDeveloper = async (dev: Developer): Promise<void> => {
  await apiPost('/developers', dev);
};

export const updateDeveloper = async (id: string, updates: Partial<Developer>): Promise<void> => {
  await apiPut('/developers', id, updates);
};

export const deleteDeveloper = async (id: string): Promise<void> => {
  await apiDelete('/developers', id);
};

// Clients
export const getClients = async (): Promise<Client[]> => {
  return apiGet<Client>('/clients');
};

export const addClient = async (client: Client): Promise<void> => {
  await apiPost('/clients', client);
};

export const updateClient = async (id: string, updates: Partial<Client>): Promise<void> => {
  await apiPut('/clients', id, updates);
};

export const deleteClient = async (id: string): Promise<void> => {
  await apiDelete('/clients', id);
};

// Engagements
export const getEngagements = async (): Promise<Engagement[]> => {
  return apiGet<Engagement>('/engagements');
};

export const addEngagement = async (engagement: Engagement): Promise<void> => {
  await apiPost('/engagements', engagement);
};

export const updateEngagement = async (id: string, updates: Partial<Engagement>): Promise<void> => {
  await apiPut('/engagements', id, updates);
};

export const deleteEngagement = async (id: string): Promise<void> => {
  await apiDelete('/engagements', id);
};

// Day Off Requests
export const getDayOffRequests = async (): Promise<DayOffRequest[]> => {
  return apiGet<DayOffRequest>('/day-off-requests');
};

export const addDayOffRequest = async (request: DayOffRequest): Promise<void> => {
  await apiPost('/day-off-requests', request);
};

export const updateDayOffRequest = async (id: string, updates: Partial<DayOffRequest>): Promise<void> => {
  await apiPut('/day-off-requests', id, updates);
};

export const deleteDayOffRequest = async (id: string): Promise<void> => {
  await apiDelete('/day-off-requests', id);
};

// Holiday Credits
export const getHolidayCredits = async (): Promise<HolidayCredit[]> => {
  return apiGet<HolidayCredit>('/holiday-credits');
};

export const addHolidayCredit = async (credit: HolidayCredit): Promise<void> => {
  await apiPost('/holiday-credits', credit);
};

export const updateHolidayCredit = async (id: string, updates: Partial<HolidayCredit>): Promise<void> => {
  await apiPut('/holiday-credits', id, updates);
};

export const deleteHolidayCredit = async (id: string): Promise<void> => {
  await apiDelete('/holiday-credits', id);
};

// Holidays
export const getHolidays = async (): Promise<Holiday[]> => {
  return apiGet<Holiday>('/holidays');
};

export const addHoliday = async (holiday: Holiday): Promise<void> => {
  await apiPost('/holidays', holiday);
};

export const updateHoliday = async (id: string, updates: Partial<Holiday>): Promise<void> => {
  await apiPut('/holidays', id, updates);
};

export const deleteHoliday = async (id: string): Promise<void> => {
  await apiDelete('/holidays', id);
};

// Invoices
import type { Invoice } from '@/types';
import { Session } from '@/hooks/useSession';

export const getInvoices = async (month?: string, engagementId?: string): Promise<Invoice[]> => {
  const response = await api.get<Invoice[]>('/invoices', {
    params: { month, engagementId },
  });
  return response.data;
};

export const saveInvoice = async (invoice: Invoice): Promise<void> => {
  await apiPost('/invoices', invoice);
};

// Initialize with demo data if empty
export const initializeDemoData = async (): Promise<void> => {
  const users = await getUsers();
  if (users.length === 0) {
    const adminUser: User = {
      id: '1',
      email: 'admin@hr.com',
      fullName: 'Admin User',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    await addUser(adminUser);

    const dev1: Developer = {
      id: 'd1',
      name: 'Alice Johnson',
      userId: undefined,
      createdAt: new Date().toISOString(),
    };
    const dev2: Developer = {
      id: 'd2',
      name: 'Bob Smith',
      userId: undefined,
      createdAt: new Date().toISOString(),
    };
    await addDeveloper(dev1);
    await addDeveloper(dev2);

    const client1: Client = {
      id: 'c1',
      name: 'Acme Corp',
      primaryContactUserId: undefined,
      createdAt: new Date().toISOString(),
    };
    const client2: Client = {
      id: 'c2',
      name: 'TechStart Inc',
      primaryContactUserId: undefined,
      createdAt: new Date().toISOString(),
    };
    await addClient(client1);
    await addClient(client2);

    const engagement1: Engagement = {
      id: 'e1',
      developerId: 'd1',
      clientId: 'c1',
      startDate: '2024-01-01',
      endDate: undefined,
      currency: 'USD',
      pricePerPeriod: 15000,
      salaryPerPeriod: 10000,
      clientDayoffRate: 750,
      devDayoffRate: 500,
      periodUnit: 'month',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const engagement2: Engagement = {
      id: 'e2',
      developerId: 'd2',
      clientId: 'c2',
      startDate: '2024-02-01',
      endDate: undefined,
      currency: 'USD',
      pricePerPeriod: 12000,
      salaryPerPeriod: 8000,
      clientDayoffRate: 600,
      devDayoffRate: 400,
      periodUnit: 'month',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await addEngagement(engagement1);
    await addEngagement(engagement2);
  }
};
