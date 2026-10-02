import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, of } from 'rxjs';

import {
  CreateTeamDto,
  Team
} from '../models/team.model';

import { TeamService } from '../services/team.service';

type TeamResourceStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error';

export interface TeamResourceState {
  readonly status: TeamResourceStatus;
  readonly error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TeamStore {
  private readonly teamService =
    inject(TeamService);

  private readonly teamsSubject =
    new BehaviorSubject<readonly Team[]>([]);

  readonly teams$ =
    this.teamsSubject.asObservable();

  private readonly resourceStateSubject =
    new BehaviorSubject<TeamResourceState>({
      status: 'idle',
      error: null
    });

  readonly resourceState$ =
    this.resourceStateSubject.asObservable();

  private readonly mutationErrorSubject =
    new BehaviorSubject<string | null>(null);

  readonly mutationError$ =
    this.mutationErrorSubject.asObservable();

  private readonly mutationSuccessSubject =
    new BehaviorSubject<string | null>(null);

  readonly mutationSuccess$ =
    this.mutationSuccessSubject.asObservable();

  private get currentTeams(): readonly Team[] {
    return this.teamsSubject.value;
  }

  /**
   * Loads all teams from the GraphQL API.
   */
  loadTeams(): void {
    this.resourceStateSubject.next({
      status: 'loading',
      error: null
    });

    this.teamService.getTeams().subscribe({
      next: teams => {
        this.teamsSubject.next(teams);

        this.resourceStateSubject.next({
          status: 'success',
          error: null
        });
      },

      error: error => {
        const message =
          error?.message ??
          'Failed to load teams.';

        this.resourceStateSubject.next({
          status: 'error',
          error: message
        });
      }
    });
  }

  /**
   * Creates a team optimistically.
   *
   * The team is added immediately using a temporary ID.
   * The temporary team is replaced with the server-created
   * team when the API request succeeds.
   *
   * If the API request fails, the previous state is restored.
   */
  createTeam(dto: CreateTeamDto): void {
    const temporaryId = `temp-${Date.now()}`;

    const optimisticTeam: Team = {
      id: temporaryId,
      name: dto.name,
      pokemonIds: dto.pokemonIds ?? []
    };

    const previousTeams =
      this.currentTeams;

    this.teamsSubject.next([
      ...previousTeams,
      optimisticTeam
    ]);

    this.mutationErrorSubject.next(null);
    this.mutationSuccessSubject.next(null);

    this.teamService
      .createTeam(dto)
      .pipe(
        catchError(error => {
          this.teamsSubject.next(
            previousTeams
          );

          const message =
            error?.message ??
            'Failed to create team.';

          this.mutationErrorSubject.next(
            message
          );

          return of(null);
        })
      )
      .subscribe(createdTeam => {
        if (!createdTeam) {
          return;
        }

        const updatedTeams =
          this.currentTeams.map(team =>
            team.id === temporaryId
              ? createdTeam
              : team
          );

        this.teamsSubject.next(
          updatedTeams
        );

        this.mutationErrorSubject.next(null);

        this.mutationSuccessSubject.next(
          `Team "${createdTeam.name}" created successfully.`
        );
      });
  }

  /**
   * Deletes a team optimistically.
   *
   * The team is removed immediately.
   * If the API request fails, the previous state is restored.
   */
  deleteTeam(teamId: string): void {
    const previousTeams =
      this.currentTeams;

    const updatedTeams =
      previousTeams.filter(
        team => team.id !== teamId
      );

    this.teamsSubject.next(
      updatedTeams
    );

    this.mutationErrorSubject.next(null);
    this.mutationSuccessSubject.next(null);

    this.teamService
      .deleteTeam(teamId)
      .pipe(
        catchError(error => {
          this.teamsSubject.next(
            previousTeams
          );

          const message =
            error?.message ??
            'Failed to delete team.';

          this.mutationErrorSubject.next(
            message
          );

          return of(null);
        })
      )
      .subscribe(() => {
        this.mutationSuccessSubject.next(
          'Team deleted successfully.'
        );
      });
  }

  setError(message: string): void {
    this.mutationErrorSubject.next(message);
  }
}