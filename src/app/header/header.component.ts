import { Component } from '@angular/core';

@Component({ selector: 'app-header', standalone: true, template: `
  <header class="header">
    <div class="header__brand">
      <div class="header__logo"><svg class="header__logo-svg" fill="none" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" stroke="var(--color-primary)" stroke-width="2"/><path d="M1 14H9M19 14H27" stroke="var(--color-primary)" stroke-linecap="round" stroke-width="2"/><circle cx="14" cy="14" r="4.5" fill="var(--color-surface)" stroke="var(--color-primary)" stroke-width="2"/><circle cx="14" cy="14" r="2" fill="var(--color-primary)"/></svg></div>
      <span class="header__title">Mini Pokédex</span>
      <nav class="header__nav"><a class="header__nav-link header__nav-link--active" href="#">Pokédex</a><a class="header__nav-link" href="#">Teams</a></nav>
    </div>
  </header>
` })
export class HeaderComponent {}
