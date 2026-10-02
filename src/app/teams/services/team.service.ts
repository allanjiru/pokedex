import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Team, CreateTeamDto } from '../models/team.model';

interface GraphQLTeam {
  readonly id: number;
  readonly name: string;
  readonly pokemon_ids: readonly number[];
}

interface GetTeamsData {
  readonly teams: readonly GraphQLTeam[];
}

interface CreateTeamData {
  readonly createTeam: GraphQLTeam;
}

interface GraphQLResponse<T> {
  readonly data?: T;
  readonly errors?: readonly { readonly message: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  readonly #http = inject(HttpClient);
  readonly #graphqlUrl = 'http://localhost:4000/graphql';

  /**
   * Fetches all saved teams from the mock GraphQL server.
   */
  getTeams(): Observable<Team[]> {
    const query = `
      query GetTeams {
        teams {
          id
          name
          pokemon_ids
        }
      }
    `;

    return this.#http.post<GraphQLResponse<GetTeamsData>>(this.#graphqlUrl, { query }).pipe(
      map(response => {
        if (response.errors && response.errors.length > 0) {
          throw new Error(response.errors[0].message);
        }

        if (!response.data) {
          throw new Error('Failed to load teams: missing data response from server');
        }

        return response.data.teams.map(t => ({
          id: String(t.id),
          name: t.name,
          pokemonIds: t.pokemon_ids
        }));
      })
    );
  }

  /**
   * Creates a new team via GraphQL mutation.
   */
  createTeam(dto: CreateTeamDto): Observable<Team> {
    const mutation = `
      mutation CreateTeam($name: String!, $pokemon_ids: [Int!]!) {
        createTeam(name: $name, pokemon_ids: $pokemon_ids) {
          id
          name
          pokemon_ids
        }
      }
    `;

    const variables = {
      name: dto.name,
      pokemon_ids: dto.pokemonIds
    };

    return this.#http.post<GraphQLResponse<CreateTeamData>>(this.#graphqlUrl, {
      query: mutation,
      variables
    }).pipe(
      map(response => {
        if (response.errors && response.errors.length > 0) {
          throw new Error(response.errors[0].message);
        }

        if (!response.data || !response.data.createTeam) {
          throw new Error('Failed to create team: no data returned from server');
        }

        const t = response.data.createTeam;
        return {
          id: String(t.id),
          name: t.name,
          pokemonIds: t.pokemon_ids
        };
      })
    );
  }

  /**
   * Deletes a team by its ID via GraphQL mutation.
   */
  deleteTeam(teamId: string): Observable<unknown> {
    const mutation = `
      mutation RemoveTeam($id: ID!) {
        removeTeam(id: $id) {
          id
        }
      }
    `;

    const variables = { id: teamId };

    return this.#http.post<GraphQLResponse<unknown>>(this.#graphqlUrl, {
      query: mutation,
      variables
    }).pipe(
      map(response => {
        if (response.errors && response.errors.length > 0) {
          throw new Error(response.errors[0].message);
        }

        if (!response.data) {
          throw new Error('Failed to delete team: missing data response from server');
        }

        return response.data;
      })
    );
  }
}