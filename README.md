# Festival-Social

Festival-Social is a social platform for festival-goers to share posts, discover content by genre and location, connect with other users, join community groups, and stay updated with weather information for upcoming events.

Final project for the course **Internet Application Development (פיתוח אפליקציות אינטרנטיות)**, course #654005, instructed by Mr. Chaim Shafir.

## Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Architecture:** MVC, REST API + static frontend
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Authentication:** Session-based authentication using `express-session` and `connect-mongo`
- **Password Security:** bcrypt password hashing
- **External APIs:** Open-Meteo Weather API and Google Maps JavaScript API
- **Data Visualization:** D3.js

## Main Features

### Users
- User registration and login
- Session-based authentication
- User profiles
- Edit and delete account
- Follow and unfollow users
- Search users by multiple parameters
- Select favorite music genres during registration

### Personalized Feed
- Personalized feed based on the user's favorite genres
- **Recommended for you** section containing posts from preferred genres
- **Discover new genres** section containing posts from other genres
- Follow users directly from suggested posts
- Like and comment on posts
- Images and videos inside the feed
- Videos can autoplay while visible

### Posts
- Create posts
- Edit posts
- Delete posts
- Like posts
- Comment on posts
- Add genre and live status
- Add location to posts
- Search posts using multiple filters including genre, live status and location

### Groups
- Create community groups
- Join and leave groups
- Browse groups
- Group creator permissions
- Group-related posts and community interaction

### Statistics
- MongoDB aggregation queries
- Statistics by genre
- Statistics by group
- Dynamic charts using D3.js

### Weather
- Search weather by city
- Use current location
- Current weather information
- 7-day weather forecast
- Weather data provided by Open-Meteo

### Map
- Interactive Google Maps view
- Display post locations
- Add and edit locations associated with posts

### HTML5 & CSS3
The project uses modern HTML5 and CSS3 features including:

- Video
- Canvas animation
- Semantic HTML elements
- Responsive design
- Custom fonts
- CSS transitions
- Border radius
- Text shadows
- Multiple-column layouts

## Demo Data

The project includes a seed script that creates demo data for presentation and testing.

The seed creates:

- **15 demo users**
- **8 groups**
- **35 posts**
- Follow relationships
- Group memberships
- Likes
- Comments
- Post locations
- Images and videos

To populate the database with the demo data, run:

```bash
npm run seed
```

## Demo Account

After running the seed script, you can log in with:

**Username:** `maya.festival`

**Email:** `maya@festival-demo.com`

**Password:** `Festival123!`

The demo account can be used to quickly demonstrate the application's main functionality.

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/eladbenharouch/Festival-Social.git
cd Festival-Social
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root based on `.env.example`:

```dotenv
PORT=3000
SESSION_SECRET=your_random_secret_string
MONGODB_URI=your_mongodb_atlas_connection_string
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

> Never commit the real `.env` file or private API keys to GitHub.

### 4. Create demo data

```bash
npm run seed
```

### 5. Start the application

```bash
npm run dev
```

### 6. Open the application

Open:

`http://localhost:3000`

## Project Structure

```text
Festival-Social/
├── config/          # Database configuration
├── controllers/     # MVC controllers and application logic
├── middleware/      # Authentication middleware
├── models/          # Mongoose models
├── routes/          # Express API routes
├── public/
│   ├── css/         # Stylesheets
│   ├── js/          # Frontend JavaScript
│   ├── videos/      # Demo media
│   └── *.html       # Application pages
├── seed.js          # Demo database seed
├── app.js           # Application entry point
├── package.json
└── .env.example
```

## Architecture

Festival-Social follows the **MVC (Model-View-Controller)** architecture:

- **Models** define MongoDB data structures using Mongoose.
- **Controllers** contain the application's server-side logic.
- **Routes** connect REST API endpoints to controllers.
- **Views / Frontend** are implemented using HTML5, CSS3 and Vanilla JavaScript.

The frontend communicates with the backend asynchronously using the Fetch API.

## Team

- Elad Ben Harouch
- Adir Oved 
- Bar Mashiach