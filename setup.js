// setup.js
const fs = require('fs');
const path = require('path');

const directories = [
  'src/components/auth',
  'src/components/forms',
  'src/components/dashboard',
  'src/components/common',
  'src/pages',
  'src/contexts',
  'src/utils',
  'src/interfaces',
  'src/services',
  'src/hooks',
  'src/assets',
  'src/styles'
];

const files = [
  {
    path: 'src/components/common/Layout.tsx',
    content: `import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};`
  },
  {
    path: 'src/pages/Home.tsx',
    content: `import React from 'react';
import { Layout } from '../components/common/Layout';

export const Home: React.FC = () => {
  return (
    <Layout>
      <h1 className="text-3xl font-bold">
        Safety Audit System
      </h1>
    </Layout>
  );
};`
  },
  {
    path: 'src/App.tsx',
    content: `import React from 'react';
import { Home } from './pages/Home';

function App() {
  return (
    <Home />
  );
}

export default App;`
  }
];

// Create directories
directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create files
files.forEach(file => {
  const fullPath = path.join(process.cwd(), file.path);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, file.content);
    console.log(`Created file: ${file.path}`);
  }
});

console.log('Project structure setup complete!');