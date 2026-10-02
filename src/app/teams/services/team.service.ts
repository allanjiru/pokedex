import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import {
  Team,
  CreateTeamDto
} from '../models/team.model';

interface GraphQLTeam {
  readonly id: number;
  readonly name: string;
  readonly pokemon_ids: readonly number[];
  readonly trainer_id: string;
  readonly created_at: string;
}

interface GetTeamsData {
  readonly allTeams: readonly GraphQLTeam[];
}

interface CreateTeamData {
  readonly createTeam: GraphQLTeam;
}

interface DeleteTeamData {
  readonly removeTeam: {
    readonly id: number;
  } | null;
}

interface GraphQLResponse<T> {
  readonly data?: T;
  readonly errors?: readonly {
    readonly message: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  readonly #http = inject(HttpClient);

  readonly #graphqlUrl =
    'http://localhost:4000/graphql';

  /**
   * Fetches all saved teams from the mock
   * GraphQL server.
   */
  getTeams(): Observable<Team[]> {
    const query = `
      query GetTeams {
        allTeams {
          id
          name
          pokemon_ids
          trainer_id
          created_at
        }
      }
    `;

    return this.#http
      .post<GraphQLResponse<GetTeamsData>>(
        this.#graphqlUrl,
        { query }
      )
      .pipe(
        map(response => {
          this.throwGraphQLError(response);

          if (!response.data?.allTeams) {
            throw new Error(
              'Failed to load teams: missing data response from server'
            );
          }

          return response.data.allTeams.map(
            team => this.mapTeam(team)
          );
        })
      );
  }

  /**
   * Creates a new team via GraphQL mutation.
   *
   * The backend generates the team ID.
   */
  createTeam(
    dto: CreateTeamDto
  ): Observable<Team> {
    const mutation = `
      mutation CreateTeam(
        $name: String!
        $pokemon_ids: [Int!]!
        $trainer_id: ID!
        $created_at: String!
      ) {
        createTeam(
          name: $name
          pokemon_ids: $pokemon_ids
          trainer_id: $trainer_id
          created_at: $created_at
        ) {
          id
          name
          pokemon_ids
          trainer_id
          created_at
        }
      }
    `;

    const variables = {
      name: dto.name.trim(),
      pokemon_ids: dto.pokemonIds ?? [],
      trainer_id: '1',
      created_at: new Date().toISOString()
    };

    return this.#http
      .post<GraphQLResponse<CreateTeamData>>(
        this.#graphqlUrl,
        {
          query: mutation,
          variables
        }
      )
      .pipe(
        map(response => {
          this.throwGraphQLError(response);

          if (!response.data?.createTeam) {
            throw new Error(
              'Failed to create team: no data returned from server'
            );
          }

          return this.mapTeam(
            response.data.createTeam
          );
        })
      );
  }

  /**
   * Deletes a team by its ID via GraphQL
   * mutation.
   */
  deleteTeam(
    teamId: string
  ): Observable<void> {
    const mutation = `
      mutation RemoveTeam(
        $id: ID!
      ) {
        removeTeam(
          id: $id
        ) {
          id
        }
      }
    `;

    const variables = {
      id: teamId
    };

    return this.#http
      .post<GraphQLResponse<DeleteTeamData>>(
        this.#graphqlUrl,
        {
          query: mutation,
          variables
        }
      )
      .pipe(
        map(response => {
          this.throwGraphQLError(response);

          if (!response.data) {
            throw new Error(
              'Failed to delete team: missing data response from server'
            );
          }

          return;
        })
      );
  }

  /**
   * Checks if a team name already exists
   * via the GraphQL backend.
   */
  teamNameExists(
    name: string
  ): Observable<boolean> {
    const normalizedTarget =
      name.trim().toLowerCase();

    return this.getTeams().pipe(
      map(teams =>
        teams.some(
          team =>
            team.name
              .trim()
              .toLowerCase() ===
            normalizedTarget
        )
      )
    );
  }

  /**
   * Throws GraphQL errors as RxJS errors.
   *
   * GraphQL may return HTTP 200 even when
   * the operation itself failed.
   */
  private throwGraphQLError<T>(
    response: GraphQLResponse<T>
  ): void {
    if (!response.errors?.length) {
      return;
    }

    const message =
      response.errors
        .map(error => error.message)
        .join(', ');

    throw new Error(message);
  }

  /**
   * Maps the GraphQL team model to the
   * application team model.
   */
  private mapTeam(
    team: GraphQLTeam
  ): Team {
    return {
      id: String(team.id),
      name: team.name,
      pokemonIds: team.pokemon_ids
    };
  }
}