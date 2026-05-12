import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User, ClientUser } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { authenticateClientUser } from "./client-auth-router";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
  clientUser?: ClientUser;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // OAuth auth is optional
  }
  try {
    ctx.clientUser = await authenticateClientUser(opts.req.headers);
  } catch {
    // Client auth is optional
  }
  return ctx;
}
