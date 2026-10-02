import { Component, Input } from '@angular/core';
@Component({ selector: 'app-toast', standalone: true, template: `<div class="toast-container"><div class="toast toast--success"><span class="toast__icon">✓</span><span>{{ message }}</span></div></div>` })
export class ToastComponent { @Input() message = ''; }
