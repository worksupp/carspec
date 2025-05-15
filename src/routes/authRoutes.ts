// src/routes/authroutes.ts
import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

async function authRoutes(fastify: FastifyInstance) {
  const filePath = path.join(__dirname, '..', 'data', 'users.json');

  // Tampilkan halaman login
  fastify.get('/login', async (request, reply) => {
    return reply.view('auth/login.ejs', { error: null });
  });

  // Tampilkan halaman register
  fastify.get('/register', async (request, reply) => {
    return reply.view('auth/register.ejs', { error: null });
  });

  // Handle form register
  fastify.post('/register', async (request, reply) => {
    const { username, email, password, confirmPassword } = request.body as any;

    // Validasi input
    if (!username || !email || !password || !confirmPassword) {
      return reply.view('auth/register.ejs', { error: 'Semua field harus diisi' });
    }

    if (password !== confirmPassword) {
      return reply.view('auth/register.ejs', { error: 'Password tidak cocok' });
    }

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const users: User[] = JSON.parse(data);

      // Cek apakah username atau email sudah digunakan
      const existingUser = users.find(
        (user) => user.username === username || user.email === email
      );

      if (existingUser) {
        return reply.view('auth/register.ejs', { error: 'Username atau email sudah digunakan' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Buat user baru
      const newUser: User = {
        id: uuidv4(),
        username,
        email,
        password: hashedPassword,
        createdAt: new Date(),
      };

      users.push(newUser);
      await fs.writeFile(filePath, JSON.stringify(users, null, 2));

      return reply.redirect('/login');
    } catch (error) {
      console.error('Error registering user:', error);
      return reply.view('auth/register.ejs', { error: 'Terjadi kesalahan saat mendaftar' });
    }
  });

  // Handle form login
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body as any;

    if (!email || !password) {
      return reply.view('auth/login.ejs', { error: 'Email dan password harus diisi' });
    }

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const users: User[] = JSON.parse(data);

      const user = users.find((user) => user.email === email);
      if (!user) {
        return reply.view('auth/login.ejs', { error: 'Email atau password salah' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return reply.view('auth/login.ejs', { error: 'Email atau password salah' });
      }

      const session = request.session as any;
      session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
      };

      return reply.redirect('/');
    } catch (error) {
      console.error('Error logging in:', error);
      return reply.view('auth/login.ejs', { error: 'Terjadi kesalahan saat login' });
    }
  });

  // Logout
  fastify.get('/logout', async (request, reply) => {
    request.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      return reply.redirect('/');
    });
  });
}

export default authRoutes;
