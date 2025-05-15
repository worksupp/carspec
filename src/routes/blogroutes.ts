import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs';

export default async function blogroutes(app: FastifyInstance) {
    const blogDataPath = path.join(__dirname, '../data/blog-data.json');
    const blogs =JSON.parse(fs.readFileSync(blogDataPath, 'utf-8'));

    app.get('/blog', async (req, reply) => {
        const query = (req.query as any).q?.toLowerCase() || '';
        const category = (req.query as any).category || '';
        const rawPage = (req.query as any).page;
        const page: number = rawPage ? parseInt(rawPage,10) : 1;
        const perPage = 5;

        let filteredBlogs = blogs;

        if (query) {
            filteredBlogs = filteredBlogs.filter((b: any) => 
             b.title.toLowerCase().includes(query) || b.content.toLowerCase().includes(query)
            );
        }
        if (category) {
            filteredBlogs = filteredBlogs.filter((b: any) =>
                b.category?.toLowerCase() === category.toLowerCase()
            );
        }
        const totalPages = Math.ceil(filteredBlogs.length / perPage);
        const paginatedBlogs = filteredBlogs.slice((page - 1) * perPage, page * perPage);
        //mengambil semua kategory/category
        const categories = [...new Set(blogs.map((b: any) => b.category))];

        return reply.view('blog.ejs', { 
            title: 'Blog', 
            blogs: paginatedBlogs, 
            query, 
            category, 
            categories, 
            currentPage: page,
            totalPages
        });
    });
        
        //const filteredBlogs = query 
          //  ? blogs.filter((b: any ) =>
            //b.title.toLowerCase().includes(query) || b.content.toLowerCase().includes(query)
         //)
         //:blogs;


    app.get('/blog/:slug', async (req, reply) => {
        const slug = (req.params as any).slug;
        const query = req.query as any;
        const blogDataPath = path.join(__dirname, '../data/blog-data.json');
        const blogs = JSON.parse(fs.readFileSync(blogDataPath, 'utf-8'));
        const blog = blogs.find((b: any) => b.slug === slug);
        if (!blog) return reply.code(404).send('Artikel tidak ditemukan');

        const related = blogs.filter(
            (b: any) => b.slug !== slug && b.category === blog.category
        ).slice(0, 3);

        //Hubungkan ke dalam blog-ejs dengan menagmbil komentar dari file json supaya terbaca
        const commentsPath = path.join(__dirname, '../data/comments.json');
        const rawComments = fs.readFileSync(commentsPath, 'utf-8');
        const allComments = JSON.parse(rawComments);
        const comments = allComments.filter((c: any) => c.slug === slug);
        
        return reply.view('blog-detail.ejs', { 
            title: blog.title, 
            blog,
            related,
            comments: comments,
            query
         });
    });

    app.post('/blog/:slug/comment', async (req, reply) => {
        const slug = (req.params as any).slug;
        const { name, message } = req.body as any;

        if ( !name || !message ) {
            return reply.code(400).send('Name and message are required.')
        }

        const bannedWords = ['fuck you', 'bitch', 'anjing', 'kontol', 'bangsat', 'goblok', 'asu', 'memek', 'peler', 'pler', 'anyink', 'tai', 'babi'];
        const isProfone = bannedWords.some(word => 
            message.toLowerCase().includes(word)
        );

        if (isProfone) {
            return reply.redirect(`/blog/${slug}?error=1`);
           // return reply.code(400).send('Your message cannot Upload.')
        }

        //load / update comment
        const commentsPath = path.join(__dirname, '../data/comments.json');
        const rawComments = fs.readFileSync(commentsPath, 'utf-8');
        const comments = JSON.parse(rawComments);

        const newComment = {
            slug,
            name,
            message: isProfone
            ? 'Comments get hide to form comments, FUCK YOU BITCH!!!'
            : message,
            date: new Date().toISOString(),
            flagged: isProfone
        };

        comments.push( newComment );
        fs.writeFileSync(commentsPath, JSON.stringify(comments, null, 2));
        
        return reply.redirect(`/blog/${slug}`);
    });
}