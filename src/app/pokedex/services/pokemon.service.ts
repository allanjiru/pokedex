import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, retry } from 'rxjs';
import { Pokemon, PokemonStats, PokemonAbility } from '../models/pokemon.model';

interface GraphQLResponse<T> {
  data: T;
  errors?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private readonly http = inject(HttpClient);
  private readonly graphqlUrl = 'https://beta.pokeapi.co/graphql/v1beta';

  /**
   * Fetch a paginated list of Pokémon using the specified query structure.
   */
  getPokemonList(offset: number = 0, limit: number = 10): Observable<Pokemon[]> {
    const query = `
      query GetPokemonList($limit: Int, $offset: Int) {
        pokemon_v2_pokemon(limit: $limit, offset: $offset, order_by: { id: asc }) {
          id
          name
          height
          weight
          pokemon_v2_pokemontypes {
            pokemon_v2_type {
              name
            }
          }
          pokemon_v2_pokemonstats {
            base_stat
            pokemon_v2_stat {
              name
            }
          }
          pokemon_v2_pokemonsprites {
            sprites
          }
        }
      }
    `;

    return this.http.post<GraphQLResponse<any>>(this.graphqlUrl, {
      query,
      variables: { limit, offset }
    }).pipe(
      retry({ count: 3, delay: 1000 }),
      map(response => {
        const rawList = response.data?.pokemon_v2_pokemon ?? [];
        return rawList.map((item: any) => this.mapToPokemon(item));
      })
    );
  }

  /**
   * Fetch a single Pokémon by ID, including detailed stats, sprites, and abilities.
   */
  getPokemonById(id: number): Observable<Pokemon> {
    const query = `
      query GetPokemonById($id: Int!) {
        pokemon_v2_pokemon_by_pk(id: $id) {
          id
          name
          height
          weight
          pokemon_v2_pokemontypes {
            pokemon_v2_type {
              name
            }
          }
          pokemon_v2_pokemonstats {
            base_stat
            pokemon_v2_stat {
              name
            }
          }
          pokemon_v2_pokemonsprites {
            sprites
          }
          pokemon_v2_pokemonabilities {
            is_hidden
            pokemon_v2_ability {
              name
            }
          }
        }
      }
    `;

    return this.http.post<GraphQLResponse<any>>(this.graphqlUrl, {
      query,
      variables: { id }
    }).pipe(
      retry({ count: 2, delay: 1000 }),
      map(response => {
        const rawItem = response.data?.pokemon_v2_pokemon_by_pk;
        if (!rawItem) {
          throw new Error(`Pokemon with ID ${id} not found.`);
        }
        return this.mapToPokemonDetail(rawItem);
      })
    );
  }

  /**
   * Private mapper for list items.
   */
  private mapToPokemon(raw: any): Pokemon {
    return {
      id: raw.id,
      name: raw.name,
      types: raw.pokemon_v2_pokemontypes?.map((t: any) => t.pokemon_v2_type.name) ?? [],
      sprite: this.extractSprite(raw.pokemon_v2_pokemonsprites),
      stats: this.mapStats(raw.pokemon_v2_pokemonstats)
    };
  }

  /**
   * Private mapper for detail items, mapping abilities.
   */
  private mapToPokemonDetail(raw: any): Pokemon {
    const basePokemon = this.mapToPokemon(raw);
    const abilities: PokemonAbility[] = raw.pokemon_v2_pokemonabilities?.map((a: any) => ({
      name: a.pokemon_v2_ability?.name ?? '',
      isHidden: a.is_hidden ?? false
    })) ?? [];

    return {
      ...basePokemon,
      abilities
    };
  }

  /**
   * Helper to safely extract the official artwork or front default sprite from the JSON structure.
   */
  private extractSprite(spritesObjArray: any[], id?: number): string {
    if (spritesObjArray?.length) {
      try {
        const rawSprites = spritesObjArray[0]?.sprites;
        const spritesJson =
          typeof rawSprites === 'string'
            ? JSON.parse(rawSprites)
            : rawSprites;

        const sprite =
          spritesJson?.other?.['official-artwork']?.front_default ??
          spritesJson?.front_default;

        if (sprite) return sprite;
      } catch {}
    }

    return id
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
      : '';
  }

  /**
   * Maps raw GraphQL stat rows into structured PokemonStats.
   */
  private mapStats(rawStats: any[]): PokemonStats {
    const statsMap: { [key: string]: number } = {};
    
    if (Array.isArray(rawStats)) {
      rawStats.forEach(s => {
        const statName = s.pokemon_v2_stat?.name;
        if (statName) {
          statsMap[statName] = s.base_stat;
        }
      });
    }

    return {
      hp: statsMap['hp'] ?? 0,
      attack: statsMap['attack'] ?? 0,
      defense: statsMap['defense'] ?? 0,
      specialAttack: statsMap['special-attack'] ?? 0,
      specialDefense: statsMap['special-defense'] ?? 0,
      speed: statsMap['speed'] ?? 0
    };
  }
}