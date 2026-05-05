import { authRouter } from "./auth-router";
import { widgetRouter } from "./widget-router";
import { clientRouter } from "./client-router";
import { vehicleRouter } from "./vehicle-router";
import { serviceRouter } from "./service-router";
import { bookingRouter } from "./booking-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  widget: widgetRouter,
  tenant: clientRouter,
  vehicle: vehicleRouter,
  service: serviceRouter,
  booking: bookingRouter,
});

export type AppRouter = typeof appRouter;
