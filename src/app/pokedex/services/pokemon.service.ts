import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, retry, timer, map } from 'rxjs';
import { Pokemon, PokemonAbility, PokemonStats } from '../models/pokemon.model';

export interface PaginatedPokemonResponse {
  readonly pokemon: readonly Pokemon[];
  readonly totalCount: number;
}

interface SpriteRecord {
  readonly front_default?: string | null;
  readonly other?: {
    readonly 'official-artwork'?: {
      readonly front_default?: string | null;
    };
  };
}

interface GraphQLStatNode {
  readonly base_stat: number;
  readonly pokemon_v2_stat: {
    readonly name: string;
  };
}

interface GraphQLTypeNode {
  readonly pokemon_v2_type: {
    readonly name: string;
  };
}

interface GraphQLAbilityNode {
  readonly pokemon_v2_ability: {
    readonly name: string;
  };
}

interface GraphQLPokemonNode {
  readonly id: number;
  readonly name: string;
  readonly pokemon_v2_pokemonsprites: readonly { readonly sprites: string | SpriteRecord }[];
  readonly pokemon_v2_pokemonstats: readonly GraphQLStatNode[];
  readonly pokemon_v2_pokemontypes: readonly GraphQLTypeNode[];
  readonly pokemon_v2_pokemonabilities?: readonly GraphQLAbilityNode[];
}

interface GraphQLListResponse {
  readonly data?: {
    readonly pokemon_v2_pokemon: readonly GraphQLPokemonNode[];
    readonly pokemon_v2_pokemon_aggregate: {
      readonly aggregate: {
        readonly count: number;
      };
    };
  };
  readonly errors?: readonly { readonly message: string }[];
}

interface GraphQLDetailResponse {
  readonly data?: {
    readonly pokemon_v2_pokemon_by_pk: GraphQLPokemonNode | null;
  };
  readonly errors?: readonly { readonly message: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  readonly #http = inject(HttpClient);
  readonly #apiUrl = 'https://beta.pokeapi.co/graphql/v1beta';

  /**
   * Fetches a paginated page of Pokémon alongside the total authoritative aggregate count.
   */
  getPokemonList(offset: number, limit: number): Observable<PaginatedPokemonResponse> {
    const query = `
      query GetPokemonCatalog($limit: Int!, $offset: Int!) {
        pokemon_v2_pokemon(limit: $limit, offset: $offset, order_by: {id: asc}) {
          id
          name
          pokemon_v2_pokemonsprites {
            sprites
          }
          pokemon_v2_pokemonstats {
            base_stat
            pokemon_v2_stat {
              name
            }
          }
          pokemon_v2_pokemontypes {
            pokemon_v2_type {
              name
            }
          }
        }
        pokemon_v2_pokemon_aggregate {
          aggregate {
            count
          }
        }
      }
    `;

    return this.#http.post<GraphQLListResponse>(this.#apiUrl, {
      query,
      variables: { limit, offset }
    }).pipe(
      retry({
        count: 2,
        delay: (error, retryCount) => timer(retryCount * 1000)
      }),
      map(response => {
        if (response.errors && response.errors.length > 0) {
          throw new Error(response.errors[0].message);
        }
        if (!response.data) {
          throw new Error('Invalid GraphQL response structure: missing data');
        }

        const rawList = response.data.pokemon_v2_pokemon;
        const totalCount = response.data.pokemon_v2_pokemon_aggregate.aggregate.count;
        const pokemon = rawList.map(node => this.#mapPokemonItem(node));

        return { pokemon, totalCount };
      })
    );
  }

  /**
   * Fetches full hydrated details for a single Pokémon by ID.
   */
  getPokemonById(id: number): Observable<Pokemon> {
    const query = `
      query GetPokemonDetail($id: Int!) {
        pokemon_v2_pokemon_by_pk(id: $id) {
          id
          name
          pokemon_v2_pokemonsprites {
            sprites
          }
          pokemon_v2_pokemonstats {
            base_stat
            pokemon_v2_stat {
              name
            }
          }
          pokemon_v2_pokemontypes {
            pokemon_v2_type {
              name
            }
          }
          pokemon_v2_pokemonabilities {
            pokemon_v2_ability {
              name
            }
          }
        }
      }
    `;

    return this.#http.post<GraphQLDetailResponse>(this.#apiUrl, {
      query,
      variables: { id }
    }).pipe(
      retry({
        count: 2,
        delay: (error, retryCount) => timer(retryCount * 1000)
      }),
      map(response => {
        if (response.errors && response.errors.length > 0) {
          throw new Error(response.errors[0].message);
        }
        if (!response.data) {
          throw new Error('Invalid GraphQL response structure: missing data');
        }

        const node = response.data.pokemon_v2_pokemon_by_pk;
        if (!node) {
          throw new Error(`Pokemon with ID ${id} not found.`);
        }

        return this.#mapPokemonItem(node);
      })
    );
  }

  #mapPokemonItem(node: GraphQLPokemonNode): Pokemon {
    const sprite = this.#extractSpriteUrl(node.pokemon_v2_pokemonsprites[0]?.sprites);

    const statsMap: Record<string, number> = {};
    node.pokemon_v2_pokemonstats.forEach(s => {
      const statName = s.pokemon_v2_stat?.name;
      if (statName) {
        statsMap[statName] = s.base_stat;
      }
    });

    const types = node.pokemon_v2_pokemontypes
      .map(t => t.pokemon_v2_type?.name)
      .filter((name): name is string => Boolean(name));

    const abilities: PokemonAbility[] = (node.pokemon_v2_pokemonabilities ?? [])
      .map(a => a.pokemon_v2_ability?.name)
      .filter((name): name is string => Boolean(name))
      .map(name => ({ name }));

    const stats: PokemonStats = {
      hp: statsMap['hp'] ?? 0,
      attack: statsMap['attack'] ?? 0,
      defense: statsMap['defense'] ?? 0,
      specialAttack: statsMap['special-attack'] ?? 0,
      specialDefense: statsMap['special-defense'] ?? 0,
      speed: statsMap['speed'] ?? 0
    };

    return {
      id: node.id,
      name: node.name,
      sprite,
      types,
      stats,
      abilities
    };
  }

  #extractSpriteUrl(spritesData: string | SpriteRecord | undefined): string {
    if (!spritesData) return '';
    try {
      const parsed: SpriteRecord = typeof spritesData === 'string' ? JSON.parse(spritesData) : spritesData;
      return parsed.front_default || parsed.other?.['official-artwork']?.front_default || '';
    } catch {
      return '';
    }
  }
}