# AssetEase Server

## Overview
AssetEase is a platform designed to streamline asset management. This repository contains the server-side code, handling authentication, database operations, and API requests.

## Features
- User authentication (JWT-based)
- Asset management CRUD operations
- Secure API endpoints
- Database integration
- Server-side validation

## Tech Stack
- **Backend Framework:** Node.js with Express
- **Database:** MongoDB / PostgreSQL (Choose based on your preference)
- **Authentication:** JWT (JSON Web Token)
- **Environment Variables:** dotenv
- **Other Dependencies:**
  - bcrypt (Password hashing)
  - mongoose / pg (Database ORM/ODM)
  - cors (Handling cross-origin requests)
  - express-validator (Input validation)

## Installation
### Prerequisites
- Node.js (>= 14.x)
- MongoDB/PostgreSQL installed and running

### Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/TamimAhmedCD/asset-ease-server
   cd assetease-server
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file in the root directory and configure the following:
   ```env
   PORT=5000
   DATABASE_URL=mongodb://localhost:27017/assetease
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server:
   ```sh
   npm start
   ```
   Or in development mode:
   ```sh
   npm run dev
   ```

## API Endpoints
### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login

### Assets
- `GET /api/assets` - Get all assets
- `POST /api/assets` - Add a new asset
- `PUT /api/assets/:id` - Update an asset
- `DELETE /api/assets/:id` - Delete an asset

## Contributing
Feel free to submit pull requests or open issues to improve AssetEase.

## License
This project is licensed under the MIT License.

---
Maintained by **Tamim Ahmed**