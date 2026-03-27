import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, users, authTokens } from "@workspace/db";
import { createHash, randomUUID } from "crypto";

const router: IRouter = Router();

const ACTIVATION_CODE = "fcai-du";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "phisphere-salt-2026").digest("hex");
}

function generateToken(): string {
  return randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
}

router.post("/auth/signup", async (req, res): Promise<void> => {
  const { username, password, activationCode, plan } = req.body ?? {};

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters." });
    return;
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }
  if (!activationCode || activationCode.trim() !== ACTIVATION_CODE) {
    res.status(400).json({ error: "Invalid activation code. Please check your code and try again." });
    return;
  }

  const cleanUsername = username.trim().toLowerCase();
  const existing = await db.select().from(users).where(eq(users.username, cleanUsername));
  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken. Please choose another." });
    return;
  }

  const selectedPlan = plan === "annual" ? "annual" : plan === "monthly" ? "monthly" : "monthly";

  const [user] = await db.insert(users).values({
    username: cleanUsername,
    passwordHash: hashPassword(password),
    isActivated: true,
    plan: selectedPlan,
  }).returning();

  const token = generateToken();
  await db.insert(authTokens).values({ userId: user.id, token });

  res.status(201).json({
    token,
    user: { id: user.id, username: user.username, plan: user.plan, isActivated: user.isActivated },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  const cleanUsername = username.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.username, cleanUsername));

  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  if (!user.isActivated) {
    res.status(403).json({ error: "Account not activated. Please contact support." });
    return;
  }

  const token = generateToken();
  await db.insert(authTokens).values({ userId: user.id, token });

  res.json({
    token,
    user: { id: user.id, username: user.username, plan: user.plan, isActivated: user.isActivated },
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const [tokenRow] = await db.select().from(authTokens).where(eq(authTokens.token, token));
  if (!tokenRow) {
    res.status(401).json({ error: "Invalid or expired token." });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.id, tokenRow.userId));
  if (!user) {
    res.status(401).json({ error: "User not found." });
    return;
  }

  res.json({ id: user.id, username: user.username, plan: user.plan, isActivated: user.isActivated });
});

router.post("/auth/change-password", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const [tokenRow] = await db.select().from(authTokens).where(eq(authTokens.token, token));
  if (!tokenRow) {
    res.status(401).json({ error: "Invalid or expired session." });
    return;
  }

  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new password are required." });
    return;
  }
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters." });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.id, tokenRow.userId));
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  if (user.passwordHash !== hashPassword(currentPassword)) {
    res.status(401).json({ error: "Current password is incorrect." });
    return;
  }

  await db.update(users).set({ passwordHash: hashPassword(newPassword) }).where(eq(users.id, user.id));
  res.json({ success: true });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { username } = req.body ?? {};
  if (!username || typeof username !== "string") {
    res.status(400).json({ error: "Username is required." });
    return;
  }
  const [user] = await db.select().from(users).where(eq(users.username, username.trim().toLowerCase()));
  if (!user) {
    res.json({ success: true, message: "If this account exists, a reset link would be sent. Please contact your lab administrator to reset your password." });
    return;
  }
  res.json({ success: true, message: "Account found. Please contact your PhiSphere AI administrator to reset your password, or use the admin panel to generate a new temporary password." });
});

router.post("/auth/change-username", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const [tokenRow] = await db.select().from(authTokens).where(eq(authTokens.token, token));
  if (!tokenRow) {
    res.status(401).json({ error: "Invalid or expired session." });
    return;
  }

  const { newUsername, currentPassword } = req.body ?? {};
  if (!newUsername || typeof newUsername !== "string" || newUsername.trim().length < 3) {
    res.status(400).json({ error: "New username must be at least 3 characters." });
    return;
  }
  if (!currentPassword) {
    res.status(400).json({ error: "Current password is required to change username." });
    return;
  }

  const cleanUsername = newUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (cleanUsername.length < 3) {
    res.status(400).json({ error: "Username must contain at least 3 alphanumeric characters." });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.id, tokenRow.userId));
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  if (user.passwordHash !== hashPassword(currentPassword)) {
    res.status(401).json({ error: "Current password is incorrect." });
    return;
  }

  const existing = await db.select().from(users).where(eq(users.username, cleanUsername));
  if (existing.length > 0 && existing[0].id !== user.id) {
    res.status(409).json({ error: "Username already taken. Please choose another." });
    return;
  }

  await db.update(users).set({ username: cleanUsername }).where(eq(users.id, user.id));
  res.json({ success: true, username: cleanUsername });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    await db.delete(authTokens).where(eq(authTokens.token, token));
  }

  res.json({ success: true });
});

router.delete("/auth/account", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const [tokenRow] = await db.select().from(authTokens).where(eq(authTokens.token, token));
  if (!tokenRow) {
    res.status(401).json({ error: "Invalid or expired token." });
    return;
  }

  const { currentPassword } = req.body ?? {};
  if (!currentPassword) {
    res.status(400).json({ error: "Current password is required to delete your account." });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.id, tokenRow.userId));
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  if (user.passwordHash !== hashPassword(currentPassword)) {
    res.status(401).json({ error: "Incorrect password. Account not deleted." });
    return;
  }

  await db.delete(authTokens).where(eq(authTokens.token, token));
  await db.delete(users).where(eq(users.id, user.id));

  res.json({ success: true });
});

router.post("/auth/change-plan", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const [tokenRow] = await db.select().from(authTokens).where(eq(authTokens.token, token));
  if (!tokenRow) {
    res.status(401).json({ error: "Invalid or expired token." });
    return;
  }

  const { plan } = req.body ?? {};
  if (plan !== "monthly" && plan !== "annual") {
    res.status(400).json({ error: "Plan must be 'monthly' or 'annual'." });
    return;
  }

  await db.update(users).set({ plan }).where(eq(users.id, tokenRow.userId));
  const [updated] = await db.select().from(users).where(eq(users.id, tokenRow.userId));

  res.json({ success: true, plan: updated.plan });
});

export default router;
