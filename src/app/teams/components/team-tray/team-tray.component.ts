import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon } from '../../../pokedex/models/pokemon.model';

@Component({
  selector: 'app-team-tray',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="team-tray">
      <div class="team-tray__main">
        <!-- Left: Team Name Input -->
        <div class="team-tray__left">
          <label class="team-tray__label" for="team-name">Team Name</label>
          <input class="team-tray__name-input" id="team-name" placeholder="e.g. Hyper Offense" type="text" value="Kanto Squad">
        </div>
        <!-- Center: Slots row with Picker placed underneath -->
        <div class="team-tray__center" style="display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 0;">
          <style>
            .pokemon-picker {
              position: relative;
              max-width: 480px;
              width: 100%;
            }

            .autocomplete-dropdown {
              position: absolute;
              bottom: calc(100% + 8px);
              left: 0;
              width: 100%;
              min-width: 440px;
              max-width: 500px;
              background-color: var(--color-surface-2, #1a1c1c);
              border: 1px solid var(--color-border, #2e3232);
              border-radius: var(--radius-lg, 12px);
              box-shadow: 0 -12px 32px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08);
              z-index: 100;
              display: flex;
              flex-direction: column;
              overflow: hidden;
            }

            .autocomplete-dropdown__header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 10px 14px;
              background-color: var(--color-surface-3, #242727);
              border-bottom: 1px solid var(--color-border, #2e3232);
              font-size: 12px;
              color: var(--color-text-muted);
            }

            .autocomplete-dropdown__header-title {
              font-weight: 600;
              color: var(--color-text);
            }

            .autocomplete-dropdown__header-count {
              font-size: 11px;
              color: var(--color-text-subtle);
            }

            .autocomplete-dropdown__list {
              list-style: none;
              margin: 0;
              padding: 0;
              max-height: 250px;
              overflow-y: auto;
            }

            .autocomplete-dropdown__item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              padding: 8px 14px;
              border-bottom: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06));
              transition: background-color 0.12s ease;
              cursor: pointer;
            }

            .autocomplete-dropdown__item:hover,
            .autocomplete-dropdown__item--focused {
              background-color: var(--color-surface-3, #242727);
            }

            .autocomplete-dropdown__item-info {
              display: flex;
              align-items: center;
              gap: 10px;
              min-width: 0;
              flex: 1;
            }

            .autocomplete-dropdown__sprite {
              width: 36px !important;
              height: 36px !important;
              max-width: 36px !important;
              max-height: 36px !important;
              object-fit: contain !important;
              border-radius: var(--radius-sm, 4px);
              background-color: var(--color-surface, #121414);
              border: 1px solid var(--color-border, #2e3232);
              padding: 2px;
              flex-shrink: 0;
            }

            .autocomplete-dropdown__meta {
              display: flex;
              flex-direction: column;
              gap: 2px;
              min-width: 0;
            }

            .autocomplete-dropdown__name-row {
              display: flex;
              align-items: center;
              gap: 6px;
            }

            .autocomplete-dropdown__name {
              font-size: 13px;
              font-weight: 600;
              color: var(--color-text);
            }

            .autocomplete-dropdown__match {
              background-color: rgba(0, 122, 204, 0.35);
              color: #9fcaff;
              border-radius: 2px;
              padding: 0 2px;
            }

            .autocomplete-dropdown__dex-id {
              font-size: 11px;
              color: var(--color-text-subtle);
            }

            .autocomplete-dropdown__types {
              display: flex;
              gap: 4px;
            }

            .autocomplete-dropdown__types .type-badge {
              padding: 1px 6px;
              font-size: 10px;
            }

            .autocomplete-dropdown__stats {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              gap: 2px;
              flex-shrink: 0;
              margin-left: auto;
              margin-right: 6px;
            }

            .autocomplete-dropdown__bst {
              font-size: 11px;
              font-weight: 700;
              color: var(--color-primary-hover);
            }

            .autocomplete-dropdown__stat-summary {
              font-size: 11px;
              color: var(--color-text-subtle);
            }

            .autocomplete-dropdown__actions {
              flex-shrink: 0;
            }

            .autocomplete-dropdown__footer {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 8px 14px;
              background-color: var(--color-surface, #121414);
              border-top: 1px solid var(--color-border, #2e3232);
              font-size: 11px;
              color: var(--color-text-subtle);
            }

            .autocomplete-dropdown__hints {
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .autocomplete-dropdown__kbd {
              display: inline-block;
              padding: 1px 4px;
              font-size: 10px;
              font-family: inherit;
              line-height: 1;
              color: var(--color-text-muted);
              background-color: var(--color-surface-4, #282a2a);
              border: 1px solid var(--color-border, #2e3232);
              border-radius: 3px;
              margin: 0 2px;
            }
          </style>
          <div class="pokemon-picker" style="max-width: 480px; width: 100%; position: relative;">
            <!-- <app-autocomplete-dropdown> -->
            <div aria-label="Pokémon Search Suggestions" class="autocomplete-dropdown" id="autocomplete-popover">
              <div class="autocomplete-dropdown__header">
                <span class="autocomplete-dropdown__header-title">Search results</span>
                <span class="autocomplete-dropdown__header-count">4 matches for "Char"</span>
              </div>
              <ul aria-activedescendant="option-charmeleon" aria-label="Suggestions" class="autocomplete-dropdown__list" role="listbox">
                <!-- Result 1: Charmander -->
                <li aria-selected="false" class="autocomplete-dropdown__item" id="option-charmander" role="option">
                  <div class="autocomplete-dropdown__item-info">
                    <img alt="Charmander" class="autocomplete-dropdown__sprite" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxxptjvY_ToH2w4OdPaQPSk9oNKG1s0Mo1iV3uIAwJsFDNyqCf0820xrx-rvYlaSwtFckDSuKiODKQgfgoewQyAPg-2cN39vJwUS4fBB_DdLFbMq5cInHSF3iQOfRLtSKV8weh7XCtoOGHIcfisn95Cuz8pc_hJ4BW62ixUTg3VbszW6Rifsq1vKQ4mCJyTZI0wQ8Y4IFcaIMX_-v6KVWOQJXaKkjjU63P9xYKOjTMQcfzWTPnmCcA">
                    <div class="autocomplete-dropdown__meta">
                      <div class="autocomplete-dropdown__name-row">
                        <span class="autocomplete-dropdown__name">
                          <mark class="autocomplete-dropdown__match">Char</mark>mander </span>
                        <span class="autocomplete-dropdown__dex-id">#004</span>
                      </div>
                      <div class="autocomplete-dropdown__types">
                        <span class="type-badge type-badge--fire">Fire</span>
                      </div>
                    </div>
                  </div>
                  <div class="autocomplete-dropdown__stats">
                    <span class="autocomplete-dropdown__bst">BST 309</span>
                  </div>
                  <div class="autocomplete-dropdown__actions">
                    <button class="pokemon-table__add-btn" type="button">+ Add</button>
                  </div>
                </li>
                <!-- Result 2: Charmeleon (Active Keyboard Focus) -->
                <li aria-selected="true" class="autocomplete-dropdown__item autocomplete-dropdown__item--selected autocomplete-dropdown__item--focused" id="option-charmeleon" role="option">
                  <div class="autocomplete-dropdown__item-info">
                    <img alt="Charmeleon" class="autocomplete-dropdown__sprite" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfkqR-k_BcUCn_egIy18fuXJG15BVe4Att4u48H9UF1eZFUYvWDVgTRyrkRxLFJAutke9PhBPYy56IAC1Q8_W10YURzv31RxzkY1xcgWgP-C-5tzyP1JL-2ZppWUMAycdd5BUhQMF-cBonC9dygDDqUz9sk79zmcuXqE44YBupmF-oNd3ORSE_d20GAsHf-U2cevhlWhtTmYAlOI1Kj6yVqGs1TvHc3f05ql_IBmq9aspAcxryMt-P">
                    <div class="autocomplete-dropdown__meta">
                      <div class="autocomplete-dropdown__name-row">
                        <span class="autocomplete-dropdown__name">
                          <mark class="autocomplete-dropdown__match">Char</mark>meleon </span>
                        <span class="autocomplete-dropdown__dex-id">#005</span>
                      </div>
                      <div class="autocomplete-dropdown__types">
                        <span class="type-badge type-badge--fire">Fire</span>
                      </div>
                    </div>
                  </div>
                  <div class="autocomplete-dropdown__stats">
                    <span class="autocomplete-dropdown__bst">BST 405</span>
                  </div>
                  <div class="autocomplete-dropdown__actions">
                    <button class="pokemon-table__add-btn" style="background-color: var(--color-primary); border-color: var(--color-primary); color: var(--color-on-primary);" type="button">+ Add</button>
                  </div>
                </li>
                <!-- Result 3: Charizard (Already in Team) -->
                <li aria-selected="false" class="autocomplete-dropdown__item" id="option-charizard" role="option">
                  <div class="autocomplete-dropdown__item-info">
                    <img alt="Charizard" class="autocomplete-dropdown__sprite" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCziFFT2xUzvz5wKmIpRhQA04Qc9CeVnoT6dqNh902EVgP7uqD547fSuKfrPcE2EOlFy0eS4MDobTXly9K1fTe4oZBrIM4IRVj7gX1qw5L1oH5Z77UjQj9tJtSHRl1MzUhqz-URZkWEC4V2DW06ZsIV3BuA7eREFYF8URceHCpzd7y2Qe8RpoxaJryxCSQ3WjjrC0Y_LaSvKlaLC2Dujjn5CR7Sf5hLrCN6-b6TAOZrRdtZumE5NZNK">
                    <div class="autocomplete-dropdown__meta">
                      <div class="autocomplete-dropdown__name-row">
                        <span class="autocomplete-dropdown__name">
                          <mark class="autocomplete-dropdown__match">Char</mark>izard </span>
                        <span class="autocomplete-dropdown__dex-id">#006</span>
                      </div>
                      <div class="autocomplete-dropdown__types">
                        <span class="type-badge type-badge--fire">Fire</span>
                        <span class="type-badge type-badge--flying">Flying</span>
                      </div>
                    </div>
                  </div>
                  <div class="autocomplete-dropdown__stats">
                    <span class="autocomplete-dropdown__bst">BST 534</span>
                  </div>
                  <div class="autocomplete-dropdown__actions">
                    <button aria-disabled="true" class="pokemon-table__add-btn pokemon-table__add-btn--in-team" disabled="" type="button">In team</button>
                  </div>
                </li>
                <!-- Result 4: Charjabug -->
                <li aria-selected="false" class="autocomplete-dropdown__item" id="option-charjabug" role="option">
                  <div class="autocomplete-dropdown__item-info">
                    <img alt="Charjabug" class="autocomplete-dropdown__sprite" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtJQzLCIyKKARxsKpbex5_EJRHuz5DmnOWHLpTq0xYt2IReJgcVVSX4_1oCrsKhDaBNooCN9ViV_g4qWXx3wbB65xojpbcxKSI3a7h6X3AxIHEKrh507fJKsXlQnBFs1F656zAApRwRhxe9eoNfDoqo2Y6jiKAqnbA6WA5QIXfrpz46FpQbpgQLMTtcTmm-lMSqPO4GlZzqGsx6788JabU5QdeJiA-NjMfJ6D-YhtfnfWbp5G-Mc1N">
                    <div class="autocomplete-dropdown__meta">
                      <div class="autocomplete-dropdown__name-row">
                        <span class="autocomplete-dropdown__name">
                          <mark class="autocomplete-dropdown__match">Char</mark>jabug </span>
                        <span class="autocomplete-dropdown__dex-id">#737</span>
                      </div>
                      <div class="autocomplete-dropdown__types">
                        <span class="type-badge type-badge--bug">Bug</span>
                        <span class="type-badge type-badge--electric">Electric</span>
                      </div>
                    </div>
                  </div>
                  <div class="autocomplete-dropdown__stats">
                    <span class="autocomplete-dropdown__bst">BST 400</span>
                  </div>
                  <div class="autocomplete-dropdown__actions">
                    <button class="pokemon-table__add-btn" type="button">+ Add</button>
                  </div>
                </li>
              </ul>
              <div class="autocomplete-dropdown__footer">
                <div class="autocomplete-dropdown__hints">
                  <span class="">
                    <kbd class="autocomplete-dropdown__kbd">↑</kbd>
                    <kbd class="autocomplete-dropdown__kbd">↓</kbd> to navigate </span>
                  <span class="">
                    <kbd class="autocomplete-dropdown__kbd">↵</kbd> to add </span>
                  <span class="">
                    <kbd class="autocomplete-dropdown__kbd">Esc</kbd> to dismiss </span>
                </div>
              </div>
            </div>
            <!-- </app-autocomplete-dropdown> -->
            <div class="pokemon-picker__input-box">
              <span class="pokemon-picker__icon" style="color: var(--color-primary);">
                <svg fill="none" height="13" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="13">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
                </svg>
              </span>
              <input aria-autocomplete="list" aria-controls="autocomplete-popover" aria-expanded="true" class="pokemon-picker__input" id="tray-search-input" placeholder="Add Pokémon to team by name or ID..." style="border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-glow);" type="text" value="Char">
            </div>
          </div>
          <div class="team-tray__slots">
            <!-- Slot 1 - Pikachu -->
            <div class="team-slot team-slot--filled">
              <button class="team-slot__remove-btn" title="Remove Pikachu">
                <svg fill="none" height="10" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" width="10">
                  <line x1="18" x2="6" y1="6" y2="18"></line>
                  <line x1="6" x2="18" y1="6" y2="18"></line>
                </svg>
              </button>
              <img alt="Pikachu" class="team-slot__sprite" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdqeEqMBNcMoQEME4OeTGw5ONamga0ujrSmha19tzSQbuDZ-8dOaK0fo7PhBs8zzmHTcu65tV3aohhyHYZxYibam9Ri5ySprJfgsfL02MxAaOQwLaNLvoIkcQag-9o-m08qvxRSN3SVWu2cnGGXslGDW5CT417j83AASWSl5Gl0dHsgsE0nZwNO9nEaEp2ju2pSpWmiD7MaGG3SP9-btOP2A-px2K8Y3QgBB4gDXsO_qkTHXJqTiAT">
              <span class="team-slot__name">Pikachu</span>
            </div>
            <!-- Slot 2 - Charizard -->
            <div class="team-slot team-slot--filled">
              <button class="team-slot__remove-btn" title="Remove Charizard">
                <svg fill="none" height="10" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" width="10">
                  <line x1="18" x2="6" y1="6" y2="18"></line>
                  <line x1="6" x2="18" y1="6" y2="18"></line>
                </svg>
              </button>
              <img alt="Charizard" class="team-slot__sprite" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAspxIma1HRJBg21viUypBvh8i7EzsIjzBLCRxMaewTAAfzqqcy2q7qCc65vsBd_pZ9RHhssk3u5ELHa6FwTMr43_rYui1V11t2WALOUrQfM5cJdIAbETQLiAkZcuwWGICEl_uTpRBy5IA_1fF8ihrH7UKUtZKIaLUqACRKrFtgqw2IWJhcVR57oXNrwr85sG6Do3JcvHjequgcyFBc22KkcqDKu9g6Cc3d9jLMOYwE_CHmppnOBuEJ">
              <span class="team-slot__name">Charizard</span>
            </div>
            <!-- Slot 3 - Blastoise -->
            <div class="team-slot team-slot--filled">
              <button class="team-slot__remove-btn" title="Remove Blastoise">
                <svg fill="none" height="10" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" width="10">
                  <line x1="18" x2="6" y1="6" y2="18"></line>
                  <line x1="6" x2="18" y1="6" y2="18"></line>
                </svg>
              </button>
              <img alt="Blastoise" class="team-slot__sprite" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfeqiXnihfMAAJYE9dFiHqhbNkd_ZTO8ROdoDVuLFWiPawsah790WaTw--4dcvs5sZpPpZ2Pkzodcd9HQrLtBebFaxjZ_jHqFVTax18OAx8hBmPV9KYwdkR1nUEQBL24mWFtzA5q97oM6OjD2P0ZlPh3VtXf_KtQQD0OkdJG79InGHlro72Ae9ZJt7JnnEAGtx-8h5U2fniqHYpHalypjdACa9dVXkrW28aRIb83DJ_JOrAHtdxYnU">
              <span class="team-slot__name">Blastoise</span>
            </div>
            <!-- Slot 4 - Empty -->
            <div class="team-slot team-slot--empty" style="width: 104px; padding: 4px;">
              <div class="team-slot__empty-icon">
                <svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" x2="12" y1="8" y2="16"></line>
                  <line x1="8" x2="16" y1="12" y2="12"></line>
                </svg>
              </div>
              <span class="team-slot__empty-label">Drag a Pokémon here or use search</span>
            </div>
            <!-- Slot 5 - Empty -->
            <div class="team-slot team-slot--empty" style="width: 104px; padding: 4px;">
              <div class="team-slot__empty-icon">
                <svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" x2="12" y1="8" y2="16"></line>
                  <line x1="8" x2="16" y1="12" y2="12"></line>
                </svg>
              </div>
              <span class="team-slot__empty-label">Drag a Pokémon here or use search</span>
            </div>
            <!-- Slot 6 - Empty -->
            <div class="team-slot team-slot--empty" style="width: 104px; padding: 4px;">
              <div class="team-slot__empty-icon">
                <svg fill="none" height="16" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" x2="12" y1="8" y2="16"></line>
                  <line x1="8" x2="16" y1="12" y2="12"></line>
                </svg>
              </div>
              <span class="team-slot__empty-label">Drag a Pokémon here or use search</span>
            </div>
          </div>
        </div>
        <!-- Right: Counter & CTA -->
        <div class="team-tray__right">
          <div class="team-tray__counter">
            <span class="team-tray__counter-current">3</span> / 6 Slots
          </div>
          <button class="team-tray__create-btn">Create team</button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamTrayComponent {
  @Input() team: readonly Pokemon[] = [];
  @Output() readonly removePokemon = new EventEmitter<Pokemon>();
  @Output() readonly addPokemon = new EventEmitter<Pokemon>();

  teamName = 'Kanto Squad';
  created = false;

  get emptySlots(): readonly number[] {
    return Array.from({
      length: 6 - this.team.length
    }, (_, index) => index);
  }

  search(query: string): void {
    const id = Number(query);
    if (id > 0) {
      this.addPokemon.emit({
        id,
        name: query,
        types: [],
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
        stats: {
          hp: 0,
          attack: 0,
          defense: 0,
          specialAttack: 0,
          specialDefense: 0,
          speed: 0
        }
      });
    }
  }
}