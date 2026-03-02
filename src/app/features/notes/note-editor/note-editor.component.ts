import {
  Component, inject, signal, computed,
  OnInit, OnDestroy, effect
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Editor, NgxEditorModule, Toolbar, toDoc, toHTML
} from 'ngx-editor';
import { switchMap, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotesService } from '../../../core/services/notes.service';
import { LayoutService } from '../../../core/services/layout.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-note-editor',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    NgxEditorModule
  ],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.scss'
})
export class NoteEditorComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notesService = inject(NotesService);
  protected layoutService = inject(LayoutService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
    ['undo', 'redo'],
    ['format_clear']
  ];

  noteId = toSignal(this.route.paramMap.pipe(
    switchMap(params => of(params.get('id') ?? ''))
  ), { initialValue: '' });

  note = toSignal(
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        const uid = this.authService.currentUser()?.uid;
        if (!id || !uid) return of(undefined);
        return this.notesService.getNoteById(uid, id);
      })
    ),
    { initialValue: undefined }
  );

  title = signal('');
  editorContent = signal<any>({});
  isLoading = signal(true);
  isSaving = signal(false);

  private destroy$ = new Subject<void>();
  private saveSubject$ = new Subject<void>();
  private initialized = false;

  get userId(): string {
    return this.authService.currentUser()?.uid ?? '';
  }

  constructor() {
    effect(() => {
      const n = this.note();
      if (n && !this.initialized) {
        this.title.set(n.title);
        try {
          this.editorContent.set(toDoc(n.content));
        } catch {
          this.editorContent.set(toDoc(''));
        }
        this.initialized = true;
        this.isLoading.set(false);
      } else if (n === undefined && this.noteId()) {
        // Still loading
      } else if (!n && !this.noteId()) {
        this.isLoading.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.editor = new Editor({ history: true, keyboardShortcuts: true });

    this.saveSubject$.pipe(
      debounceTime(1200),
      takeUntil(this.destroy$)
    ).subscribe(() => this.save());

    // Reset on route change
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.initialized = false;
      this.isLoading.set(true);
    });
  }

  ngOnDestroy(): void {
    this.editor.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTitleChange(value: string): void {
    this.title.set(value);
    this.saveSubject$.next();
  }

  onContentChange(doc: any): void {
    this.editorContent.set(doc);
    this.saveSubject$.next();
  }

  async save(): Promise<void> {
    const id = this.noteId();
    if (!id || !this.userId) return;

    this.isSaving.set(true);
    try {
      const content = toHTML(this.editorContent());
      await this.notesService.updateNote(this.userId, id, {
        title: this.title() || 'Sem título',
        content
      });
    } catch (err) {
      this.snackBar.open('Erro ao salvar nota', 'OK', { duration: 3000 });
    } finally {
      this.isSaving.set(false);
    }
  }

  isUploadingImage = signal(false);

  async onImageUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.userId) return;

    // Reseta o input para permitir re-upload do mesmo arquivo
    input.value = '';

    this.isUploadingImage.set(true);
    const snackRef = this.snackBar.open('Enviando imagem...', '', { duration: 0 });

    try {
      const url = await this.notesService.uploadImage(this.userId, file);
      this.insertImageAtCursor(url, file.name);
      this.saveSubject$.next();
      snackRef.dismiss();
      this.snackBar.open('Imagem inserida!', '', { duration: 2000 });
    } catch {
      snackRef.dismiss();
      this.snackBar.open('Erro ao enviar imagem', 'OK', { duration: 3000 });
    } finally {
      this.isUploadingImage.set(false);
    }
  }

  private insertImageAtCursor(src: string, alt: string): void {
    const { view } = this.editor;
    const { state, dispatch } = view;
    const { schema } = state;

    const imageNode = schema.nodes['image'].create({ src, alt, title: alt });
    // replaceSelectionWith insere no cursor ou substitui a seleção atual
    const transaction = state.tr.replaceSelectionWith(imageNode);
    dispatch(transaction);
  }

  confirmDelete(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: {
        title: 'Excluir nota',
        message: 'Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.',
        confirmLabel: 'Excluir',
        cancelLabel: 'Cancelar',
        danger: true
      }
    });

    dialogRef.afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        await this.notesService.deleteNote(this.userId, this.noteId());
        this.router.navigate(['/notes']);
        this.snackBar.open('Nota excluída', '', { duration: 2500 });
      }
    });
  }
}
