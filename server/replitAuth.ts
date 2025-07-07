import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
// Import User model for MongoDB operations
import User from './models/User.js';
import MemoryStore from "memorystore";

// Set default environment variables for local development
if (!process.env.REPLIT_DOMAINS) {
  // For local development, use localhost
  const hostname = 'localhost:5000';
  process.env.REPLIT_DOMAINS = hostname;
  console.log(`Using default REPLIT_DOMAINS for local development: ${hostname}`);
}

if (!process.env.REPL_ID) {
  // For local development, use a mock REPL_ID
  process.env.REPL_ID = 'local-development-id';
  console.log(`Using default REPL_ID for local development`);
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use memory store for sessions
  const sessionStore = new (MemoryStore(session))({
    checkPeriod: sessionTtl, // prune expired entries every 24h
  });

  return session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

// Import User model for MongoDB operations
import User from './models/User.js';

async function findUserByEmail(email: string) {
  try {
    const user = await User.findOne({ email }).populate('enrolledCourses');
    return user;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists in database
        let user = await User.findOne({ email: profile.emails?.[0]?.value });
        
        if (!user) {
          // Create new user with Google profile data
          user = new User({
            email: profile.emails?.[0]?.value,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            username: profile.emails?.[0]?.value?.split('@')[0] || '',
            avatar: profile.photos?.[0]?.value || '',
            role: 'student',
            isApproved: false, // Requires admin approval
            googleId: profile.id,
            emailVerified: true // Google accounts are pre-verified
          });
          await user.save();
        } else {
          // Update existing user with Google data if not set
          if (!user.googleId) {
            user.googleId = profile.id;
            user.emailVerified = true;
            await user.save();
          }
        }
        
        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }));
  }

  // Setup Replit OAuth only if properly configured
  let config = null;
  if (process.env.REPL_ID !== 'local-development-id') {
    config = await getOidcConfig();
  }

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      // Don't create MongoDB user here - let them set up username/password
      verified(null, user);
    } catch (error) {
      verified(error, null);
    }
  };

  // Only setup Replit OAuth if config is available
  if (config) {
    for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }
  }

  passport.serializeUser((user: any, cb) => {
    if (user._id) {
      // MongoDB user
      cb(null, { type: 'mongo', id: user._id.toString() });
    } else {
      // Session user (Replit OAuth)
      cb(null, { type: 'session', data: user });
    }
  });
  
  passport.deserializeUser(async (obj: any, cb) => {
    try {
      if (obj.type === 'mongo') {
        // Find MongoDB user
        const user = await User.findById(obj.id);
        cb(null, user);
      } else {
        // Session user
        cb(null, obj.data);
      }
    } catch (error) {
      cb(error, null);
    }
  });

  // Google OAuth routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  
  app.get("/api/auth/google/callback", passport.authenticate("google", { failureRedirect: "/auth" }), (req, res) => {
    // Successful authentication, redirect to dashboard
    res.redirect("/");
  });

  app.get("/api/login", (req, res, next) => {
    if (config) {
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    } else {
      res.redirect("/auth");
    }
  });

  app.get("/api/callback", (req, res, next) => {
    if (config) {
      passport.authenticate(`replitauth:${req.hostname}`, (err, user) => {
        if (err) {
          return res.redirect("/api/login");
        }
        if (!user) {
          return res.redirect("/api/login");
        }
        
        req.logIn(user, async (err) => {
          if (err) {
            return res.redirect("/api/login");
          }
          
          // Check if user has completed account setup
          const claims = user.claims;
          if (claims && claims.email) {
            try {
              const existingUser = await findUserByEmail(claims.email);
              if (!existingUser) {
                // New user - redirect to account setup with email info
                const setupParams = new URLSearchParams({
                  email: claims.email,
                  firstName: claims.first_name || '',
                  lastName: claims.last_name || '',
                  profileImageUrl: claims.profile_image_url || ''
                });
                return res.redirect(`/account-setup?${setupParams.toString()}`);
              } else {
                // Store user in session
                req.user.dbUser = existingUser;
                // Existing user - redirect to dashboard
                return res.redirect("/");
              }
            } catch (error) {
              console.error("Error checking setup status:", error);
              return res.redirect("/account-setup");
            }
          }
          
          // Fallback redirect
          res.redirect("/");
        });
      })(req, res, next);
    } else {
      res.redirect("/auth");
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  
  if (!user?.dbUser || user.dbUser.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
};