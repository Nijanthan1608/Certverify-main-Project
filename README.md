CertVerify — Certificate Verification System
A full-stack, production-ready web application for issuing and verifying internship certificates. Built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

Features
Role-based Authentication — Secure JWT login for Admins and Students
Bulk Excel Upload — Import hundreds of certificates via .xlsx / .csv
Instant Verification — Search by Certificate ID, get verified results
PDF Download — Generate print-ready A4 landscape certificates
Admin Dashboard — Full CRUD, pagination, user management
Swiss Luxury UI — Dark, premium design with gold accents and Framer Motion animations
Tech Stack
Layer	Technology
Frontend	React 18, React Router v6, Framer Motion, jsPDF
Backend	Node.js, Express.js
Database	MongoDB with Mongoose ODM
Auth	JWT (JSON Web Tokens) + bcryptjs
File Parsing	xlsx (SheetJS)
Security	helmet, cors, express-rate-limit, express-validator
Project Structure
certverify/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── certificate.controller.js
│   │   └── admin.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── models/
│   │   ├── User.model.js
│   │   └── Certificate.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── certificate.routes.js
│   │   └── admin.routes.js
│   ├── utils/
│   │   └── seed.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── admin/
│       │   │   ├── BulkUpload.js
│       │   │   ├── CertificateFormModal.js
│       │   │   └── CertificateTable.js
│       │   ├── certificate/
│       │   │   ├── CertificateCard.js
│       │   │   └── CertificateModal.js
│       │   └── shared/
│       │       ├── LoadingScreen.js
│       │       └── Navbar.js
│       ├── context/
│       │   └── AuthContext.js
│       ├── pages/
│       │   ├── AdminPage.js
│       │   ├── HomePage.js
│       │   ├── LoginPage.js
│       │   ├── RegisterPage.js
│       │   └── VerifyPage.js
│       ├── services/
│       │   └── api.js
│       ├── utils/
│       │   ├── helpers.js
│       │   └── pdfGenerator.js
│       ├── App.js
│       ├── index.css
│       └── index.js
├── package.json
└── README.md
Getting Started
Prerequisites
Node.js v18+
MongoDB (local or Atlas)
npm or yarn
1. Clone / Extract
cd certverify
2. Install All Dependencies
npm run install:all
This installs root, backend, and frontend dependencies in one command.

3. Configure Environment
cd backend
cp .env.example .env
Edit .env:

PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/certverify
JWT_SECRET=your_super_secret_key_min_32_characters
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
4. Seed Demo Data (optional)
cd backend
node utils/seed.js
This creates:

Admin: admin@demo.com / admin123
User: user@demo.com / user123
5 sample certificates
5. Run Development Servers
From the root directory:

npm run dev
This starts:

Backend on http://localhost:5000
Frontend on http://localhost:3000
API Reference
Authentication
Method	Endpoint	Access	Description
POST	/api/auth/register	Public	Register new user
POST	/api/auth/login	Public	Login
GET	/api/auth/me	Auth	Get current user
PUT	/api/auth/profile	Auth	Update profile
PUT	/api/auth/change-password	Auth	Change password
Certificates
Method	Endpoint	Access	Description
GET	/api/certificates/verify/:id	Public	Verify by Certificate ID
GET	/api/certificates/stats	Public	Get system stats
GET	/api/certificates	Admin	List all (paginated)
POST	/api/certificates	Admin	Create single
PUT	/api/certificates/:id	Admin	Update
DELETE	/api/certificates/:id	Admin	Soft delete
Admin
Method	Endpoint	Access	Description
POST	/api/admin/upload	Admin	Bulk Excel upload
GET	/api/admin/users	Admin	List all users
PATCH	/api/admin/users/:id/toggle	Admin	Toggle user active
GET	/api/admin/dashboard	Admin	Dashboard stats
Excel Upload Format
Your Excel file must have these columns (flexible naming):

Column	Accepted Names
Certificate ID	certificate_id, cert_id, id
Student Name	student_name, name, full_name
Domain	domain, internship_domain, field
Start Date	start_date, from, startdate
End Date	end_date, to, enddate
Institution	institution, college, university (optional)
Notes	notes, remarks, comments (optional)
Production Deployment
Build Frontend
npm run build
Set NODE_ENV=production in backend .env. The Express server will serve the React build automatically.

Environment Variables for Production
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/certverify
JWT_SECRET=<strong-random-string-min-32-chars>
CLIENT_URL=https://yourdomain.com
Security Features
Passwords hashed with bcrypt (12 salt rounds)
JWT authentication with expiry
Rate limiting on all API routes (100 req/15min) and auth (10 req/15min)
Helmet.js for HTTP security headers
CORS restricted to configured origin
Input validation with express-validator
Soft deletes (data never permanently removed)
Role-based route guards (Admin / User)
License
MIT — Free for educational and commercial use.
