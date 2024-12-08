"Hello Windsurf,

I am planning to develop a Safety Audit System that helps organizations manage safety audits for their clients. Here are the key details of the project:

Technology Stack:

Next.js 15.0.3 for the frontend
React 18.2.0 for building interactive user interfaces
TypeScript for static type checking and enhanced code reliability
Prisma for database management with a PostgreSQL database
NextAuth for secure user authentication
TailwindCSS for flexible and responsive styling
Various UI libraries including Radix UI and Headless UI for accessible and customizable components
PDF generation using libraries like pdfkit, jspdf, and @react-pdf/renderer
Data visualization with Recharts
Form handling using react-hook-form and validation with Zod
Core Features:

User Management: Two main roles — Admin (can manage users, templates, and settings) and User (can execute audits, access templates, and view results).
Client Management: Manage client details such as risk level, industry, contact info, etc., and assign audit templates accordingly.
Audit Management: Create, track, and score audits based on client templates, with customizable sections and fields (e.g., text, multiple-choice, sliders).
Audit Scoring: Audits will have weighted scoring for different sections based on importance.
Tagging System: Tags can be applied to templates and fields for better categorization and searching.
AI Integration: Some fields may leverage AI for automated analysis and recommendations.
File Handling: Support for photo uploads related to audit responses.
PDF Reporting: Export audits and results into formatted PDF reports.
Data Visualization: Interactive charts and graphs (via Recharts) to display audit results and key metrics.
Security: Ensure secure user authentication and authorization with NextAuth, restricting access based on user roles.

The system should be scalable, flexible, and easily extensible to support future features. The backend is designed with Prisma and PostgreSQL to handle complex relationships between audits, templates, and clients. The frontend will focus on delivering a smooth and intuitive user experience.

Please ensure the project is well-structured to handle all these features, keeping scalability and performance in mind.

Thank you!"