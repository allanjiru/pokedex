import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { Team, CreateTeamDto } from '../models/team.model';
import { TeamService } from '../services/team.service';

export type TeamResourceStatus = 'idle' | 'loading' | 'success' | 'error';

export interface TeamResourceState {
  readonly status: TeamResourceStatus;
  readonly error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TeamStore {
  readonly #teamService = inject(TeamService);

  // --- Core State Subjects ---
  readonly #teamsSubject = new BehaviorSubject<Team[]>([]);
  readonly teams$: Observable<Team[]> = this.#teamsSubject.asObservable();

  readonly #resourceStateSubject = new BehaviorSubject<TeamResourceState>({
    status: 'idle',
    error: null
  });
  readonly resourceState$: Observable<TeamResourceState> = this.#resourceStateSubject.asObservable();

  readonly #mutationErrorSubject = new BehaviorSubject<string | null>(null);
  readonly mutationError$: Observable<string | null> = this.#mutationErrorSubject.asObservable();

  // --- Snapshot Getters ---
  get #currentTeams(): Team[] {
    return this.#teamsSubject.value;
  }

  // --- Actions ---

  /**
   * Loads all saved teams from the backend.
   * Keeps existing teams intact if the load request fails.
   */
  loadTeams(): void {
    this.#resourceStateSubject.next({ status: 'loading', error: null });

    this.#teamService.getTeams().pipe(
      tap(teams => {
        this.#teamsSubject.next(teams);
        this.#resourceStateSubject.next({ status: 'success', error: null });
      }),
      catchError(err => {
        const errorMessage = err?.message ?? 'Failed to load teams';
        this.#resourceStateSubject.next({ status: 'error', error: errorMessage });
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Optimistically creates a team using CreateTeamDto.
   * Inserts a temporary local team immediately, replacing it with the server response or rolling back on error.
   */
  createTeam(dto: CreateTeamDto): void {
    const tempId = `temp-${Date.now()}`;
    const optimisticTeam: Team = {
      id: tempId,
      name: dto.name,
      pokemonIds: dto.pokemonIds ?? []
    };

    const previousTeams = this.#currentTeams;
    
    // Optimistic update
    this.#teamsSubject.next([...previousTeams, optimisticTeam]);
    this.#mutationErrorSubject.next(null);

    this.#teamService.createTeam(dto).pipe(
      tap(createdTeam => {
        const updated = this.#currentTeams.map(t => t.id === tempId ? createdTeam : t);
        this.#teamsSubject.next(updated);
        this.#mutationErrorSubject.next(null); // Clear any previous mutation error on success
      }),
      catchError(err => {
        // Rollback on failure
        this.#teamsSubject.next(previousTeams);
        const errorMessage = err?.message ?? 'Failed to create team';
        this.#mutationErrorSubject.next(errorMessage);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Optimistically deletes a team by its string ID.
   * Removes it from local state immediately, restoring previous teams if deletion fails.
   */
  deleteTeam(teamId: string): void {
    const previousTeams = this.#currentTeams;
    const filteredTeams = previousTeams.filter(t => t.id !== teamId);

    // Optimistic update
    this.#teamsSubject.next(filteredTeams);
    this.#mutationErrorSubject.next(null);

    this.#teamService.deleteTeam(teamId).pipe(
      tap(() => {
        this.#mutationErrorSubject.next(null); // Clear any previous mutation error on success
      }),
      catchError(err => {
        // Rollback on failure
        this.#teamsSubject.next(previousTeams);
        const errorMessage = err?.message ?? 'Failed to delete team';
        this.#mutationErrorSubject.next(errorMessage);
        return of(null);
      })
    ).subscribe();
  }
}