import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-page.html',
  styleUrls: ['./users-page.scss']
})
export class UsersPageComponent implements OnInit {

  users: any[] = [];
  meta: any = {};
  page = 1;
  limit = 5;
  search = '';

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers(this.page, this.limit, this.search)
      .subscribe(res => {
        this.users = res.data;
        this.meta = res.meta;
      });
  }

  delete(id: string) {
    if (!confirm('Xóa user?')) return;

    this.userService.deleteUser(id).subscribe(() => {
      this.loadUsers();
    });
  }

  // ===== PAGINATION LOGIC =====

  get totalPages(): number {
    return this.meta?.totalPages || 0;
  }

  get startEntry(): number {
    if (!this.meta?.total) return 0;
    return (this.page - 1) * this.limit + 1;
  }

  get endEntry(): number {
    const end = this.page * this.limit;
    return end > this.meta?.total ? this.meta?.total : end;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadUsers();
  }
}
