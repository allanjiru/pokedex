
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Pokemon } from '../models/pokemon.model';
import {
  PokemonService,
  PaginatedPokemonResponse
} from '../services/pokemon.service';

export type ResourceStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ResourceState {
  readonly status: ResourceStatus;
  readonly error: string | null;
}

export interface DetailResourceState extends ResourceState {
  readonly pokemonId: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class PokemonStore {
  readonly #pokemonService = inject(PokemonService);

  // All fetched Pokémon, including fully hydrated details.
  readonly #cacheSubject = new BehaviorSubject<Map<number, Pokemon>>(
    new Map()
  );
  readonly cache$: Observable<Map<number, Pokemon>> =
    this.#cacheSubject.asObservable();

  // Only the Pokémon returned by the latest successful page request.
  readonly #currentPageSubject = new BehaviorSubject<readonly Pokemon[]>([]);
  readonly currentPage$: Observable<readonly Pokemon[]> =
    this.#currentPageSubject.asObservable();

  readonly #totalCountSubject = new BehaviorSubject<number>(0);
  readonly totalCount$: Observable<number> =
    this.#totalCountSubject.asObservable();

  readonly #listStateSubject = new BehaviorSubject<ResourceState>({
    status: 'idle',
    error: null
  });
  readonly listState$: Observable<ResourceState> =
    this.#listStateSubject.asObservable();

  readonly #detailStateSubject = new BehaviorSubject<DetailResourceState>({
    status: 'idle',
    error: null,
    pokemonId: null
  });
  readonly detailState$: Observable<DetailResourceState> =
    this.#detailStateSubject.asObservable();

  /**
   * Loads a page from the API and updates the current page, cache,
   * total count, and list resource state.
   */
  loadPokemon(offset: number, limit: number): void {
    this.#listStateSubject.next({ status: 'loading', error: null });

    this.#pokemonService.getPokemonList(offset, limit).subscribe({
      next: (response: PaginatedPokemonResponse) => {
        const currentCache = new Map(this.#cacheSubject.value);

        for (const pokemon of response.pokemon) {
          const existing = currentCache.get(pokemon.id);

          // Preserve hydrated abilities when a list response omits them.
          if (
            existing?.abilities?.length &&
            !pokemon.abilities?.length
          ) {
            currentCache.set(pokemon.id, {
              ...pokemon,
              abilities: existing.abilities
            });
          } else {
            currentCache.set(pokemon.id, pokemon);
          }
        }

        // Update the current page independently of the full cache.
        this.#currentPageSubject.next(
          response.pokemon.map(pokemon => {
            const cachedPokemon = currentCache.get(pokemon.id);
            return cachedPokemon ?? pokemon;
          })
        );

        this.#cacheSubject.next(currentCache);
        this.#totalCountSubject.next(response.totalCount);
        this.#listStateSubject.next({
          status: 'success',
          error: null
        });
      },
      error: (err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load Pokémon catalog';

        this.#listStateSubject.next({
          status: 'error',
          error: message
        });
      }
    });
  }

  /**
   * Loads fully hydrated details for a Pokémon by ID.
   */
  loadPokemonById(id: number): void {
    this.#detailStateSubject.next({
      status: 'loading',
      error: null,
      pokemonId: id
    });

    this.#pokemonService.getPokemonById(id).subscribe({
      next: (detailedPokemon: Pokemon) => {
        const currentCache = new Map(this.#cacheSubject.value);
        currentCache.set(id, detailedPokemon);

        this.#cacheSubject.next(currentCache);

        // Keep the visible page in sync if this Pokémon is on it.
        this.#currentPageSubject.next(
          this.#currentPageSubject.value.map(pokemon =>
            pokemon.id === id ? detailedPokemon : pokemon
          )
        );

        this.#detailStateSubject.next({
          status: 'success',
          error: null,
          pokemonId: id
        });
      },
      error: (err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : `Failed to load Pokémon #${id}`;

        this.#detailStateSubject.next({
          status: 'error',
          error: message,
          pokemonId: id
        });
      }
    });
  }
}