export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface PokemonAbility {
  name: string;
  isHidden?: boolean;
}

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  sprite: string;
  stats: PokemonStats;
  abilities?: PokemonAbility[]; // Included for detail view
}
