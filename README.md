# Festival-Social

Festival-Social is a social platform for festival-goers to share posts, discover events by genre and location, join community groups, and stay updated with real-time weather for their next event.

Final project for the course **Internet Application Development (פיתוח אפליקציות אינטרנטיות)**, course #654005, instructed by Mr. Chaim Shafir.

## Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Architecture:** MVC, REST API + static frontend
- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (no frameworks)
- **Auth:** Session-based authentication (`express-session` + `connect-mongo`), bcrypt password hashing
- **External APIs:** Open-Meteo (weather), Google Maps JavaScript API (map view)
- **Data Visualization:** D3.js

## Features

- User registration, login, and session-based authentication
- Create, edit, delete, like, and comment on posts
- Post search with multiple filters (genre, live status, location)
- Groups: create, join, and browse community groups
- Group and genre statistics using MongoDB aggregation, visualized with D3.js
- Real-time weather lookup by geolocation or manual coordinates
- Interactive map view showing post locations (Google Maps)
- Responsive dark-themed UI with custom fonts, video, and canvas animation

## Setup

1. Clone the repository:
```bash
   git clone <repo-url>
   cd Festival-Social
```

2. Install dependencies:
```bash
   npm install
```

3. Create a `.env` file in the project root based on `.env.example`:
```dotenv
   PORT=3000
   SESSION_SECRET=your_random_secret_string
   MONGODB_URI=your_mongodb_atlas_connection_string
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

   > **Note:** Never commit your real `.env` file or API keys to GitHub.

4. Run the server:
```bash
   npm run dev
```

5. Open your browser at `http://localhost:3000`

## Project Structure

```
├── config/          # Database and app configuration
├── controllers/     # Route logic (MVC controllers)
├── middleware/       # Express middleware (auth, etc.)
├── models/          # Mongoose schemas
├── routes/          # Express route definitions
├── public/          # Static frontend (HTML, CSS, JS, media)
└── app.js           # App entry point
```

## Team

- Elad Ben Harouch
- Adir Oved
- Bar Mashiach