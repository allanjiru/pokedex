
import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  map,
  distinctUntilChanged,
  shareReplay,
  debounceTime,
  switchMap
} from 'rxjs';
import { Pokemon } from '../models/pokemon.model';
import { PokemonStore } from './pokemon.store';

export type SortKey =
  | 'id'
  | 'name'
  | 'hp'
  | 'attack'
  | 'defense'
  | 'specialAttack'
  | 'specialDefense'
  | 'speed'
  | 'total';

@Injectable({
  providedIn: 'root'
})
export class PokemonSelectors {
  readonly #store = inject(PokemonStore);

  // Search and filtering state.
  readonly #searchSubject = new BehaviorSubject<string>('');
  readonly searchTerm$ = this.#searchSubject.asObservable();

  readonly #typeFilterSubject = new BehaviorSubject<string>('all');
  readonly typeFilter$ = this.#typeFilterSubject.asObservable();

  // Sorting state.
  readonly #sortKeySubject = new BehaviorSubject<SortKey>('id');
  readonly sortKey$ = this.#sortKeySubject.asObservable();

  readonly #sortDirectionSubject =
    new BehaviorSubject<'asc' | 'desc'>('asc');
  readonly sortDirection$ = this.#sortDirectionSubject.asObservable();

  // Pagination state.
  readonly #pageSubject = new BehaviorSubject<number>(1);
  readonly page$ = this.#pageSubject.asObservable().pipe(
    distinctUntilChanged()
  );

  readonly #pageSizeSubject = new BehaviorSubject<number>(10);
  readonly pageSize$ = this.#pageSizeSubject.asObservable().pipe(
    distinctUntilChanged()
  );

  // Selected Pokémon state.
  readonly #selectedIdSubject =
    new BehaviorSubject<number | null>(null);
  readonly selectedId$ = this.#selectedIdSubject.asObservable();

  /**
   * Resolves the selected Pokémon from the full cache so detail
   * information remains available after navigating between pages.
   */
  readonly selectedPokemon$: Observable<Pokemon | null> =
    combineLatest([
      this.#store.cache$,
      this.selectedId$
    ]).pipe(
      map(([cache, id]) =>
        id === null ? null : cache.get(id) ?? null
      ),
      shareReplay(1)
    );

  /**
   * Search only the current API page, not the entire accumulated cache.
   */
  readonly searchedPokemon$: Observable<Pokemon[]> =
    this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term =>
        this.#store.currentPage$.pipe(
          map(pokemonList => {
            const normalizedTerm = term.trim().toLowerCase();

            if (!normalizedTerm) {
              return [...pokemonList];
            }

            return pokemonList.filter(pokemon =>
              pokemon.name.toLowerCase().includes(normalizedTerm)
            );
          })
        )
      ),
      shareReplay(1)
    );

  /**
   * Filters the current page by Pokémon type.
   */
  readonly filteredPokemon$: Observable<Pokemon[]> =
    combineLatest([
      this.searchedPokemon$,
      this.typeFilter$.pipe(distinctUntilChanged())
    ]).pipe(
      map(([pokemonList, selectedType]) => {
        if (
          !selectedType ||
          selectedType.toLowerCase() === 'all'
        ) {
          return pokemonList;
        }

        const normalizedType = selectedType.toLowerCase();

        return pokemonList.filter(pokemon =>
          pokemon.types.some(
            type => type.toLowerCase() === normalizedType
          )
        );
      }),
      shareReplay(1)
    );

  /**
   * Sorts the filtered current-page Pokémon without mutating
   * the source array.
   */
  readonly sortedPokemon$: Observable<Pokemon[]> =
    combineLatest([
      this.filteredPokemon$,
      this.sortKey$.pipe(distinctUntilChanged()),
      this.sortDirection$.pipe(distinctUntilChanged())
    ]).pipe(
      map(([pokemonList, sortKey, direction]) =>
        [...pokemonList].sort((a, b) => {
          let aValue: string | number;
          let bValue: string | number;

          if (sortKey === 'name') {
            aValue = a.name;
            bValue = b.name;
          } else if (sortKey === 'id') {
            aValue = a.id;
            bValue = b.id;
          } else if (sortKey === 'total') {
            aValue = Object.values(a.stats).reduce(
              (sum, value) => sum + value,
              0
            );
            bValue = Object.values(b.stats).reduce(
              (sum, value) => sum + value,
              0
            );
          } else {
            aValue = a.stats[sortKey];
            bValue = b.stats[sortKey];
          }

          if (aValue < bValue) {
            return direction === 'asc' ? -1 : 1;
          }

          if (aValue > bValue) {
            return direction === 'asc' ? 1 : -1;
          }

          return 0;
        })
      ),
      shareReplay(1)
    );

  /**
   * The table receives the sorted results from the current API page.
   * No additional client-side pagination is needed.
   */
  readonly paginatedPokemon$: Observable<Pokemon[]> =
    this.sortedPokemon$;

  readonly totalCount$: Observable<number> =
    this.#store.totalCount$;

  // Component action dispatchers.

  updateSearchTerm(term: string): void {
    this.#searchSubject.next(term);
    this.#pageSubject.next(1);
  }

  updateTypeFilter(type: string): void {
    this.#typeFilterSubject.next(type);
    this.#pageSubject.next(1);
  }

  updateSorting(key: SortKey): void {
    if (this.#sortKeySubject.value === key) {
      const nextDirection =
        this.#sortDirectionSubject.value === 'asc'
          ? 'desc'
          : 'asc';

      this.#sortDirectionSubject.next(nextDirection);
    } else {
      this.#sortKeySubject.next(key);
      this.#sortDirectionSubject.next('asc');
    }
  }

  updatePage(page: number): void {
    this.#pageSubject.next(page);
  }

  updatePageSize(size: number): void {
    this.#pageSizeSubject.next(size);
    this.#pageSubject.next(1);
  }

  updateSelectedId(id: number | null): void {
    this.#selectedIdSubject.next(id);
  }
}