import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { Client } from '../entities/client.entity';
import { Template } from '../entities/template.entity';

export default class InitialSeeder implements Seeder {
    public async run(
        dataSource: DataSource,
        factoryManager: SeederFactoryManager
    ): Promise<any> {
        const clientRepository = dataSource.getRepository(Client);
        const templateRepository = dataSource.getRepository(Template);

        // Add your seed data here
        const clients = [
            {
                name: 'Example Client',
                industry: 'Manufacturing',
                // ... other client fields
            },
            // ... more clients
        ];

        const templates = [
            {
                name: 'Basic Safety Audit',
                // ... other template fields
            },
            // ... more templates
        ];

        await clientRepository.save(clients);
        await templateRepository.save(templates);
    }
} 