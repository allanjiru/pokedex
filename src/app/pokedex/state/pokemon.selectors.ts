import { Injectable, inject } from '@angular/core';
import { 
  Observable, 
  BehaviorSubject, 
  combineLatest, 
  map, 
  distinctUntilChanged, 
  shareReplay, 
  debounceTime, 
  switchMap 
} from 'rxjs';
import { Pokemon } from '../models/pokemon.model';
import { PokemonStore } from './pokemon.store';

export type SortKey = 'id' | 'name' | 'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed' | 'total';

@Injectable({
  providedIn: 'root'
})
export class PokemonSelectors {
  private readonly store = inject(PokemonStore);

  // --- State Triggers ---
  private readonly searchSubject = new BehaviorSubject<string>('');
  readonly searchTerm$ = this.searchSubject.asObservable();

  private readonly typeFilterSubject = new BehaviorSubject<string>('all');
  readonly typeFilter$ = this.typeFilterSubject.asObservable();

  private readonly sortKeySubject = new BehaviorSubject<SortKey>('id');
  readonly sortKey$ = this.sortKeySubject.asObservable();

  private readonly sortDirectionSubject = new BehaviorSubject<'asc' | 'desc'>('asc');
  readonly sortDirection$ = this.sortDirectionSubject.asObservable();

  private readonly pageSubject = new BehaviorSubject<number>(1);
  readonly page$ = this.pageSubject.asObservable();

  private readonly pageSizeSubject = new BehaviorSubject<number>(10);
  readonly pageSize$ = this.pageSizeSubject.asObservable();

  // --- Selection State Triggers ---
  private readonly selectedIdSubject = new BehaviorSubject<number | null>(null);
  readonly selectedId$ = this.selectedIdSubject.asObservable();

  /**
   * Combines the store cache and the selected ID to yield the fully hydrated
   * Pokémon from the cache, updating automatically when detail requests complete.
   */
  readonly selectedPokemon$: Observable<Pokemon | null> = combineLatest([
    this.store.cache$,
    this.selectedId$
  ]).pipe(
    map(([cache, id]) => {
      if (id === null) return null;
      return cache.get(id) ?? null;
    }),
    shareReplay(1)
  );

  /**
   * Step 1: Convert the Map cache into a Pokemon array stream.
   * Emits whenever the store replaces the cache reference (guaranteeing detail updates propagate).
   */
  readonly allCachedPokemon$: Observable<Pokemon[]> = this.store.cache$.pipe(
    map(cacheMap => Array.from(cacheMap.values())),
    shareReplay(1)
  );

  /**
   * Step 2: Search pipeline satisfying the required operator sequence.
   */
  readonly searchedPokemon$: Observable<Pokemon[]> = this.searchTerm$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term => 
      this.allCachedPokemon$.pipe(
        map(pokemonList => {
          const lowerTerm = term.toLowerCase().trim();
          if (!lowerTerm) {
            return pokemonList;
          }
          return pokemonList.filter(p => p.name.toLowerCase().includes(lowerTerm));
        })
      )
    ),
    shareReplay(1)
  );

  /**
   * Step 3: Type Filtering using combineLatest.
   */
  readonly filteredPokemon$: Observable<Pokemon[]> = combineLatest([
    this.searchedPokemon$,
    this.typeFilter$.pipe(distinctUntilChanged())
  ]).pipe(
    map(([pokemonList, selectedType]) => {
      if (!selectedType || selectedType.toLowerCase() === 'all') {
        return pokemonList;
      }
      const lowerType = selectedType.toLowerCase();
      return pokemonList.filter(p => p.types.some(t => t.toLowerCase() === lowerType));
    }),
    shareReplay(1)
  );

  /**
   * Step 4: Sorting using combineLatest with immutable sorting logic and strict SortKey typing.
   */
  readonly sortedPokemon$: Observable<Pokemon[]> = combineLatest([
    this.filteredPokemon$,
    this.sortKey$.pipe(distinctUntilChanged()),
    this.sortDirection$.pipe(distinctUntilChanged())
  ]).pipe(
    map(([pokemonList, sortKey, direction]) => {
      return [...pokemonList].sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        if (sortKey === 'name') {
          aVal = a.name;
          bVal = b.name;
        } else if (sortKey === 'id') {
          aVal = a.id;
          bVal = b.id; // Fixed: comparing against b.id
        } else if (sortKey === 'total') {
          aVal = Object.values(a.stats).reduce((sum, v) => sum + v, 0);
          bVal = Object.values(b.stats).reduce((sum, v) => sum + v, 0);
        } else {
          aVal = a.stats[sortKey as keyof Pokemon['stats']] ?? 0;
          bVal = b.stats[sortKey as keyof Pokemon['stats']] ?? 0;
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }),
    shareReplay(1)
  );

  /**
   * Step 5 & 6: Total count stream and final paginated table view.
   */
  readonly totalCount$: Observable<number> = this.sortedPokemon$.pipe(
    map(list => list.length),
    distinctUntilChanged(),
    shareReplay(1)
  );

  readonly paginatedPokemon$: Observable<Pokemon[]> = combineLatest([
    this.sortedPokemon$,
    this.page$.pipe(distinctUntilChanged()),
    this.pageSize$.pipe(distinctUntilChanged())
  ]).pipe(
    map(([sortedList, page, pageSize]) => {
      const startIndex = (page - 1) * pageSize;
      return sortedList.slice(startIndex, startIndex + pageSize);
    }),
    shareReplay(1)
  );

  // --- Component Action Dispatchers ---

  updateSearchTerm(term: string): void {
    this.searchSubject.next(term);
    this.pageSubject.next(1);
  }

  updateTypeFilter(type: string): void {
    this.typeFilterSubject.next(type);
    this.pageSubject.next(1);
  }

  updateSorting(key: SortKey): void {
    if (this.sortKeySubject.value === key) {
      const newDir = this.sortDirectionSubject.value === 'asc' ? 'desc' : 'asc';
      this.sortDirectionSubject.next(newDir);
    } else {
      this.sortKeySubject.next(key);
      this.sortDirectionSubject.next('asc');
    }
  }

  updatePage(page: number): void {
    this.pageSubject.next(page);
  }

  updatePageSize(size: number): void {
    this.pageSizeSubject.next(size);
    this.pageSubject.next(1);
  }

  updateSelectedId(id: number | null): void {
    this.selectedIdSubject.next(id);
  }
}