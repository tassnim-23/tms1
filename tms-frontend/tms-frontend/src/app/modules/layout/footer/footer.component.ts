import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer style="background:#1a237e; color:#90caf9; text-align:center; padding:8px; font-size:13px;">
      TMS - Transport Management System &copy; {{ year }} | Spring Boot + Angular
    </footer>
  `
})
export class FooterComponent {
  year = new Date().getFullYear();
}
