import { Component } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { PokedexToolbarComponent } from './pokedex/components/pokedex-toolbar/pokedex-toolbar.component';
import { PokemonTableComponent } from './pokedex/components/pokemon-table/pokemon-table.component';
import { SpecimenPanelComponent } from './pokedex/components/specimen-panel/specimen-panel.component';
import { TeamTrayComponent } from './teams/components/team-tray/team-tray.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { Pokemon, POKEMON } from './pokedex/models/pokemon.model';

@Component({ selector: 'app-root', standalone: true, imports: [HeaderComponent, PokedexToolbarComponent, PokemonTableComponent, SpecimenPanelComponent, TeamTrayComponent, ToastComponent], template: `
  <div class="app-viewport">
    <app-header />
    <main class="app-workspace">
      <section class="app-workspace__catalog">
        <app-pokedex-toolbar [totalResults]="filteredPokemon.length" (searchChanged)="search = $event" (typeChanged)="type = $event" />
        <app-pokemon-table [pokemon]="filteredPokemon" [team]="team" [selected]="selected" (selectedChange)="selectPokemon($event)" (addPokemon)="addToTeam($event)" />
      </section>
      <app-specimen-panel [pokemon]="selected" (close)="selected = null" />
    </main>
    <app-team-tray [team]="team" (removePokemon)="removeFromTeam($event)" (addPokemon)="addToTeam($event)" />
    <app-toast [message]="toastMessage" />
  </div>
` })
export class AppComponent {
  readonly allPokemon = POKEMON;
  search = '';
  type = 'all';
  selected: Pokemon | null = POKEMON[2];
  team: Pokemon[] = [POKEMON[5], POKEMON[8], POKEMON[7]];
  toastMessage = 'Venusaur specimen loaded';

  get filteredPokemon(): Pokemon[] {
    const query = this.search.trim().toLowerCase();
    return this.allPokemon.filter((pokemon) =>
      (!query || pokemon.name.toLowerCase().includes(query) || String(pokemon.id) === query) &&
      (this.type === 'all' || pokemon.types.some((entry) => entry.toLowerCase() === this.type))
    );
  }

  selectPokemon(pokemon: Pokemon): void { this.selected = pokemon; this.toastMessage = `${pokemon.name} specimen loaded`; }
  addToTeam(pokemon: Pokemon): void {
    if (this.team.length < 6 && !this.team.some((member) => member.id === pokemon.id)) {
      this.team = [...this.team, pokemon]; this.toastMessage = `${pokemon.name} added to team`;
    }
  }
  removeFromTeam(pokemon: Pokemon): void { this.team = this.team.filter((member) => member.id !== pokemon.id); this.toastMessage = `${pokemon.name} removed from team`; }
}
