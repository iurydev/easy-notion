import { Component, input, output, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { Note } from '../../core/models/note.model';
import { AppUser } from '../../core/models/user.model';

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    FormsModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  notes = input<Note[]>([]);
  collapsed = input<boolean>(false);
  currentUser = input<AppUser | null>(null);
  isDarkMode = input<boolean>(false);

  toggleSidebar = output<void>();
  toggleTheme = output<void>();
  logout = output<void>();
  createNote = output<void>();

  searchQuery = signal('');

  filteredNotes = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.notes();
    return this.notes().filter(n =>
      n.title.toLowerCase().includes(query) ||
      this.getPreview(n.content).toLowerCase().includes(query)
    );
  });

  getPreview(content: string): string {
    const text = content.replace(/<[^>]+>/g, '').trim();
    return text.length > 60 ? text.slice(0, 60) + '…' : text || 'Nota vazia';
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
}
