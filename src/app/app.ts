import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ScheduleListComponent } from './schedule-list/schedule-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'horarios-cine';
}
