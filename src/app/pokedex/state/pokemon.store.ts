import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Pokemon } from '../models/pokemon.model';
import { PokemonService } from '../services/pokemon.service';

export type ResourceStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ResourceState {
  status: ResourceStatus;
  error: string | null;
}

export interface DetailResourceState extends ResourceState {
  pokemonId: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class PokemonStore {
  private readonly pokemonService = inject(PokemonService);

  // --- State Subjects (Private) ---
  private readonly cacheSubject = new BehaviorSubject<Map<number, Pokemon>>(new Map());
  private readonly listStateSubject = new BehaviorSubject<ResourceState>({
    status: 'idle',
    error: null
  });
  private readonly detailStateSubject = new BehaviorSubject<DetailResourceState>({
    status: 'idle',
    pokemonId: null,
    error: null
  });

  // --- Read-only Public Observables ---
  readonly cache$: Observable<Map<number, Pokemon>> = this.cacheSubject.asObservable();
  readonly listState$: Observable<ResourceState> = this.listStateSubject.asObservable();
  readonly detailState$: Observable<DetailResourceState> = this.detailStateSubject.asObservable();

  /**
   * Load a paginated list of Pokémon.
   * Merges results into the cache immutably without losing previously fetched data.
   */
  loadPokemon(offset: number = 0, limit: number = 20): void {
    this.listStateSubject.next({ status: 'loading', error: null });

    this.pokemonService.getPokemonList(offset, limit).subscribe({
      next: (fetchedPokemonList) => {
        const updatedCache = new Map(this.cacheSubject.value);
        
        fetchedPokemonList.forEach((pokemon) => {
          const existing = updatedCache.get(pokemon.id);
          if (existing && existing.abilities && !pokemon.abilities) {
            updatedCache.set(pokemon.id, { ...pokemon, abilities: existing.abilities });
          } else {
            updatedCache.set(pokemon.id, pokemon);
          }
        });

        this.cacheSubject.next(updatedCache);
        this.listStateSubject.next({ status: 'success', error: null });
      },
      error: (err) => {
        this.listStateSubject.next({
          status: 'error',
          error: err?.message ?? 'Failed to load Pokémon list.'
        });
      }
    });
  }

  /**
   * Load a single Pokémon by ID for the detail view.
   * Checks the cache first; skips fetching if full detail (abilities) is already present.
   * Explicitly tracks the pokemonId so consumers can identify stale detail states.
   */
  loadPokemonById(id: number): void {
    const currentCache = this.cacheSubject.value;
    const cachedPokemon = currentCache.get(id);

    // If already in cache and has detail-level data (abilities), reuse it
    if (cachedPokemon && cachedPokemon.abilities !== undefined) {
      this.detailStateSubject.next({ status: 'success', pokemonId: id, error: null });
      return;
    }

    this.detailStateSubject.next({ status: 'loading', pokemonId: id, error: null });

    this.pokemonService.getPokemonById(id).subscribe({
      next: (pokemonDetail) => {
        const updatedCache = new Map(this.cacheSubject.value);
        updatedCache.set(pokemonDetail.id, pokemonDetail);

        this.cacheSubject.next(updatedCache);
        this.detailStateSubject.next({ status: 'success', pokemonId: id, error: null });
      },
      error: (err) => {
        this.detailStateSubject.next({
          status: 'error',
          pokemonId: id,
          error: err?.message ?? `Failed to load Pokémon with ID ${id}.`
        });
      }
    });
  }
}