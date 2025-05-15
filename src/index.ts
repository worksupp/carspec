import Fastify from 'fastify';
import path from 'path';
import formbody from '@fastify/formbody';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import ejs from 'ejs';
import fs from 'fs/promises';
import carRoutes from './routes/car';
import blogRoutes from './routes/blogroutes';
import adminRoutes from './routes/adminroutes';
import authRoutes from './routes/authRoutes'; // Tambahkan ini
import searchRoutes from './routes/search';
import fastifyMultipart from '@fastify/multipart';
import fastifyCookie from '@fastify/cookie'; // Tambahkan ini
import fastifySession from '@fastify/session'; // Tambahkan ini

const app = Fastify({ logger: true });

// Daftarkan cookie dan session
app.register(fastifyCookie);
app.register(fastifySession, {
  cookieName: 'sessionId',
  secret: 'ini-adalah-secret-key-yang-harusnya-sangat-aman-dan-panjang', // Gunakan environment variable di production
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 hari
  }
});

//import multipart form gambar
app.register(fastifyMultipart);

//app.register('/admin');
app.register(adminRoutes);

// Daftarkan auth routes
app.register(authRoutes);

//routes search engine
app.register(searchRoutes);

//import data comments
app.register(formbody);

// Serve static files (CSS, images, ads, etc.)
app.register(fastifyStatic, {
    root: path.join(__dirname, '..', '/public'),
    prefix: '/',
});

// Set up view engine (EJS)
app.register(fastifyView, {
    engine: { ejs },
    root: path.join(__dirname, 'views'),
});

// Register car routes
app.register(carRoutes, { prefix: '/car' });

app.register(blogRoutes);

// Home route with car list
app.get('/', async (req, reply) => {
    try {
        const filePath = path.join(__dirname, 'data', 'cars.json');
        const data = await fs.readFile(filePath, 'utf-8');
        const cars = JSON.parse(data);

        // Tambahkan user dari session ke view data jika tersedia
        const user = (req.session as any).user || null;

        return reply.view('home.ejs', { 
            title: 'Car Specs Home',
            popularCars: cars.slice(0, 6), // ambil 6 mobil pertama sebagai contoh
            user // Tambahkan user ke view data
        });
    } catch (error) {
        req.log.error('Failed to load car data:', error);
        return reply.view('home.ejs', { 
            title: 'Car Specs Home', 
            popularCars: [],
            user: null
        });
    }
});

app.get('/contact', async (req, reply) => {
    return reply.view('contact.ejs');
});

app.get('/privacy-policy', async (req, reply) => {
    return reply.view('privacy-policy.ejs');
});

// Start server
app.listen({ port: 3001 }, (err) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    console.log('Server listening on http://localhost:3001');
});
