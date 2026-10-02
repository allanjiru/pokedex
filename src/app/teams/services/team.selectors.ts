import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Team } from '../models/team.model';
import { TeamStore, TeamResourceState } from '../state/team.store';

@Injectable({
  providedIn: 'root'
})
export class TeamSelectors {
  readonly #store = inject(TeamStore);

  // --- Core Store Streams ---
  readonly teams$: Observable<readonly Team[]> = this.#store.teams$;
  readonly resourceState$: Observable<TeamResourceState> = this.#store.resourceState$;
  readonly mutationError$: Observable<string | null> = this.#store.mutationError$;

  // --- Selection State ---
  readonly #selectedTeamIdSubject = new BehaviorSubject<string | null>(null);
  readonly selectedTeamId$: Observable<string | null> = this.#selectedTeamIdSubject.asObservable();

  /**
   * Sets or clears the active team ID for the team builder module.
   */
  selectTeam(teamId: string | null): void {
    this.#selectedTeamIdSubject.next(teamId);
  }
}