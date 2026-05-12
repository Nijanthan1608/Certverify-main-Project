# CertVerify: Project Documentation

## Project Overview

**CertVerify** is a modern, responsive, and secure MERN (MongoDB, Express.js, React, Node.js) web application designed to handle the generation, management, and verification of internship or educational certificates. The application features a dual-role system: administrators who can bulk-upload or manually create certificates, and a public-facing portal where students or employers can instantly verify the authenticity of a certificate using its unique ID.

The core philosophy behind the codebase is **readability, maintainability, and clean UI/UX**. It uses `framer-motion` for smooth animations, JWT (JSON Web Tokens) for secure authentication, and dynamically generates high-quality PDF certificates on the client side using `jspdf`.

---

## Technology Stack

### Backend
- **Node.js & Express.js**: Handles the REST API, routing, and HTTP requests.
- **MongoDB & Mongoose**: As NoSQL database for flexible data storage and strict modeling for schemas.
- **JWT (JSON Web Tokens)**: For secure, stateless user authentication.
- **Bcrypt.js**: For securely hashing passwords before storing them in the database.
- **Multer & XLSX**: For handling file uploads and parsing Excel/CSV files for the bulk import feature.
- **Express-Validator**: For strict, middleware-based validation of incoming requests.

### Frontend
- **React 18**: Features a modern, functional-component-based architecture utilizing React hooks natively.
- **React Router Dom**: For seamless, client-side routing and protected routes.
- **Framer Motion**: Enables fluid, complex animations and page transitions with minimal code.
- **Axios**: For making HTTP requests to the backend API seamlessly.
- **React Hot Toast**: For clean, unobtrusive flash messages and notifications.
- **jsPDF**: For generating pixel-perfect, vector-based PDF copies of the certificates directly in the browser.

---

## Architecture & Directory Structure

The repository is logically split into two main directories: `backend` and `frontend`.

### `/backend`
- **`server.js`**: The main entry point. Sets up Express, middleware (CORS, JSON parsing), and mounts routes.
- **`config/database.js`**: Handles MongoDB connection logic.
- **`models/`**: Mongoose schemas defining the data structure.
  - `User.model.js`: Stores admin/user credentials and roles.
  - `Certificate.model.js`: Stores certificate details (student name, domain, dates) and handles calculation of duration via virtual fields.
- **`routes/`**: API endpoint definitions.
  - `auth.routes.js`: Login, register, profile.
  - `admin.routes.js`: Bulk upload, dashboard stats.
  - `certificate.routes.js`: Verification, CRUD operations.
- **`controllers/`**: The core business logic executed when a route is hit.
- **`middleware/`**: Functions that run *before* the controller (e.g., verifying admin status, handling errors, parsing generic rules).

### `/frontend`
- **`src/App.js & index.js`**: App initialization, routing setup, and context providers.
- **`src/index.css`**: Global design tokens (colors, fonts, reset).
- **`src/pages/`**: The main views in the app.
  - `HomePage.js`: Landing page with clear call to action.
  - `VerifyPage.js`: Public search portal for certificates.
  - `AdminPage.js`: The protected dashboard for managing data.
  - `LoginPage.js & RegisterPage.js`: Authentication flows.
- **`src/components/`**: Reusable UI blocks.
  - `shared/`: Navbar, Loading screens.
  - `admin/`: BulkUpload (drag-and-drop), CertificateTable, Form modals.
  - `certificate/`: The visual CertificateCard and PDF generator previews.
- **`src/context/AuthContext.js`**: Global state management for user sessions.
- **`src/services/api.js`**: Centralized Axios instance with automatic token injection.
- **`src/utils/`**: Helper scripts for date formatting, duration calculation, and PDF generation.

---

## Key Features

1. **Secure Authentication & Authorization**
   - Routes and API endpoints are strictly protected. Users can only access standard routes, while the `AdminPage` and administrative backend endpoints check for explicit admin roles in the JWT payload.

2. **Certificate Verification Portal**
   - The `/verify` route provides a rapid input field where an employer can paste a certificate ID. If authenticated, it returns a visual breakdown of the student's internship and allows downloading a verified PDF.

3. **Admin Dashboard & Management**
   - Admins can view a paginated table of all certificates.
   - They can create new certificates manually via a pop-up modal.
   - They can edit, review, or securely delete existing records.

4. **Bulk Upload via Excel/CSV**
   - Allows importing hundreds of certificates at once. The system parses the file using `multer` and `xlsx`, validates every individual row, skips exact duplicates, and returns a detailed summary of successes vs. errors.

5. **Client-Side PDF Generation**
   - Uses `jsPDF` to draw a vector-based certificate on the fly. This avoids server-side rendering bottlenecks and ensures the downloaded file is of the highest print quality.

---

## Code Philosophy & Best Practices

During the recent refactoring, strict adherence to code cleanliness was prioritized:

- **Exhaustive Commenting**: Every major function, component, Hook, and styling block includes plain-English comments intended to explain the *why*, rather than just the *what*.
- **Consistent Styling**: All inline styles use a cohesive color palette (`#c8a96e` for gold accents, `#181c24` for dark themes).
- **Error Handling**: Graceful error catching on the backend passes standardized JSON error objects to the frontend, which are parsed and displayed cleanly using `react-hot-toast`.
- **Responsive Layouts**: Designed to be entirely functional on both mobile phones and wide desktop screens utilizing CSS Grid and Flexbox.
