import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, of, timer, catchError, map, switchMap } from 'rxjs';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { TeamService } from '../../services/team.service';
import { PokemonAutocompleteComponent } from '../pokemon-autocomplete/pokemon-autocomplete.component';

// Custom validator that evaluates trimmed length to prevent whitespace-only bypasses
export function trimmedLengthValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value ?? '';
    const trimmed = typeof raw === 'string' ? raw.trim() : '';

    if (!trimmed) {
      return { required: true };
    }
    if (trimmed.length < min) {
      return { minlength: { requiredLength: min, actualLength: trimmed.length } };
    }
    if (trimmed.length > max) {
      return { maxlength: { requiredLength: max, actualLength: trimmed.length } };
    }
    return null;
  };
}

@Component({
  selector: 'app-team-tray',
  standalone: true,
  imports: [ReactiveFormsModule, PokemonAutocompleteComponent],
  template: `
    <div class="team-tray">
      <div class="team-tray__main">
        <!-- Left: Team Name Input (Reactive Form) -->
        <div class="team-tray__left">
          <form [formGroup]="teamForm">
            <label class="team-tray__label" for="team-name">Team Name</label>
            <input 
              class="team-tray__name-input" 
              id="team-name" 
              formControlName="name"
              placeholder="e.g. Hyper Offense" 
              type="text" 
            />
            @if (teamNameControl.touched) {
              @if (teamNameControl.pending) {
                <span class="team-tray__error">Checking team name availability...</span>
              } @else if (teamNameControl.invalid) {
                <span class="team-tray__error">
                  @if (teamNameControl.hasError('required') || teamNameControl.hasError('minlength') || teamNameControl.hasError('maxlength')) {
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

        <!-- Center: Dynamic Slots Row with Autocomplete Child -->
        <div class="team-tray__center">
          <app-pokemon-autocomplete (pokemonSelected)="onPokemonSelected($event)" />

          <div class="team-tray__slots">
            <!-- Filled Slots -->
            @for (pokemon of team(); track pokemon.id) {
              <div class="team-slot team-slot--filled">
                <button 
                  class="team-slot__remove-btn" 
                  [title]="'Remove ' + pokemon.name"
                  (click)="onRemove(pokemon)"
                  type="button"
                >
                  <svg fill="none" height="10" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" width="10">
                    <line x1="18" x2="6" y1="6" y2="18"></line>
                    <line x1="6" x2="18" y1="6" y2="18"></line>
                  </svg>
                </button>
                <img [alt]="pokemon.name" class="team-slot__sprite" [src]="pokemon.sprite" />
                <span class="team-slot__name">{{ pokemon.name }}</span>
              </div>
            }

            <!-- Empty Slots -->
            @for (slotIndex of emptySlots(); track slotIndex) {
              <div class="team-slot team-slot--empty">
                <div class="team-slot__empty-icon">
                  <svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" x2="12" y1="8" y2="16"></line>
                    <line x1="8" x2="16" y1="12" y2="12"></line>
                  </svg>
                </div>
                <span class="team-slot__empty-label">Use search to add Pokémon</span>
              </div>
            }
          </div>
        </div>

        <!-- Right: Counter & CTA -->
        <div class="team-tray__right">
          <div class="team-tray__counter">
            <span class="team-tray__counter-current">{{ team().length }}</span> / 6 Slots
          </div>
          <button 
            class="team-tray__create-btn" 
            [disabled]="teamForm.invalid || team().length === 0"
            (click)="onCreateTeam()"
            type="button"
          >
            Create team
          </button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamTrayComponent {
  private readonly fb = inject(FormBuilder);
  private readonly teamService = inject(TeamService);

  // Modern Signal Inputs & Outputs
  readonly team = input<readonly Pokemon[]>([]);
  readonly removePokemon = output<Pokemon>();
  readonly addPokemon = output<Pokemon>();
  readonly createTeam = output<{ name: string; pokemonIds: readonly number[] }>();

  // Service-backed Async Uniqueness Validator using Angular's native execution lifecycle
  private createUniquenessValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = control.value?.trim().toLowerCase() ?? '';

      if (!value) {
        return of(null);
      }

      return timer(300).pipe(
        switchMap(() => this.teamService.teamNameExists(value)),
        map(exists => (exists ? { nameTaken: true } : null)),
        catchError(() => of({ nameCheckFailed: true }))
      );
    };
  }

  // Reactive Form with trim-aware sync validation and debounced async uniqueness check
  readonly teamForm = this.fb.group({
    name: ['', {
      validators: [trimmedLengthValidator(3, 30)],
      asyncValidators: [this.createUniquenessValidator()],
      updateOn: 'change'
    }]
  });

  readonly teamNameControl = this.teamForm.controls.name;

  // Computed empty slots array up to 6
  readonly emptySlots = computed(() => {
    const count = Math.max(0, 6 - this.team().length);
    return Array.from({ length: count }, (_, i) => i);
  });

  onPokemonSelected(pokemon: Pokemon): void {
    if (this.team().length < 6 && !this.team().some(member => member.id === pokemon.id)) {
      this.addPokemon.emit(pokemon);
    }
  }

  onRemove(pokemon: Pokemon): void {
    this.removePokemon.emit(pokemon);
  }

  onCreateTeam(): void {
    if (this.teamForm.valid) {
      const name = this.teamForm.value.name?.trim() ?? '';
      const pokemonIds = this.team().map(p => p.id);
      this.createTeam.emit({ name, pokemonIds });
    }
  }
}