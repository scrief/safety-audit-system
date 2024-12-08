import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create sample clients
  const clients = [
    {
      name: 'Acme Corporation',
      industry: 'Manufacturing',
      employeeCount: 500,
      locations: 3,
      riskLevel: 'MEDIUM',
      contacts: [
        {
          name: 'John Doe',
          email: 'john@acme.com',
          phone: '555-0100',
          title: 'Safety Manager'
        }
      ]
    },
    {
      name: 'Tech Solutions Inc',
      industry: 'Technology',
      employeeCount: 200,
      locations: 2,
      riskLevel: 'LOW',
      contacts: [
        {
          name: 'Jane Smith',
          email: 'jane@techsolutions.com',
          phone: '555-0200',
          title: 'Operations Director'
        }
      ]
    },
    {
      name: 'Construction Co',
      industry: 'Construction',
      employeeCount: 1000,
      locations: 5,
      riskLevel: 'HIGH',
      contacts: [
        {
          name: 'Bob Builder',
          email: 'bob@constructionco.com',
          phone: '555-0300',
          title: 'Safety Director'
        }
      ]
    }
  ];

  for (const client of clients) {
    await prisma.client.create({
      data: {
        ...client,
        contacts: client.contacts as any // TypeScript workaround for JSON field
      }
    }).catch(e => {
      // Skip if client already exists
      console.log(`Skipping client ${client.name}:`, e.message);
    });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });