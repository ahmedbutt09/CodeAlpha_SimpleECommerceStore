// backend/config/passport.js - UPDATED
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

// Debug
console.log("🔍 Passport config - Client ID:", process.env.GOOGLE_CLIENT_ID ? "Present" : "Missing");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("🔍 Google OAuth profile received:", profile.id);
      
      try {
        // Check if user exists with this googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          console.log("🔍 Existing Google user found:", user.email);
          return done(null, user);
        }

        // Check if user exists with this email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.isGoogleAccount = true;
          user.avatar = profile.photos[0]?.value || "";
          await user.save();
          console.log("🔍 Linked Google to existing user:", user.email);
          return done(null, user);
        }

        // Create new user
        const newUser = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          username: profile.displayName || `user_${profile.id.substring(0, 8)}`,
          avatar: profile.photos[0]?.value || "",
          isGoogleAccount: true,
        });

        await newUser.save();
        console.log("🔍 New Google user created:", newUser.email);
        done(null, newUser);
      } catch (error) {
        console.error("🔍 Google OAuth error:", error);
        done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;