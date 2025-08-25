#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 Nigeria Oil & Gas Infrastructure Setup\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
    console.log('✅ .env file already exists');
} else {
    console.log('📝 Creating .env file...');

    rl.question('Enter your Google Maps API Key: ', (apiKey) => {
        if (!apiKey.trim()) {
            console.log('❌ API key is required. Please run setup again.');
            rl.close();
            return;
        }

        const envContent = `# Google Maps API Configuration
GOOGLE_MAPS_API_KEY=${apiKey.trim()}

# Server Configuration
PORT=3000
NODE_ENV=development
`;

        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env file created successfully');

        rl.close();
    });
}

// Check if dependencies are installed
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    if (packageJson.dependencies) {
        console.log('\n📦 Installing dependencies...');
        const { execSync } = require('child_process');

        try {
            execSync('npm install', { stdio: 'inherit' });
            console.log('✅ Dependencies installed successfully');
        } catch (error) {
            console.log('❌ Failed to install dependencies. Please run "npm install" manually.');
        }
    }
}

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Make sure you have a valid Google Maps API key');
console.log('2. Enable the following APIs in Google Cloud Console:');
console.log('   - Places API');
console.log('   - Maps JavaScript API');
console.log('   - Geocoding API');
console.log('3. Run "npm start" to start the application');
console.log('4. Open http://localhost:3000 in your browser');

if (!envExists) {
    rl.on('close', () => {
        process.exit(0);
    });
}
