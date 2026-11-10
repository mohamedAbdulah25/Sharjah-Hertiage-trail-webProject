const LEVELS = [
  { name: "Visitor", xp: 0 },
  { name: "Explorer", xp: 200 },
  { name: "Historian", xp: 400 },
  { name: "Heritage Guardian", xp: 800 }
];

const BADGES = [
  { id: "first-steps", icon: "👣", name: "First Steps", description: "Passed your first verification quiz.", hint: "Pass any landmark quiz." },
  { id: "museum-lover", icon: "🏛", name: "Museum Lover", description: "Visited every museum on the trail.", hint: "Visit all museum landmarks." },
  { id: "halfway-there", icon: "🧭", name: "Halfway There", description: "Verified three landmarks.", hint: "Verify 3 landmarks." },
  { id: "trip-planner", icon: "🗺", name: "Trip Planner", description: "Saved your first trip plan.", hint: "Save a plan on Plan Your Visit." },
  { id: "mission-complete", icon: "🎯", name: "Mission Complete", description: "Visited every stop in a saved plan.", hint: "Visit every stop in one of your plans." },
  { id: "heritage-guardian", icon: "👑", name: "Heritage Guardian", description: "Verified every landmark in Sharjah.", hint: "Verify all landmarks." }
];

const CATEGORIES = ["Museum", "Religious", "Historic", "Outdoor"];

const CATEGORY_ICONS = { Museum: "🏛", Religious: "🕌", Historic: "🏰", Outdoor: "⛲" };

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TRAVEL_MINUTES = 20;

const STUDENT_DISCOUNT = 0.5;

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";

const CONTACT_EMAIL = "u24103355@sharjah.ac.ae";
const CONTACT_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

const STORAGE_KEYS = {
  progress: "sht-progress",
  custom: "sht-customLandmarks",
  admin: "sht-admin",
  users: "sht-users",
  currentUser: "sht-current-user"
};
