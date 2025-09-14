// Additional helper types for better type safety
export interface FacultyUser {
  id: string;
  email: string;
  name: string;
  role: "FACULTY";
  facultyId: string;
  password: string;
  isFirstLogin: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizerUser {
  id: string;
  email: string;
  name: string;
  role: "ORGANIZER";
  password: string;
  isFirstLogin: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AppUser = FacultyUser | OrganizerUser;
