import fs from 'fs/promises';
import path from 'path';

interface CarData {
    slug: string;
    name: string;  
    engine: string;
    power: string;
}

export async function getCarBySlug(slug: string): Promise<CarData | null> {
    try {
        const filepath = path.join(__dirname, '..', 'data', 'cars.json');
        const jsonData = await fs.readFile(filepath, 'utf-8');
        const cars: CarData[] = JSON.parse(jsonData);

        const car = cars.find((c) => c.slug === slug);
        return car || null;
    }   catch (error) {
        console.error('Error reading local car data:', error);
        return null;
    }
}