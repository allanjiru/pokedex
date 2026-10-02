import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, of, startWith, switchMap, catchError } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { PokemonService } from '../../../pokedex/services/pokemon.service';

@Component({
  selector: 'app-pokemon-autocomplete',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="pokemon-picker">
      @if (pickerOpen()) {
        <div class="autocomplete-dropdown" role="listbox" aria-label="Pokémon search suggestions">
          <div class="autocomplete-dropdown__header">
            <span class="autocomplete-dropdown__header-title">Search results</span>
            <span class="autocomplete-dropdown__header-count">
              @if (!searchTerm().trim()) {
                Start typing to search
              } @else if (results().length === 0) {
                No Pokémon found
              } @else {
                {{ results().length }} matches
              }
            </span>
          </div>
          <ul class="autocomplete-dropdown__list">
            @for (pokemon of results(); track pokemon.id) {
              <li 
                class="autocomplete-dropdown__item" 
                role="option"
                (click)="selectPokemon(pokemon)"
              >
                <div class="autocomplete-dropdown__item-info">
                  <img class="autocomplete-dropdown__sprite" [src]="pokemon.sprite" [alt]="pokemon.name" />
                  <div class="autocomplete-dropdown__meta">
                    <div class="autocomplete-dropdown__name-row">
                      <span class="autocomplete-dropdown__name">{{ pokemon.name }}</span>
                      <span class="autocomplete-dropdown__dex-id">#{{ pokemon.id }}</span>
                    </div>
                    <div class="autocomplete-dropdown__types">
                      @for (type of pokemon.types; track type) {
                        <span class="type-badge" [class]="'type-badge--' + type.toLowerCase()">{{ type }}</span>
                      }
                    </div>
                  </div>
                </div>
                <div class="autocomplete-dropdown__stats">
                  <span class="autocomplete-dropdown__bst">BST {{ calculateBst(pokemon) }}</span>
                </div>
                <div class="autocomplete-dropdown__actions">
                  <button 
                    class="pokemon-table__add-btn" 
                    type="button" 
                    (click)="$event.stopPropagation(); selectPokemon(pokemon)"
                  >
                    + Add
                  </button>
                </div>
              </li>
            }
          </ul>
          <div class="autocomplete-dropdown__footer">
            <span><kbd class="autocomplete-dropdown__kbd">↵</kbd> to add</span>
            <span><kbd class="autocomplete-dropdown__kbd">Esc</kbd> to dismiss</span>
          </div>
        </div>
      }
      <div class="pokemon-picker__input-box">
        <span class="pokemon-picker__icon" aria-hidden="true">⌕</span>
        <input 
          class="pokemon-picker__input" 
          placeholder="Add Pokémon to team by name or ID..." 
          type="text"
          [formControl]="searchControl"
          (focus)="pickerOpen.set(true)"
          (click)="pickerOpen.set(true)"
          (keydown.escape)="pickerOpen.set(false)"
        />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokemonAutocompleteComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly pokemonService = inject(PokemonService);

  readonly pokemonSelected = output<Pokemon>();
  readonly pickerOpen = signal(false);

  readonly searchControl = new FormControl('', { nonNullable: true });

  // Track raw search term to power header state messages
  readonly searchTerm = toSignal(
    this.searchControl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  // RxJS search pipeline: debounce -> normalize -> distinct -> switchMap to API search service
  private readonly results$ = this.searchControl.valueChanges.pipe(
    debounceTime(300),
    map(term => term.trim().toLowerCase()),
    distinctUntilChanged(),
    switchMap(term => {
      if (!term) {
        return of<readonly Pokemon[]>([]);
      }
      return this.pokemonService.searchPokemon(term).pipe(
        catchError(() => of<readonly Pokemon[]>([]))
      );
    })
  );

  readonly results = toSignal(this.results$, { initialValue: [] as readonly Pokemon[] });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.pickerOpen.set(false);
    }
  }

  calculateBst(pokemon: Pokemon): number {
    const s = pokemon.stats;
    return s.hp + s.attack + s.defense + s.specialAttack + s.specialDefense + s.speed;
  }

  selectPokemon(pokemon: Pokemon): void {
    this.pokemonSelected.emit(pokemon);
    this.pickerOpen.set(false);
    this.searchControl.setValue('', { emitEvent: false });
  }
}