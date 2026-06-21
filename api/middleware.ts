import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { validateClientSubscription } from "./lib/subscription-check";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

function requireRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

const requireClientAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.clientUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, clientUser: ctx.clientUser } });
});

/**
 * Validates that the authenticated client has an active subscription
 * (trial or paid). Throws FORBIDDEN with subscriptionExpired code
 * if the subscription has expired or been cancelled.
 */
const requireActiveSubscription = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.clientUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  const check = await validateClientSubscription(ctx.clientUser.clientId);

  if (!check.valid) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: check.reason,
      cause: { code: "subscriptionExpired", status: check.status },
    });
  }

  return next({ ctx: { ...ctx, clientUser: ctx.clientUser } });
});

/**
 * Check client user role (for client_users table, not users table)
 */
function requireClientRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.clientUser || ctx.clientUser.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, clientUser: ctx.clientUser } });
  });
}

export const authedQuery = t.procedure.use(requireAuth);
export const adminQuery = authedQuery.use(requireRole("admin"));
export const clientAuthedQuery = t.procedure.use(requireClientAuth);
export const clientSubscribedQuery = t.procedure.use(requireClientAuth).use(requireActiveSubscription);
export const superAdminQuery = clientAuthedQuery.use(requireClientRole("super_admin"));
