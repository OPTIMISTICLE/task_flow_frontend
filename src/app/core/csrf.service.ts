import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CsrfService {
  private readonly http = inject(HttpClient);

  refresh(): Observable<void> {
    return this.http.get<{ headerName: string }>('/api/auth/csrf').pipe(map(() => undefined));
  }
}
