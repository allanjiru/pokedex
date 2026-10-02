import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { PokedexPageComponent } from './pokedex/components/pokedex-page/pokedex-page.component';
import { TeamTrayComponent } from './teams/components/team-tray/team-tray.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    PokedexPageComponent,
    TeamTrayComponent,
    ToastComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-viewport">
      <app-header />
      <main class="app-workspace">
        <app-pokedex-page />
      </main>
      <app-team-tray />
      <app-toast />
    </div>
  `
})
export class AppComponent {}