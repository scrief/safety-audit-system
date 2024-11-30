import { DataSource } from "typeorm";
import { config } from "dotenv";
import { join } from "path";

config();

const generateMigration = async () => {
    const AppDataSource = new DataSource({
        type: "postgres",
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || "5432"),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
        migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
        synchronize: false,
    });

    try {
        await AppDataSource.initialize();
        console.log("Data Source initialized");

        const migrationName = process.argv[2] || 'Migration';
        await AppDataSource.runMigrations();
        console.log("Migrations executed successfully");

        await AppDataSource.destroy();
    } catch (error) {
        console.error("Error during migration generation:", error);
        throw error;
    }
};

generateMigration().catch(error => {
    console.error("Migration generation failed:", error);
    process.exit(1);
}); 