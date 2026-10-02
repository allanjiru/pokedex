export interface Team {
  readonly id: string;
  readonly name: string;
  readonly pokemonIds: readonly number[];
}

export interface CreateTeamDto {
  readonly name: string;
  readonly pokemonIds?: readonly number[];
}