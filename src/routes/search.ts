import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';

//export default async function searchRoutes(app: FastifyInstance) {
    //const blogPath = path.join(__dirname, '../data/blog-data.json');
    //const carPath = path.join(__dirname, '../data/cars.json');

    //app.get('/search', async (req, reply) => {
    //    const { q } = req.query as { q: string };
    //    const keyword = q?.toLowerCase().trim();

    //    if (!keyword) {
     //       return reply.view('/search-results.ejs', { query: '', blogResults: [], carResults: [] });
    //    }
//
    //    const blogs = JSON.parse(fs.readFileSync(blogPath, 'utf-8'));
    //    const cars = JSON.parse(fs.readFileSync(carPath, 'utf-8'));
//
    //    const blogResults = blogs.filter((b: any) => 
    //        b.title.toLowerCase().includes(keyword) ||
    //        b.content.toLowerCase().includes(keyword)
    //    );
//
    //    const carResults = cars.filter((c: any) =>
    //        c.name.toLowerCase().includes(keyword) ||
    //        (c.brand && c.brand.toLowerCase(). includes(keyword))
    //    );
//
    //    return reply.view('/search-results.ejs', {
    //        query: keyword,
    //        blogResults,
    //        carResults,
    //    });
    //});
//}//

    export default async function searchRoutes(app: FastifyInstance) {
  const carDataPath = path.join(__dirname, '../data/cars.json');

  app.get('/search', async (req, reply) => {
    const query = (req.query as any).q?.toLowerCase() || '';

    // Load data mobil
    let carData = [];
    try {
      const raw = fs.readFileSync(carDataPath, 'utf-8');
      carData = JSON.parse(raw);
    } catch (err) {
      console.error('Gagal baca cars.json:', err);
      return reply.code(500).send('Gagal membaca data mobil');
    }

    // Filter berdasarkan nama, merek, atau kategori
    const results = carData.filter((car: any) => {
        const name = (car.name || '').toLowerCase();
        const brand = (car.brand || '').toLowerCase();
        const category = (car.category || '').toLowerCase();

        return (
            name.includes(query) ||
            brand.includes(query) ||
            category.includes(query) 
        );
    });

    return reply.view('search-results.ejs', {
      title: `Hasil pencarian untuk "${query}"`,
      query,
      results,
    });
  });
}