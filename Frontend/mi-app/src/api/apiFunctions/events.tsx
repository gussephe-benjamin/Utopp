import api from '../axios'

export interface EventCreate {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location?: string;
  tags?: string[];
  min_cycle?: number | null;
  max_cycle?: number | null;
}

export const createEvent = async (eventData: EventCreate) => {
  const response = await api.post('/events', eventData);
  return response.data;
};

export const getEvents = async (params?: { tags?: string[]; page?: number; size?: number }) => {
  const response = await api.get('/events', { params });
  return response.data;
};

export const getEvent = async (id: number) => {
  const response = await api.get(`/events/${id}`);
  return response.data;
};
