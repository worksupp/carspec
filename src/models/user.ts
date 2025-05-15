// src/models/user.ts
export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // Dalam praktik sebenarnya, ini akan berupa hash, bukan plaintext
  createdAt: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  isAdmin?: boolean; // Tambahkan field ini
}