import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatResetService {
  private readonly resetSubject =
    new Subject<void>();

  readonly reset$ =
    this.resetSubject.asObservable();

  reset(): void {
    this.resetSubject.next();
  }
}