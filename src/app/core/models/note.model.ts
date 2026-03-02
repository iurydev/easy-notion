export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  coverImage?: string;
}

export interface CreateNoteDto {
  title: string;
  content: string;
  userId: string;
  coverImage?: string;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  coverImage?: string;
}
