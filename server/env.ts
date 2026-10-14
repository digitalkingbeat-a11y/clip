// Load local env files before any other server module reads process.env.
// .env.local (developer secrets, git-ignored) takes priority over .env.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });
