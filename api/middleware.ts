import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

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

export const authedQuery = t.procedure.use(requireAuth);
export const adminQuery = authedQuery.use(requireRole("admin"));
export const clientAuthedQuery = t.procedure.use(requireClientAuth);
function requireClientRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.clientUser || ctx.clientUser.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient role. Super admin required.",
      });
    }
    return next({ ctx: { ...ctx, clientUser: ctx.clientUser } });
  });
}
function requireClientRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.clientUser || ctx.clientUser.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient role. Super admin required.",
      });
    }
    return next({ ctx: { ...ctx, clientUser: ctx.clientUser } });
  });
}
function requireClientRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.clientUser || ctx.clientUser.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient role. Super admin required.",
      });
    }
    return next({ ctx: { ...ctx, clientUser: ctx.clientUser } });
  });
}
function requireClientRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.clientUser || ctx.clientUser.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient role. Super admin required.",
      });
    }
    return next({ ctx: { ...ctx, clientUser: ctx.clientUser } });
  });
}
function requireClientRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.clientUser || ctx.clientUser.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient role. Super admin required.",
      });
    }
    return next({ ctx: { ...ctx, clientUser: ctx.clientUser } });
  });
}
function requireClientRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.clientUser || ctx.clientUser.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient role. Super admin required.",
      });
    }
    return next({ ctx: { ...ctx, clientUser: ctx.clientUser } });
  });
}
export const superAdminQuery = clientAuthedQuery.use(requireClientRole("super_admin"));
