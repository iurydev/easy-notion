import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotesService } from '../../core/services/notes.service';
import { ThemeService } from '../../core/services/theme.service';
import { LayoutService } from '../../core/services/layout.service';
import { SidebarComponent } from '../notes/sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent implements OnInit, OnDestroy {
  protected authService = inject(AuthService);
  protected notesService = inject(NotesService);
  protected themeService = inject(ThemeService);
  protected layoutService = inject(LayoutService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  notes = toSignal(
    this.notesService.getNotes(this.authService.currentUser()!.uid),
    { initialValue: [] }
  );

  ngOnInit(): void {
    // No mobile, fecha a sidebar automaticamente ao navegar para uma nota
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.layoutService.isMobile) {
        this.layoutService.closeSidebar();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async createNote(): Promise<void> {
    const userId = this.authService.currentUser()!.uid;
    const id = await this.notesService.createNote(userId);
    this.router.navigate(['/notes', id]);
  }
}
