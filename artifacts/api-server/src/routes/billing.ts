import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, users, authTokens } from "@workspace/db";

const router: IRouter = Router();

const VALID_PROMOS: Record<string, { discount: number; label: string; description: string; type: "percent" | "days" }> = {
  "PHISPHERE20": { discount: 20, label: "20% Off", description: "20% discount applied to your next billing cycle", type: "percent" },
  "SCIENTIST50": { discount: 50, label: "50% Off", description: "50% discount applied to your next billing cycle", type: "percent" },
  "ANNUALDEAL": { discount: 33, label: "Annual Savings", description: "Equivalent of 4 months free when switching to annual", type: "percent" },
  "LABFREE30": { discount: 30, label: "30 Days Free", description: "30 additional days added to your subscription", type: "days" },
  "WELCOME15": { discount: 15, label: "15% Off", description: "Welcome discount — 15% off your subscription", type: "percent" },
};

async function getAuthUser(req: import("express").Request) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const [tokenRow] = await db.select().from(authTokens).where(eq(authTokens.token, token));
  if (!tokenRow) return null;
  const [user] = await db.select().from(users).where(eq(users.id, tokenRow.userId));
  return user ?? null;
}

router.post("/billing/promo", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const { code } = req.body ?? {};
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Promo code is required." });
    return;
  }

  const normalized = code.trim().toUpperCase();
  const promo = VALID_PROMOS[normalized];

  if (!promo) {
    res.status(400).json({ error: "Invalid promo code. Please check and try again." });
    return;
  }

  res.json({
    success: true,
    code: normalized,
    discount: promo.discount,
    label: promo.label,
    description: promo.description,
    type: promo.type,
    appliedAt: new Date().toISOString(),
  });
});

router.get("/billing/invoice", async (req, res): Promise<void> => {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const { from, to } = req.query;
  if (!from || !to || typeof from !== "string" || typeof to !== "string") {
    res.status(400).json({ error: "Date range (from, to) is required." });
    return;
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    res.status(400).json({ error: "Invalid date format." });
    return;
  }

  if (fromDate >= toDate) {
    res.status(400).json({ error: "Start date must be before end date." });
    return;
  }

  const planPrices: Record<string, { monthly: number; name: string }> = {
    monthly: { monthly: 29, name: "Monthly Plan" },
    annual: { monthly: 199 / 12, name: "Annual Plan" },
    free: { monthly: 0, name: "Free Plan" },
  };

  const planData = planPrices[user.plan ?? "free"] ?? planPrices.free;

  const msPerMonth = 30.44 * 24 * 60 * 60 * 1000;
  const durationMs = toDate.getTime() - fromDate.getTime();
  const months = durationMs / msPerMonth;
  const subtotal = planData.monthly * months;
  const tax = subtotal * 0.0;
  const total = subtotal + tax;

  res.json({
    invoiceNumber: `PHI-${user.id.toString().slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`,
    issuedAt: new Date().toISOString(),
    period: { from: fromDate.toISOString(), to: toDate.toISOString() },
    customer: {
      id: user.id,
      username: user.username,
    },
    plan: {
      name: planData.name,
      monthlyRate: planData.monthly,
    },
    lineItems: [
      {
        description: `${planData.name} subscription`,
        period: `${fromDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} – ${toDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
        quantity: parseFloat(months.toFixed(4)),
        unit: "months",
        unitPrice: planData.monthly,
        amount: parseFloat(subtotal.toFixed(2)),
      },
    ],
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    currency: "USD",
    status: total === 0 ? "complimentary" : "paid",
  });
});

export default router;
