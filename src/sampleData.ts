import type { SampleProject } from './types';

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: 'sample-express-broken',
    name: '[Demo Sample] TaskTrack API — Baseline (With Gaps)',
    tagline: 'Prepared Demonstration Sample — Illustrating Severe Setup Gaps',
    difficulty: 'High Gaps',
    isDemo: true,
    description:
      'Prepared demonstration scenario illustrating typical onboarding roadblocks: missing install and start commands, runtime prerequisites, undocumented environment variables, exposed secret leak, and a stub test script.',
    fileStatuses: {
      readme: 'provided',
      packageJson: 'provided',
      requirementsTxt: 'not_provided',
      envExample: 'provided',
      testConfig: 'not_provided'
    },
    files: {
      readme: `# TaskTrack API

TaskTrack is a collaborative task management service for teams.

## Features
- User authentication
- Task creation and assignment
- Project organization

## Notes
Contact lead developer if anything fails.
`,
      packageJson: `{
  "name": "tasktrack-api",
  "version": "1.0.0",
  "description": "Collaborative task manager API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}`,
      requirementsTxt: '',
      envExample: `PORT=5000
DATABASE_URL=postgres://app_user:prodPassword987!@db.internal.net:5432/tasktrack
JWT_SECRET=super_secret_jwt_key_tasktrack_2026_xyz
REDIS_URL=redis://localhost:6379
`,
      testConfig: ''
    }
  },
  {
    id: 'sample-express-remediated',
    name: '[Demo Sample] TaskTrack API — Remediated Setup Documentation',
    tagline: 'Prepared Demonstration Sample — Illustrating Remediated Manifests',
    difficulty: 'Clean / Gold Standard',
    isDemo: true,
    description:
      'Prepared demonstration comparison: The TaskTrack project manifests updated with documented setup commands, environment keys, and test runners to demonstrate a clean handoff posture.',
    fileStatuses: {
      readme: 'provided',
      packageJson: 'provided',
      requirementsTxt: 'not_provided',
      envExample: 'provided',
      testConfig: 'provided'
    },
    files: {
      readme: `# TaskTrack API

TaskTrack is a collaborative task management service for teams built with Express and PostgreSQL.

## Prerequisites
- **Node.js**: \`>= 20.0.0\`
- **npm**: \`>= 10.0.0\`
- **PostgreSQL**: \`>= 14.0\`

## Getting Started

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment Variables
Copy the example environment template:
\`\`\`bash
cp .env.example .env
\`\`\`
Configure the following keys in \`.env\`:
- \`PORT\`: Local HTTP port (default: \`5000\`)
- \`DATABASE_URL\`: Local PostgreSQL connection string
- \`JWT_SECRET\`: Secret key used for signing session tokens
- \`REDIS_URL\`: Local Redis cache connection endpoint

### 3. Start the Server
\`\`\`bash
npm run dev
\`\`\`
The API will be available at: **http://localhost:5000**

## Running Tests
Execute the test suite:
\`\`\`bash
npm test
\`\`\`

## Support & Maintainer Handoff
- Lead Maintainer: dev-team@tasktrack.internal
- Onboarding Channel: #tasktrack-dev
`,
      packageJson: `{
  "name": "tasktrack-api",
  "version": "1.0.0",
  "description": "Collaborative task manager API",
  "engines": {
    "node": ">=20.0.0"
  },
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node --test test/*.test.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}`,
      requirementsTxt: '',
      envExample: `# Server Port
PORT=5000

# PostgreSQL Connection (Local Dev)
DATABASE_URL=postgres://app_user:your_password_here@localhost:5432/tasktrack_dev

# JWT Signing Secret (Generate random string)
JWT_SECRET=your_jwt_secret_placeholder_here

# Redis Cache URL
REDIS_URL=redis://localhost:6379
`,
      testConfig: `// Node native test runner configuration`
    }
  },
  {
    id: 'sample-python-incomplete',
    name: '[Demo] InsightAI Service (FastAPI & SQLAlchemy)',
    tagline: 'Data Microservice — Missing Prerequisites & Tests',
    difficulty: 'Moderate Gaps',
    isDemo: true,
    description:
      'Demonstration of a Python FastAPI service with basic setup commands present in README, but unpinned requirements, missing Python version declarations, missing virtualenv guide, and zero test instructions.',
    fileStatuses: {
      readme: 'provided',
      packageJson: 'not_provided',
      requirementsTxt: 'provided',
      envExample: 'provided',
      testConfig: 'missing'
    },
    files: {
      readme: `# InsightAI Microservice

FastAPI backend service generating automated analytics reports.

## Getting Started

Install the required packages:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

Run the application:
\`\`\`bash
uvicorn main:app --reload
\`\`\`

The server will start at http://127.0.0.1:8000.
`,
      packageJson: '',
      requirementsTxt: `fastapi
uvicorn
pydantic
sqlalchemy
python-dotenv
requests
psycopg2-binary
`,
      envExample: `DATABASE_URL=postgresql://user:password@localhost:5432/insight_db
EXTERNAL_API_KEY=replace_with_your_api_key
MODEL_CACHE_DIR=/tmp/models
`,
      testConfig: ''
    }
  },
  {
    id: 'sample-gold-standard',
    name: '[Demo] PulseFlow Platform (TypeScript & Fastify)',
    tagline: 'Production-Grade Handoff — Comprehensive Documentation',
    difficulty: 'Clean / Gold Standard',
    isDemo: true,
    description:
      'Demonstration of an exemplary repository adhering to best-practice developer handoff: explicit prerequisites, step-by-step onboarding, documented env variables, automated test scripts, and maintainer SLA.',
    fileStatuses: {
      readme: 'provided',
      packageJson: 'provided',
      requirementsTxt: 'not_provided',
      envExample: 'provided',
      testConfig: 'provided'
    },
    files: {
      readme: `# PulseFlow Platform

PulseFlow is a high-throughput event processing platform built with Fastify, TypeScript, and Redis.

## System Prerequisites
Ensure the following runtimes are installed on your workstation:
- **Node.js**: \`>= 20.11.0\` (Recommended: use \`nvm use\` to match \`.nvmrc\`)
- **npm**: \`>= 10.2.0\`
- **Docker**: \`>= 24.0.0\` (for local Redis and PostgreSQL containers)

## Quick Start Guide

### 1. Clone & Install Dependencies
\`\`\`bash
git clone https://github.com/pulseflow/platform.git
cd platform
npm install
\`\`\`

### 2. Configure Environment Variables
Copy the example environment template:
\`\`\`bash
cp .env.example .env
\`\`\`
Edit \`.env\` with your local configuration:
- \`PORT\`: HTTP port (default: \`4000\`)
- \`DATABASE_URL\`: PostgreSQL connection URI
- \`REDIS_URL\`: Redis cache endpoint
- \`SESSION_SECRET\`: 32+ character random string for signing cookies

### 3. Start Infrastructure & Development Server
\`\`\`bash
docker compose up -d
npm run dev
\`\`\`
The application starts at: **http://localhost:4000**
Health check endpoint: **http://localhost:4000/health**

## Running Automated Tests
Run the test suite using Vitest:
\`\`\`bash
npm test
\`\`\`
Run tests in coverage mode:
\`\`\`bash
npm run test:coverage
\`\`\`

## Architecture & Project Structure
- \`/src/routes\`: HTTP request controllers
- \`/src/services\`: Core domain logic
- \`/src/db\`: Prisma migrations and client

## Maintainers & Handoff Support
- **Lead Maintainer**: Alex Chen (alex@pulseflow.internal)
- **Handoff Channel**: #pulseflow-onboarding on Slack
`,
      packageJson: `{
  "name": "pulseflow-platform",
  "version": "2.4.0",
  "description": "High-throughput event processing platform",
  "engines": {
    "node": ">=20.11.0",
    "npm": ">=10.2.0"
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "@fastify/cors": "9.0.1",
    "@fastify/helmet": "11.1.1",
    "dotenv": "16.4.5",
    "fastify": "4.26.2",
    "ioredis": "5.3.2",
    "pg": "8.11.5",
    "zod": "3.22.4"
  },
  "devDependencies": {
    "@types/node": "20.11.24",
    "tsx": "4.7.1",
    "typescript": "5.3.3",
    "vitest": "1.3.1"
  }
}`,
      requirementsTxt: '',
      envExample: `# Server Configuration
PORT=4000
NODE_ENV=development

# Database Connection (PostgreSQL)
DATABASE_URL=postgresql://pulse_user:pulse_password@localhost:5432/pulseflow_dev

# Cache Service
REDIS_URL=redis://localhost:6379

# Security Credentials (generate via: openssl rand -hex 32)
SESSION_SECRET=changeme_in_production_32chars_long_placeholder
`,
      testConfig: `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
});`
    }
  }
];

export const EMPTY_FILES: Record<string, string> = {
  readme: '',
  packageJson: '',
  requirementsTxt: '',
  envExample: '',
  testConfig: ''
};
