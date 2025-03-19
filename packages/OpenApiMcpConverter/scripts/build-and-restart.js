import { execSync } from 'child_process';

try {
  // Build the project
  console.log('Building project...');
  execSync('npm run build');
  
  // Kill all Node.js processes
  console.log('Killing existing Node.js processes...');
  try {
    execSync('taskkill /F /IM node.exe', { stdio: 'inherit' });
  } catch (e) {
    console.log('No existing Node.js processes to kill, continuing...');
  }
  
  // Start the server fresh
  console.log('Starting server...');
  execSync('npm start', { stdio: 'inherit' });
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
