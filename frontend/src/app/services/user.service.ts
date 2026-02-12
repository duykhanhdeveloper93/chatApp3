import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserService {

  private api = 'http://103.77.243.178:3000/api/users';

  constructor(private http: HttpClient) {}

  getUsers(page = 1, limit = 10, search = '') {
    return this.http.get<any>(
      `${this.api}?page=${page}&limit=${limit}&search=${search}`
    );
  }

  createUser(data: any) {
    return this.http.post(this.api, data);
  }

  updateUser(id: string, data: any) {
    return this.http.patch(`${this.api}/${id}`, data);
  }

  deleteUser(id: string) {
    return this.http.delete(`${this.api}/${id}`);
  }
}
