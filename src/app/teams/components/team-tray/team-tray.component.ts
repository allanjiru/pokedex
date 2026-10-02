import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal
} from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import {
  Observable,
  catchError,
  map,
  of,
  switchMap,
  timer
} from 'rxjs';

import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { TeamService } from '../../services/team.service';
import { PokemonAutocompleteComponent } from '../pokemon-autocomplete/pokemon-autocomplete.component';

export function trimmedLengthValidator(
  min: number,
  max: number
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value ?? '';
    const trimmed = typeof raw === 'string' ? raw.trim() : '';

    if (!trimmed) {
      return { required: true };
    }

    if (trimmed.length < min) {
      return {
        minlength: {
          requiredLength: min,
          actualLength: trimmed.length
        }
      };
    }

    if (trimmed.length > max) {
      return {
        maxlength: {
          requiredLength: max,
          actualLength: trimmed.length
        }
      };
    }

    return null;
  };
}

@Component({
  selector: 'app-team-tray',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PokemonAutocompleteComponent
  ],
  template: `
    <div class="team-tray">
      <div class="team-tray__main">

        <!-- Team name -->
        <div class="team-tray__left">
          <form [formGroup]="teamForm">
            <label class="team-tray__label"
              for="team-name"
            >
              Team Name
            </label>

            <input
              class="team-tray__name-input"
              id="team-name"
              formControlName="name"
              placeholder="e.g. Hyper Offense"
              type="text"
            />

            @if (teamNameControl.touched) {
              @if (teamNameControl.pending) {
                <span class="team-tray__error">
                  Checking team name availability...
                </span>
              } @else if (teamNameControl.invalid) {
                <span class="team-tray__error">
                  @if (
                    teamNameControl.hasError('required') ||
                    teamNameControl.hasError('minlength') ||
                    teamNameControl.hasError('maxlength')
                  ) {
                    Team name must be between 3 and 30 characters.
                  } @else if (teamNameControl.hasError('nameTaken')) {
                    This team name is already taken.
                  } @else if (teamNameControl.hasError('nameCheckFailed')) {
                    Couldn't verify team name availability. Try again.
                  }
                </span>
              }
            }
          </form>
        </div>

        <!-- Pokémon picker + selected slots -->
        <div class="team-tray__center">

          <app-pokemon-autocomplete
            (pokemonSelected)="onPokemonSelected($event)"
            [selectedPokemon]="selectedPokemon()"
          />

          <div class="team-tray__slots">

            <!-- Selected Pokémon -->
            @for (
              pokemon of selectedPokemon();
              track pokemon.id
            ) {
              <div class="team-slot team-slot--filled">

                <button
                  class="team-slot__remove-btn"
                  [title]="'Remove ' + pokemon.name"
                  type="button"
                  (click)="onRemove(pokemon)"
                >
                  <svg
                    fill="none"
                    height="10"
                    stroke="currentColor"
                    stroke-width="2.5"
                    viewBox="0 0 24 24"
                    width="10"
                  >
                    <line
                      x1="18"
                      x2="6"
                      y1="6"
                      y2="18"
                    />
                    <line
                      x1="6"
                      x2="18"
                      y1="6"
                      y2="18"
                    />
                  </svg>
                </button>

                <img
                  [alt]="pokemon.name"
                  class="team-slot__sprite"
                  [src]="pokemon.sprite"
                />

                <span class="team-slot__name">
                  {{ pokemon.name }}
                </span>

              </div>
            }

            <!-- Empty Pokémon slots -->
            @for (
              slotIndex of emptySlots();
              track slotIndex
            ) {
              <div class="team-slot team-slot--empty">
                <div class="team-slot__empty-icon">
                  <svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" x2="12" y1="8" y2="16"/>
                    <line x1="8" x2="16" y1="12" y2="12"/>
                  </svg>
                </div>

                <span class="team-slot__empty-label">
                  Use search to add Pokémon
                </span>
              </div>
            }

          </div>

        </div>

        <!-- Counter + create -->
        <div class="team-tray__right">

          <div class="team-tray__counter">
            <span class="team-tray__counter-current">
              {{ selectedPokemon().length }}
            </span>
            / 6 Slots
          </div>

          <button
            class="team-tray__create-btn"
            type="button"
            (click)="onCreateTeam()"
          >
            Create team
          </button>

          @if (errorSubmit() !== '') {
            <span class="team-tray__error">
              {{ errorSubmit() }}
            </span>
          }

        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamTrayComponent {
  private readonly fb = inject(FormBuilder);
  private readonly teamService = inject(TeamService);

  /**
   * Pokémon currently selected while building the team.
   */
  readonly selectedPokemon = signal<Pokemon[]>([]);

  /**
   * Emits the completed team to the parent.
   */
  readonly createTeam = output<{
    name: string;
    pokemonIds: readonly number[];
  }>();

  /**
   * Tracks whether the user has attempted to submit
   * without selecting any Pokémon.
   */
  readonly submitAttempted = signal(false);
  readonly errorSubmit = signal('');

  private createUniquenessValidator(): AsyncValidatorFn {
    return (
      control: AbstractControl
    ): Observable<ValidationErrors | null> => {
      const value =
        control.value?.trim().toLowerCase() ?? '';

      if (!value) {
        return of(null);
      }

      return timer(300).pipe(
        switchMap(() =>
          this.teamService.teamNameExists(value)
        ),
        map(exists =>
          exists
            ? { nameTaken: true }
            : null
        ),
        catchError(() =>
          of({
            nameCheckFailed: true
          })
        )
      );
    };
  }

  readonly teamForm = this.fb.group({
    name: [
      '',
      {
        validators: [
          trimmedLengthValidator(3, 30)
        ],
        asyncValidators: [
          this.createUniquenessValidator()
        ],
        updateOn: 'change'
      }
    ]
  });

  readonly teamNameControl =
    this.teamForm.controls.name;

  /**
   * Calculates the number of remaining empty slots.
   */
  readonly emptySlots = computed(() => {
    const remaining =
      6 - this.selectedPokemon().length;

    return Array.from(
      {
        length: Math.max(0, remaining)
      },
      (_, index) => index
    );
  });

  /**
   * Adds a Pokémon selected from the autocomplete.
   *
   * Prevents duplicate Pokémon and prevents the team
   * from exceeding six Pokémon.
   */
  onPokemonSelected(pokemon: Pokemon): void {
    const currentTeam =
      this.selectedPokemon();

    if (currentTeam.length >= 6) {
      return;
    }

    const alreadySelected =
      currentTeam.some(
        member => member.id === pokemon.id
      );

    if (alreadySelected) {
      return;
    }

    this.selectedPokemon.set([
      ...currentTeam,
      pokemon
    ]);

    this.submitAttempted.set(false);
  }

  /**
   * Removes a Pokémon from the current team.
   */
  onRemove(pokemon: Pokemon): void {
    this.selectedPokemon.update(
      currentTeam =>
        currentTeam.filter(
          member => member.id !== pokemon.id
        )
    );
  }

  /**
   * Validates and emits the completed team.
   */
  onCreateTeam(): void {
    this.submitAttempted.set(true);
    this.errorSubmit.set('');

    const name =
      this.teamNameControl.value?.trim() ?? '';

    const pokemon =
      this.selectedPokemon();

    this.teamNameControl.markAsTouched();

    if (!name) {
      this.errorSubmit.set(
        'Team name is required.'
      );
      return;
    }

    if (pokemon.length < 1) {
      this.errorSubmit.set(
        'A team must have at least one Pokémon.'
      );
      return;
    }

    if (pokemon.length > 6) {
      this.errorSubmit.set(
        'A team can have at most six Pokémon.'
      );
      return;
    }

    if (this.teamNameControl.pending) {
      this.errorSubmit.set(
        'Please wait while the team name is being checked.'
      );
      return;
    }

    if (this.teamNameControl.invalid) {
      this.errorSubmit.set(
        'Please enter a valid team name.'
      );
      return;
    }

    this.createTeam.emit({
      name,
      pokemonIds: pokemon.map(
        member => member.id
      )
    });
  }
}