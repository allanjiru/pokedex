import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon } from '../../models/pokemon.model';
import { DetailResourceState } from '../../state/pokemon.store';

@Component({
  selector: 'app-specimen-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="pokemon-panel">
      <header class="pokemon-panel__header">
        <h2>Specimen Details</h2>
        <button class="pokemon-panel__close-btn" (click)="onClose()">×</button>
      </header>

      <div class="pokemon-panel__content">
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
          <div class="pokemon-panel__details">
            <div class="pokemon-panel__sprite-container">
              @if (poke.sprite) {
                <img [src]="poke.sprite" [alt]="poke.name" class="pokemon-panel__sprite" />
              }
            </div>
            
            <h3 class="pokemon-panel__name">{{ poke.name | titlecase }}</h3>
            
            <div class="pokemon-panel__types">
              @for (type of poke.types; track type) {
                <span class="pokemon-badge pokemon-badge--{{ type.toLowerCase() }}">{{ type }}</span>
              }
            </div>

            @if (poke.abilities && poke.abilities.length > 0) {
              <div class="pokemon-panel__section">
                <h4>Abilities</h4>
                <ul>
                  @for (ability of poke.abilities; track ability.name) {
                    <li>{{ ability.name | titlecase }}</li>
                  }
                </ul>
              </div>
            }

            <div class="pokemon-panel__section">
              <h4>Base Stats</h4>
              <ul class="pokemon-panel__stats">
                <li><span>HP:</span> {{ poke.stats.hp }}</li>
                <li><span>Attack:</span> {{ poke.stats.attack }}</li>
                <li><span>Defense:</span> {{ poke.stats.defense }}</li>
                <li><span>Sp. Atk:</span> {{ poke.stats.specialAttack }}</li>
                <li><span>Sp. Def:</span> {{ poke.stats.specialDefense }}</li>
                <li><span>Speed:</span> {{ poke.stats.speed }}</li>
              </ul>
            </div>
          </div>
        } @else {
          <div class="pokemon-state-container">
            <p>Select a Pokémon to view its profile.</p>
          </div>
        }
      </div>
    </aside>
  `,
  styles: [`
    .pokemon-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      height: 100vh;
      background: var(--surface-card, #ffffff);
      box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      z-index: 1000;
    }
    .pokemon-panel__header {
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--surface-border, #e5e7eb);
    }
    .pokemon-panel__close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
    .pokemon-panel__content {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }
    .pokemon-panel__sprite-container {
      text-align: center;
      margin-bottom: 1rem;
    }
    .pokemon-panel__sprite {
      width: 120px;
      height: 120px;
    }
    .pokemon-panel__name {
      text-align: center;
      margin-bottom: 1rem;
    }
    .pokemon-panel__types {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .pokemon-panel__section {
      margin-top: 1.5rem;
    }
    .pokemon-panel__stats {
      list-style: none;
      padding: 0;
    }
    .pokemon-panel__stats li {
      display: flex;
      justify-content: space-between;
      padding: 0.25rem 0;
      border-bottom: 1px dashed var(--surface-border, #e5e7eb);
    }
    .pokemon-state-container {
      padding: 2rem;
      text-align: center;
    }
    .pokemon-state-container--error {
      color: #ef4444;
    }
  `]
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