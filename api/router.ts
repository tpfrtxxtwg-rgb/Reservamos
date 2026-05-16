import { authRouter } from "./auth-router";
import { clientAuthRouter } from "./client-auth-router";
import { widgetRouter } from "./widget-router";
import { tenantRouter } from "./client-router";
import { vehicleRouter } from "./vehicle-router";
import { serviceRouter } from "./service-router";
import { zoneRouter } from "./zone-router";
import { destinationRouter } from "./destination-router";
import { vehicleZonePriceRouter } from "./vehicle-zone-price-router";
import { optionalServiceRouter } from "./optional-service-router";
import { clientSettingsRouter } from "./client-settings-router";
import { bookingRouter } from "./booking-router";
import { serviceAirportRouter } from "./service-airport-router";
import { serviceTourRouter } from "./service-tour-router";
import { emailSettingsRouter } from "./email-settings-router";
import { emailRouter } from "./email-router";
import { companyProfileRouter } from "./company-profile-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  clientAuth: clientAuthRouter,
  widget: widgetRouter,
  tenant: tenantRouter,
  vehicle: vehicleRouter,
  service: serviceRouter,
  zone: zoneRouter,
  destination: destinationRouter,
  vehicleZonePrice: vehicleZonePriceRouter,
  optionalService: optionalServiceRouter,
  clientSettings: clientSettingsRouter,
  booking: bookingRouter,
  serviceAirport: serviceAirportRouter,
  serviceTour: serviceTourRouter,
  emailSettings: emailSettingsRouter,
  email: emailRouter,
  companyProfile: companyProfileRouter,
});

export type AppRouter = typeof appRouter;