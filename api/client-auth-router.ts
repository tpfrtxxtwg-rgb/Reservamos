import { z } from "zod";
import * as cookie from "cookie";
import bcrypt from "bcryptjs";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { clients, clientUsers, services } from "@db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const SESSION_COOKIE = "client_session";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateApiKey(): string {
  return `rv_${nanoid(16)}`;
}

function serializeSession(session: { userId: number; clientId: number }): string {
  return Buffer.from(JSON.stringify(session)).toString("base64");
}

function parseSession(token: string): { userId: number; clientId: number } | null {
  try {
    return JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

function getCookieOptions(headers: Headers) {
  const host = headers.get("host") ?? "";
  const secure = !host.includes("localhost") && !host.includes("127.0.0.1");
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

export async function authenticateClientUser(headers: Headers) {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return undefined;
  const cookies = cookie.parse(cookieHeader);
  const token = cookies[SESSION_COOKIE];
  if (!token) return undefined;
  const session = parseSession(token);
  if (!session) return undefined;
  const db = getDb();
  const user = await db.query.clientUsers.findFirst({
    where: eq(clientUsers.id, session.userId),
  });
  if (!user || !user.active) return undefined;
  return user;
}

export const clientAuthRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        companyName: z.string().min(2).max(255),
        name: z.string().min(2).max(255),
        email: z.string().email().max(320),
        password: z.string().min(6).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      // Check if email already exists
      const existing = await db.query.clientUsers.findFirst({
        where: eq(clientUsers.email, input.email),
      });
      if (existing) {
        throw new Error("Email already registered");
      }

      // Create client (tenant) - use $returningId for MySQL
      const apiKey = generateApiKey();
      const [{ id: clientId }] = await db
        .insert(clients)
        .values({
          name: input.companyName,
          email: input.email,
          apiKey,
        })
        .$returningId();

      const client = await db.query.clients.findFirst({
        where: eq(clients.id, clientId),
      });
      if (!client) throw new Error("Failed to create client");

      // Create owner user - use $returningId for MySQL
      const passwordHash = await hashPassword(input.password);
      const [{ id: userId }] = await db
        .insert(clientUsers)
        .values({
          clientId: clientId,
          email: input.email,
          passwordHash,
          name: input.name,
          role: "owner",
        })
        .$returningId();

      // Auto-create default services for the new client
      await db.insert(services).values([
        { clientId: clientId, name: "Airport Transfer", slug: "airport-transfer", icon: "AirplaneLanding", description: "Private transfer from/to the airport", basePrice: "0.00", active: true, sortOrder: 0 },
        { clientId: clientId, name: "Private Tour", slug: "private-tour", icon: "MapTrifold", description: "Custom private tours and excursions", basePrice: "0.00", active: true, sortOrder: 1 },
        { clientId: clientId, name: "Hourly Service", slug: "hourly", icon: "Clock", description: "Vehicle and driver at your disposal", basePrice: "0.00", active: true, sortOrder: 2 },
      ]);

      // Create session cookie
      const session = serializeSession({ userId, clientId });
      const opts = getCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(SESSION_COOKIE, session, opts)
      );

      return {
        success: true,
        user: {
          id: userId,
          name: input.name,
          email: input.email,
          role: "owner",
          clientId,
        },
      };
    }),

  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const user = await db.query.clientUsers.findFirst({
        where: eq(clientUsers.email, input.email),
      });
      if (!user || !user.active) {
        throw new Error("Invalid credentials");
      }

      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        throw new Error("Invalid credentials");
      }

      // Update last sign in
      await db
        .update(clientUsers)
        .set({ lastSignInAt: new Date() })
        .where(eq(clientUsers.id, user.id));

      const session = serializeSession({ userId: user.id, clientId: user.clientId });
      const opts = getCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(SESSION_COOKIE, session, opts)
      );

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clientId: user.clientId,
        },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const cookieHeader = ctx.req.headers.get("cookie");
    if (!cookieHeader) return null;

    const cookies = cookie.parse(cookieHeader);
    const token = cookies[SESSION_COOKIE];
    if (!token) return null;

    const session = parseSession(token);
    if (!session) return null;

    const db = getDb();
    const user = await db.query.clientUsers.findFirst({
      where: eq(clientUsers.id, session.userId),
    });
    if (!user || !user.active) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
    };
  }),

  logout: publicQuery.mutation(async ({ ctx }) => {
    const opts = getCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(SESSION_COOKIE, "", { ...opts, maxAge: 0 })
    );
    return { success: true };
  }),
});
