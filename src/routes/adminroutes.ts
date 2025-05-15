import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';

export default async function adminRoutes(app: FastifyInstance) {
  // Mendapatkan path root project
  const rootDir = path.resolve(process.cwd());
  const blogDataPath = path.join(__dirname, '../data/blog-data.json');
  const publicUploadsPath = path.join(rootDir, 'public', 'uploads');
  
  console.log('Path upload yang digunakan:', publicUploadsPath); // Log untuk debugging
  const pump = promisify(pipeline);

  // ============================
  // FORM TAMBAH BLOG
  // ============================
  app.get('/admin/blog/new', async (req, reply) => {
    return reply.view('/admin/admin-new-blog.ejs', { title: 'Tambah Blog Baru' });
  });

  // ============================
  // PROSES TAMBAH BLOG DENGAN GAMBAR
  // ============================
  app.post('/admin/blog/new', async (req, reply) => {
    const parts = req.parts();
    let title = '', content = '', category = '', image = '';

    for await (const part of parts) {
      if (part.type === 'file' && part.filename) {
        // Menggunakan path absolut untuk upload
        if (!fs.existsSync(publicUploadsPath)) {
          fs.mkdirSync(publicUploadsPath, { recursive: true });
          console.log('Direktori dibuat:', publicUploadsPath);
        }

        const filePath = path.join(publicUploadsPath, part.filename);
        console.log('File akan disimpan di:', filePath);
        await pump(part.file, fs.createWriteStream(filePath));

        image = '/uploads/' + part.filename; // disesuaikan agar bisa diakses di browser
      } else if (part.type === 'field') {
        if (part.fieldname === 'title') title = part.value as string;
        if (part.fieldname === 'content') content = part.value as string;
        if (part.fieldname === 'category') category = part.value as string;
      }
    }

    if (!title || !content) {
      return reply.code(400).send('Judul dan konten wajib diisi.');
    }

    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    const date = new Date().toISOString();

    const rawData = fs.readFileSync(blogDataPath, 'utf-8');
    const blogs = JSON.parse(rawData);

    const newBlog = { title, slug, content, category, image, date };
    blogs.unshift(newBlog);

    fs.writeFileSync(blogDataPath, JSON.stringify(blogs, null, 2));
    return reply.redirect(`/blog/${slug}`);
  });

  // ============================
  // DAFTAR BLOG UNTUK ADMIN
  // ============================
  app.get('/admin/blog', async (req, reply) => {
    const rawData = fs.readFileSync(blogDataPath, 'utf-8');
    const blogs = JSON.parse(rawData);

    return reply.view('/admin/admin-list-blog.ejs', {
      title: 'Daftar Blog',
      blogs,
    });
  });

  // ============================
  // FORM EDIT BLOG
  // ============================
  app.get('/admin/blog/edit/:slug', (req, reply) => {
    const { slug } = req.params as any;
    const rawData = fs.readFileSync(blogDataPath, 'utf-8');
    const blogs = JSON.parse(rawData);
    const blog = blogs.find((b: any) => b.slug === slug);

    if (!blog) return reply.code(404).send('Blog tidak ditemukan');
    return reply.view('/admin/admin-edit-blog.ejs', { blog });
  });

  // ============================
  // PROSES EDIT BLOG
  // ============================
  app.post('/admin/blog/edit/:slug', async (req, reply) => {
    const { slug } = req.params as any;
    const parts = req.parts();

    let title = '', content = '', category = '', newImage = '';
    let uploadNewImage = false;

    for await (const part of parts) {
      if (part.type === 'file' && part.filename) {
        // Menggunakan path absolut untuk upload di fungsi edit
        if (!fs.existsSync(publicUploadsPath)) {
          fs.mkdirSync(publicUploadsPath, { recursive: true });
          console.log('Direktori dibuat (edit):', publicUploadsPath);
        }

        const filePath = path.join(publicUploadsPath, part.filename);
        console.log('File akan disimpan di (edit):', filePath);
        await pump(part.file, fs.createWriteStream(filePath));

        newImage = '/uploads/' + part.filename;
        uploadNewImage = true;
      } else if (part.type === 'field') {
        if (part.fieldname === 'title') title = part.value as string;
        if (part.fieldname === 'content') content = part.value as string;
        if (part.fieldname === 'category') category = part.value as string;
      }
    }

    if (!title || !content) {
      return reply.code(400).send('Judul dan konten wajib diisi.');
    }

    const rawData = fs.readFileSync(blogDataPath, 'utf-8');
    const blogs = JSON.parse(rawData);
    const index = blogs.findIndex((b: any) => b.slug === slug);
    if (index === -1) return reply.code(404).send('Blog tidak ditemukan');

    const updatedSlug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

    blogs[index] = {
      ...blogs[index],
      title,
      content,
      category,
      slug: updatedSlug,
      image: uploadNewImage ? newImage : blogs[index].image,
    };

    fs.writeFileSync(blogDataPath, JSON.stringify(blogs, null, 2));
    return reply.redirect('/admin/blog');
  });

  // ============================
  // HAPUS BLOG
  // ============================
  app.get('/admin/blog/delete/:slug', async (req, reply) => {
    const { slug } = req.params as any;
    const rawData = fs.readFileSync(blogDataPath, 'utf-8') || '[]';
    let blogs = JSON.parse(rawData);

    blogs = blogs.filter((b: any) => b.slug !== slug);
    fs.writeFileSync(blogDataPath, JSON.stringify(blogs, null, 2));

    return reply.redirect('/admin/blog');
  });
}