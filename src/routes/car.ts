import { FastifyPluginAsync } from 'fastify';
import { getCarBySlug } from '../services/scraper';

const carRoutes: FastifyPluginAsync = async (app) => {
    app.get('/:slug', async (req, reply) => {
        const { slug } = req.params as { slug: string };
        const carData = await getCarBySlug(slug);

        if (!carData) {
            return reply.code(404).send('Car not found');
        }

        return reply.view('car-detail.ejs', { car: carData });
    });

    app.get('/blog', async (req, reply) => {
        return reply.view('blog.ejs');
    });

    app.get('/contact', async (req, reply) => {
        return reply.view('contact.ejs');
    });
};

export default carRoutes;