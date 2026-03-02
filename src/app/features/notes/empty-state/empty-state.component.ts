import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LayoutService } from '../../../core/services/layout.service';

@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule, MatButtonModule],
  template: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  protected layoutService = inject(LayoutService);
}
