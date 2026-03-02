import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  sidebarCollapsed = signal(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarCollapsed.set(true);
  }

  get isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }

  get isTablet(): boolean {
    return typeof window !== 'undefined'
      && window.innerWidth >= 768
      && window.innerWidth < 1024;
  }
}
