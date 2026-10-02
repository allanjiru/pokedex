import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, debounceTime, distinctUntilChanged, map, merge, of, shareReplay, startWith, switchMap } from 'rxjs';

import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { PokemonService } from '../../../pokedex/services/pokemon.service';

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

interface PokemonSearchState {
  readonly status: SearchStatus;
  readonly results: readonly Pokemon[];
  readonly error: string | null;
}

const INITIAL_SEARCH_STATE: PokemonSearchState = {
  status: 'idle',
  results: [],
  error: null
};

@Component({
  selector: 'app-pokemon-autocomplete',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="pokemon-picker">
      @if (pickerOpen()) {
        <div
          class="autocomplete-dropdown"
          id="pokemon-search-results"
          role="listbox"
          aria-label="Pokémon search suggestions"
        >
          <div class="autocomplete-dropdown__header">
            <span class="autocomplete-dropdown__header-title">
              Search results
            </span>

            <span class="autocomplete-dropdown__header-count">
              @if (!searchTerm().trim()) {
                Start typing to search
              } @else if (searchState().status === 'loading') {
                Searching Pokémon...
              } @else if (searchState().status === 'error') {
                Search failed
              } @else if (
                searchState().status === 'success' &&
                searchState().results.length === 0
              ) {
                No Pokémon found
              } @else if (searchState().status === 'success') {
                {{ searchState().results.length }} matches
              }
            </span>
          </div>

          @if (searchState().status === 'loading') {
            <div class="autocomplete-dropdown__message" role="status">
              Searching Pokémon...
            </div>
          } @else if (searchState().status === 'error') {
            <div class="autocomplete-dropdown__message" role="alert">
              <p>{{ searchState().error }}</p>

              <button
                class="pokemon-table__add-btn"
                type="button"
                (click)="retrySearch()"
              >
                Retry
              </button>
            </div>
          } @else if (
            searchState().status === 'success' &&
            searchState().results.length === 0
          ) {
            <div class="autocomplete-dropdown__message">
              No Pokémon found. Try another name or Pokédex ID.
            </div>
          } @else if (searchState().status === 'success') {
            <ul class="autocomplete-dropdown__list">
              @for (
                pokemon of searchState().results;
                track pokemon.id
              ) {
                <li
                  class="autocomplete-dropdown__item"
                  role="option"
                  [attr.aria-label]="
                    pokemon.name +
                    ', Pokédex number ' +
                    pokemon.id
                  "
                  (click)="selectPokemon(pokemon)"
                >
                  <div class="autocomplete-dropdown__item-info">
                    <img
                      class="autocomplete-dropdown__sprite"
                      [src]="pokemon.sprite"
                      [alt]="pokemon.name"
                    />

                    <div class="autocomplete-dropdown__meta">
                      <div class="autocomplete-dropdown__name-row">
                        <span class="autocomplete-dropdown__name">
                          {{ pokemon.name }}
                        </span>

                        <span class="autocomplete-dropdown__dex-id">
                          #{{ pokemon.id }}
                        </span>
                      </div>

                      <div class="autocomplete-dropdown__types">
                        @for (
                          type of pokemon.types;
                          track type
                        ) {
                          <span
                            class="type-badge"
                            [class]="
                              'type-badge--' +
                              type.toLowerCase()
                            "
                          >
                            {{ type }}
                          </span>
                        }
                      </div>
                    </div>
                  </div>

                  <div class="autocomplete-dropdown__stats">
                    <span class="autocomplete-dropdown__bst">
                      BST {{ calculateBst(pokemon) }}
                    </span>
                  </div>

                  <div class="autocomplete-dropdown__actions">
                    <button
                      class="pokemon-table__add-btn"
                      [class.pokemon-table__add-btn--in-team]="isInTeam(pokemon)"
                      [attr.aria-disabled]="isInTeam(pokemon) ? 'true' : null"
                      [disabled]="isInTeam(pokemon)"
                      type="button"
                      (click)="selectPokemon(pokemon)"
                    >
                      {{ isInTeam(pokemon) ? 'In team' : '+ Add' }}
                    </button>
                  </div>
                  
                </li>
              }
            </ul>
          }

          <div class="autocomplete-dropdown__footer">
            <span>
              <kbd class="autocomplete-dropdown__kbd">↵</kbd>
              to add first result
            </span>

            <span>
              <kbd class="autocomplete-dropdown__kbd">Esc</kbd>
              to dismiss
            </span>
          </div>
        </div>
      }

      <div class="pokemon-picker__input-box">
        <span
          class="pokemon-picker__icon"
          aria-hidden="true"
        >
          ⌕
        </span>

        <input
          class="pokemon-picker__input"
          placeholder="Add Pokémon to team by name or ID..."
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="pokemon-search-results"
          [attr.aria-expanded]="pickerOpen()"
          [formControl]="searchControl"
          (focus)="pickerOpen.set(true)"
          (click)="pickerOpen.set(true)"
          (keydown.escape)="pickerOpen.set(false)"
          (keydown.enter)="onEnter($event)"
        />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokemonAutocompleteComponent {
  private readonly elementRef =
    inject(ElementRef<HTMLElement>);

  private readonly pokemonService =
    inject(PokemonService);

  private readonly retrySubject =
    new Subject<string>();

  readonly pokemonSelected =
    output<Pokemon>();

  readonly selectedPokemon =
    input<readonly Pokemon[]>([]);

  readonly pickerOpen =
    signal(false);

  readonly searchControl =
    new FormControl('', {
      nonNullable: true
    });

  readonly searchTerm = toSignal(
    this.searchControl.valueChanges.pipe(
      startWith('')
    ),
    {
      initialValue: ''
    }
  );

  private readonly searchTerms$ =
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map(term =>
        term.trim().toLowerCase()
      ),
      shareReplay({
        bufferSize: 1,
        refCount: true
      })
    );

  private search(
    term: string
  ): Observable<PokemonSearchState> {
    if (!term) {
      return of(INITIAL_SEARCH_STATE);
    }

    return this.pokemonService
      .searchPokemon(term)
      .pipe(
        map(results => ({
          status: 'success' as const,
          results,
          error: null
        })),
        catchError(() =>
          of({
            status: 'error' as const,
            results: [],
            error:
              'Could not load Pokémon. Check your connection and try again.'
          })
        ),
        startWith({
          status: 'loading' as const,
          results: [],
          error: null
        })
      );
  }

  private readonly searchState$ =
    merge(
      this.searchTerms$,
      this.retrySubject
    ).pipe(
      switchMap(term =>
        this.search(term)
      )
    );

  readonly searchState = toSignal(
    this.searchState$,
    {
      initialValue: INITIAL_SEARCH_STATE
    }
  );

  readonly results = computed(
    () => this.searchState().results
  );

  retrySearch(): void {
    const term =
      this.searchTerm()
        .trim()
        .toLowerCase();

    if (term) {
      this.retrySubject.next(term);
    }
  }

  onEnter(event: Event): void {
    event.preventDefault();

    const firstResult =
      this.results()[0];

    if (
      this.pickerOpen() &&
      firstResult
    ) {
      this.selectPokemon(firstResult);
    }
  }

  @HostListener(
    'document:click',
    ['$event']
  )
  onDocumentClick(
    event: MouseEvent
  ): void {
    const target =
      event.target as Node;

    if (
      !this.elementRef.nativeElement.contains(
        target
      )
    ) {
      this.pickerOpen.set(false);
    }
  }

  isInTeam(
    pokemon: Pokemon
  ): boolean {
    return this.selectedPokemon().some(
      member =>
        member.id === pokemon.id
    );
  }

  calculateBst(
    pokemon: Pokemon
  ): number {
    const stats = pokemon.stats;

    return (
      stats.hp +
      stats.attack +
      stats.defense +
      stats.specialAttack +
      stats.specialDefense +
      stats.speed
    );
  }

  selectPokemon(
    pokemon: Pokemon
  ): void {
    if (this.isInTeam(pokemon)) {
      return;
    }

    this.pokemonSelected.emit(
      pokemon
    );

    this.pickerOpen.set(false);

    this.searchControl.setValue(
      '',
      {
        emitEvent: false
      }
    );
  }
}