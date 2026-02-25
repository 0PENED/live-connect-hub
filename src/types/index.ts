export interface User {
  id: string;
  name: string;
  isAdmin: boolean;
  avatar?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  openCode: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface CalendarSpace {
  id: string;
  name: string;
  openCode: string;
  schedules: Schedule[];
}

export interface Schedule {
  id: string;
  title: string;
  date: string;
  description?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: number;
  authorName: string;
}
