import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Pokemon } from '../models/pokemon.model';
import { PokemonService, PaginatedPokemonResponse } from '../services/pokemon.service';

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

  // --- State Subjects ---
  readonly #cacheSubject = new BehaviorSubject<Map<number, Pokemon>>(new Map());
  readonly cache$: Observable<Map<number, Pokemon>> = this.#cacheSubject.asObservable();

  readonly #totalCountSubject = new BehaviorSubject<number>(0);
  readonly totalCount$: Observable<number> = this.#totalCountSubject.asObservable();

  readonly #listStateSubject = new BehaviorSubject<ResourceState>({
    status: 'idle',
    error: null
  });
  readonly listState$: Observable<ResourceState> = this.#listStateSubject.asObservable();

  readonly #detailStateSubject = new BehaviorSubject<DetailResourceState>({
    status: 'idle',
    error: null,
    pokemonId: null
  });
  readonly detailState$: Observable<DetailResourceState> = this.#detailStateSubject.asObservable();

  /**
   * Loads a page of Pokémon from the API using offset and limit,
   * updating the cache, authoritative total count, and list state.
   */
  loadPokemon(offset: number, limit: number): void {
    this.#listStateSubject.next({ status: 'loading', error: null });

    this.#pokemonService.getPokemonList(offset, limit).subscribe({
      next: (response: PaginatedPokemonResponse) => {
        const currentCache = new Map(this.#cacheSubject.value);

        for (const p of response.pokemon) {
          const existing = currentCache.get(p.id);
          // Narrowly preserve existing detailed abilities if the list response doesn't provide them
          if (existing && existing.abilities && existing.abilities.length > 0 && (!p.abilities || p.abilities.length === 0)) {
            currentCache.set(p.id, {
              ...p,
              abilities: existing.abilities
            });
          } else {
            currentCache.set(p.id, p);
          }
        }

        this.#cacheSubject.next(currentCache);
        this.#totalCountSubject.next(response.totalCount);
        this.#listStateSubject.next({ status: 'success', error: null });
      },
      error: (err) => {
        this.#listStateSubject.next({ 
          status: 'error', 
          error: err?.message || 'Failed to load Pokémon catalog' 
        });
      }
    });
  }

  /**
   * Loads a single Pokémon's fully hydrated details by ID.
   */
  loadPokemonById(id: number): void {
    this.#detailStateSubject.next({ status: 'loading', error: null, pokemonId: id });

    this.#pokemonService.getPokemonById(id).subscribe({
      next: (detailedPokemon) => {
        const currentCache = new Map(this.#cacheSubject.value);
        currentCache.set(id, detailedPokemon);
        this.#cacheSubject.next(currentCache);

        this.#detailStateSubject.next({ status: 'success', error: null, pokemonId: id });
      },
      error: (err) => {
        this.#detailStateSubject.next({ 
          status: 'error', 
          error: err?.message || `Failed to load Pokémon #${id}`, 
          pokemonId: id 
        });
      }
    });
  }
}