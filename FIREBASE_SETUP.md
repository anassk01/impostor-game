# Firebase Setup Guide

Follow these steps to set up Firebase for your Impostor game:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `impostor-game` (or any name you prefer)
4. Disable Google Analytics (optional, not needed for this game)
5. Click "Create project"

## 2. Enable Realtime Database

1. In your Firebase project, click "Realtime Database" in the left sidebar
2. Click "Create Database"
3. Select a location closest to your users
4. Choose "Start in **test mode**" (we'll update rules next)
5. Click "Enable"

## 3. Update Database Rules

1. Go to the "Rules" tab in Realtime Database
2. Replace the rules with this (allows public read/write):

```json
{
  "rules": {
    "impostor_game_impostor:*": {
      ".read": true,
      ".write": true
    }
  }
}
```

3. Click "Publish"

## 4. Get Firebase Configuration

1. Click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps"
4. Click the web icon `</>`
5. Register your app with a nickname (e.g., "Impostor Web App")
6. Copy the `firebaseConfig` object values

## 5. Create .env File

1. In your project root, create a file named `.env`
2. Copy the content from `.env.example`
3. Fill in the values from your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=impostor-game-xxxxx.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://impostor-game-xxxxx-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=impostor-game-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=impostor-game-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## 6. Add Environment Variables to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `imposter` project
3. Go to "Settings" > "Environment Variables"
4. Add each variable from your `.env` file:
   - Key: `VITE_FIREBASE_API_KEY`
   - Value: Your API key
   - Environment: Production, Preview, Development
5. Repeat for all 7 variables

## 7. Deploy

Run these commands to deploy:

```bash
git add .
git commit -m "Add Firebase backend for multiplayer support"
git push
vercel --prod
```

## Done!

Your game now supports real multiplayer! Players on different devices can join the same game room.

## Security Notes

The current setup uses test mode rules which allow anyone to read/write. For production, consider:

1. Adding user authentication
2. Implementing server-side validation
3. Setting up proper security rules
4. Adding rate limiting

For now, this works fine for a party game!
