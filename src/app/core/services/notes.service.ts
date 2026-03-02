import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable, map } from 'rxjs';
import { Note, CreateNoteDto, UpdateNoteDto } from '../models/note.model';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);

  private notesCollection(userId: string) {
    return collection(this.firestore, `users/${userId}/notes`);
  }

  getNotes(userId: string): Observable<Note[]> {
    const notesRef = query(
      this.notesCollection(userId),
      orderBy('updatedAt', 'desc')
    );
    return (collectionData(notesRef, { idField: 'id' }) as Observable<any[]>).pipe(
      map(notes => notes.map(n => this.mapNote(n)))
    );
  }

  getNoteById(userId: string, noteId: string): Observable<Note | undefined> {
    const noteRef = doc(this.firestore, `users/${userId}/notes/${noteId}`);
    return (docData(noteRef, { idField: 'id' }) as Observable<any>).pipe(
      map(n => n ? this.mapNote(n) : undefined)
    );
  }

  async createNote(userId: string): Promise<string> {
    const dto: any = {
      title: 'Nova nota',
      content: '',
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(this.notesCollection(userId), dto);
    return docRef.id;
  }

  async updateNote(userId: string, noteId: string, data: UpdateNoteDto): Promise<void> {
    const noteRef = doc(this.firestore, `users/${userId}/notes/${noteId}`);
    await updateDoc(noteRef, { ...data, updatedAt: serverTimestamp() });
  }

  async deleteNote(userId: string, noteId: string): Promise<void> {
    const noteRef = doc(this.firestore, `users/${userId}/notes/${noteId}`);
    await deleteDoc(noteRef);
  }

  async uploadImage(userId: string, file: File): Promise<string> {
    const path = `users/${userId}/images/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  private mapNote(data: any): Note {
    return {
      id: data['id'],
      title: data['title'] || 'Sem título',
      content: data['content'] || '',
      userId: data['userId'],
      coverImage: data['coverImage'],
      createdAt: data['createdAt'] instanceof Timestamp
        ? data['createdAt'].toDate()
        : new Date(data['createdAt'] ?? Date.now()),
      updatedAt: data['updatedAt'] instanceof Timestamp
        ? data['updatedAt'].toDate()
        : new Date(data['updatedAt'] ?? Date.now())
    };
  }
}
