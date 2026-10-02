import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from './header/header.component';
import { PokedexPageComponent } from './pokedex/components/pokedex-page/pokedex-page.component';
import { TeamTrayComponent } from './teams/components/team-tray/team-tray.component';
import { TeamStore } from './teams/state/team.store';
import { ToastComponent, ToastType } from './shared/components/toast/toast.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    PokedexPageComponent,
    TeamTrayComponent,
    ToastComponent
  ],
  template: `
    <div class="app-viewport">
      <app-header />

      <main class="app-workspace">
        <app-pokedex-page />
      </main>

      <app-team-tray
        (createTeam)="onCreateTeam($event)"
      />

      <app-toast
        [message]="toastMessage()"
        [type]="toastType()"
        (closed)="clearToast()"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private readonly teamStore =
    inject(TeamStore);

  private readonly destroyRef =
    inject(DestroyRef);

  readonly toastMessage =
    signal('');

  readonly toastType =
    signal<ToastType>('success');

  constructor() {
    // Listen for mutation errors
    this.teamStore.mutationError$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(error => {
        if (!error) return;
        this.showToast(error, 'error');
      });

    // Listen for mutation successes
    this.teamStore.mutationSuccess$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(success => {
        if (!success) return;
        this.showToast(success, 'success');
      });
  }

  onCreateTeam(team: {
    name: string;
    pokemonIds: readonly number[];
  }): void {
    this.teamStore.createTeam(team);
  }

  private showToast( message: string, type: ToastType): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
  }

  clearToast(): void {
    this.toastMessage.set('');
  }
}