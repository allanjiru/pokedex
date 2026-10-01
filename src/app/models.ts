export interface Pokemon {
  id: number; name: string; types: string[]; sprite: string;
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
}

export const POKEMON: Pokemon[] = [];

export const typeClass = (type: string) => `type-badge--${type.toLowerCase()}`;
