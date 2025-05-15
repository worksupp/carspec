// src/middleware/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';

export async function isAuthenticated(request: FastifyRequest, reply: FastifyReply) {
  const session = request.session as any;
  
  if (!session.user) {
    return reply.redirect('/login');
  }
}

export async function isAdmin(request: FastifyRequest, reply: FastifyReply) {
  const session = request.session as any;
  
  if (!session.user || !session.user.isAdmin) {
    return reply.redirect('/');
  }
}