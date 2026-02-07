import api from '../axios'

export interface AnnouncementCreate {
  title: string;
  content: string;
  tags?: string[];
}

export const createAnnouncement = async (announcementData: AnnouncementCreate) => {
  const response = await api.post('/announcements', announcementData);
  return response.data;
};

export const getAnnouncements = async (params?: { tags?: string[] }) => {
  const response = await api.get('/announcements', { params });
  return response.data;
};

export const getAnnouncement = async (id: number) => {
  const response = await api.get(`/announcements/${id}`);
  return response.data;
};
