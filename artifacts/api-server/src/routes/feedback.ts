import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/feedback", async (req, res): Promise<void> => {
  const { type, subject, message, email } = req.body ?? {};

  if (!message || typeof message !== "string" || message.trim().length < 5) {
    res.status(400).json({ error: "Message is required (min 5 characters)." });
    return;
  }

  logger.info({
    event: "user_feedback",
    type: type ?? "other",
    subject: subject ?? "(no subject)",
    message: message.trim(),
    email: email ?? "(no email)",
    receivedAt: new Date().toISOString(),
  });

  res.json({ success: true });
});

export default router;
