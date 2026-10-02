import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PokedexToolbarComponent } from '../pokedex-toolbar/pokedex-toolbar.component';
import { PokemonTableComponent } from '../pokemon-table/pokemon-table.component';
import { SpecimenPanelComponent } from '../specimen-panel/specimen-panel.component';
import { PokemonSelectors, SortKey } from '../../state/pokemon.selectors';
import { PokemonStore, ResourceState, DetailResourceState } from '../../state/pokemon.store';
import { Pokemon } from '../../models/pokemon.model';

@Component({
  selector: 'app-pokedex-page',
  standalone: true,
  imports: [
    PokedexToolbarComponent,
    PokemonTableComponent,
    SpecimenPanelComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="app-workspace__catalog">
      <app-pokedex-toolbar 
        [totalResults]="totalCount()" 
        [page]="page()"
        [pageSize]="pageSize()"
        (pageSizeChanged)="onPageSizeChange($event)"
        (searchChanged)="onSearchChanged($event)" 
        (typeChanged)="onTypeChanged($event)" 
      />

      @if (listState().status === 'loading' || listState().status === 'idle') {
        <div class="pokemon-table-card">
          <div class="pokemon-table-card__scroll-container pokemon-state-container">
            <p>Loading Pokémon catalog...</p>
          </div>
        </div>
      } @else if (listState().status === 'error') {
        <div class="pokemon-table-card">
          <div class="pokemon-table-card__scroll-container pokemon-state-container pokemon-state-container--error">
            <p>Failed to load Pokémon: {{ listState().error }}</p>
            <button class="pokemon-table__add-btn" (click)="retryCatalog()">Retry</button>
          </div>
        </div>
      } @else if (listState().status === 'success' && paginatedPokemon().length === 0) {
        <div class="pokemon-table-card">
          <div class="pokemon-table-card__scroll-container pokemon-state-container">
            <p>No Pokémon found matching your criteria.</p>
          </div>
        </div>
      } @else {
        <app-pokemon-table 
          [pokemon]="paginatedPokemon()"
          [totalCount]="totalCount()"
          [page]="page()"
          [pageSize]="pageSize()"
          [selected]="selectedPokemon()"
          (selectedChange)="onSelectPokemon($event)"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
          (sort)="onSort($event)"
        />
      }
    </section>

    @if (isPanelOpen()) {
      <app-specimen-panel 
        [pokemon]="selectedPokemon()"
        [detailState]="detailState()"
        (close)="onClosePanel()"
        (retry)="onRetryDetail()"
      />
    }
  `,
  styles: [`
    .pokemon-state-container {
      padding: 2rem;
      text-align: center;
    }
    .pokemon-state-container--error {
      color: #ef4444;
    }
    .pokemon-state-container--error button {
      margin-top: 1rem;
    }
  `]
})
export class PokedexPageComponent {
  private readonly selectors = inject(PokemonSelectors);
  private readonly store = inject(PokemonStore);

  // --- Selector-driven Signals ---
  readonly paginatedPokemon = toSignal(this.selectors.paginatedPokemon$, { initialValue: [] });
  readonly totalCount = toSignal(this.selectors.totalCount$, { initialValue: 0 });
  readonly page = toSignal(this.selectors.page$, { initialValue: 1 });
  readonly pageSize = toSignal(this.selectors.pageSize$, { initialValue: 10 });
  
  // Derived fully-hydrated specimen from selectors stream via cache bridge
  readonly selectedPokemon = toSignal(this.selectors.selectedPokemon$, { initialValue: null });

  // --- Store Lifecycle Signals ---
  readonly listState = toSignal(this.store.listState$, { 
    initialValue: { status: 'idle', error: null } as ResourceState 
  });
  
  readonly detailState = toSignal(this.store.detailState$, {
    initialValue: { status: 'idle', error: null, pokemonId: null } as DetailResourceState
  });

  // --- Local UI State Signals ---
  readonly isPanelOpen = signal<boolean>(false);

  constructor() {
    effect(() => {
      const currentPage = this.page();
      const currentSize = this.pageSize();
      const offset = (currentPage - 1) * currentSize;
      this.store.loadPokemon(offset, currentSize);
    });
  }

  // --- Interaction Handlers ---
  onPageChange(page: number): void {
    this.selectors.updatePage(page);
  }

  onPageSizeChange(size: number): void {
    this.selectors.updatePageSize(size);
  }

  onSearchChanged(term: string): void {
    this.selectors.updateSearchTerm(term);
  }

  onTypeChanged(type: string): void {
    this.selectors.updateTypeFilter(type);
  }

  onSort(sortKey: SortKey): void {
    this.selectors.updateSorting(sortKey);
  }

  onSelectPokemon(pokemon: Pokemon): void {
    this.selectors.updateSelectedId(pokemon.id);
    this.isPanelOpen.set(true);
    this.store.loadPokemonById(pokemon.id);
  }

  onClosePanel(): void {
    this.isPanelOpen.set(false);
    this.selectors.updateSelectedId(null);
  }

  retryCatalog(): void {
    const offset = (this.page() - 1) * this.pageSize();
    this.store.loadPokemon(offset, this.pageSize());
  }

  onRetryDetail(): void {
    const current = this.selectedPokemon();
    if (current) {
      this.store.loadPokemonById(current.id);
    }
  }
}
