import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon } from '../../models/pokemon.model';
import { DetailResourceState } from '../../state/pokemon.store';
import { StatRadarComponent } from '../stat-radar/stat-radar.component';

@Component({
  selector: 'app-specimen-panel',
  standalone: true,
  imports: [CommonModule, StatRadarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="detail-panel">
      <header class="detail-panel__header">
        <button class="detail-panel__back-btn" (click)="onClose()">‹</button>
        <span class="detail-panel__title">Specimen Details</span>
      </header>

      <div class="detail-panel__body">
        @if (detailState().status === 'loading') {
          <div class="pokemon-state-container">
            <p>Loading detailed specimen data...</p>
          </div>
        } @else if (detailState().status === 'error') {
          <div class="pokemon-state-container pokemon-state-container--error">
            <p>Failed to load details: {{ detailState().error }}</p>
            <button class="pokemon-table__add-btn" (click)="onRetry()">Retry</button>
          </div>
        } @else if (pokemon(); as poke) {
          <div class="detail-panel__hero">
            <div class="detail-panel__sprite-box">
              @if (poke.sprite) {
                <img [src]="poke.sprite" [alt]="poke.name" class="detail-panel__sprite-img" />
              }
            </div>
            
            <h3 class="detail-panel__name">{{ poke.name | titlecase }}</h3>
            
            <div class="detail-panel__types">
              @for (type of poke.types; track type) {
                <span class="type-badge type-badge--{{ type.toLowerCase() }}">{{ type }}</span>
              }
            </div>

            @if (poke.abilities && poke.abilities.length > 0) {
              <div class="detail-panel__stats">
                <h4>Abilities</h4>
                <ul>
                  @for (ability of poke.abilities; track ability.name) {
                    <li>{{ ability.name | titlecase }}</li>
                  }
                </ul>
              </div>
            }

            <app-stat-radar [stats]="poke.stats" />

          </div>
        } @else {
          <div class="pokemon-state-container">
            <p>Select a Pokémon to view its profile.</p>
          </div>
        }
      </div>
    </aside>
  `,
})
export class SpecimenPanelComponent {
  readonly pokemon = input<Pokemon | null>(null);
  readonly detailState = input<DetailResourceState>({
    status: 'idle',
    error: null,
    pokemonId: null
  });

  readonly close = output<void>();
  readonly retry = output<void>();

  onClose(): void {
    this.close.emit();
  }

  onRetry(): void {
    this.retry.emit();
  }
}