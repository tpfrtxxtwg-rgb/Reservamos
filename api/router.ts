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
<<<<<<< HEAD
import { emailSettingsRouter } from "./email-settings-router";
import { emailRouter } from "./email-router";
=======
import { reportsRouter } from "./reports-router";
import { companyProfileRouter } from "./company-profile-router";
import { emailSettingsRouter } from "./email-settings-router";
import { paymentSettingsRouter } from "./payment-settings-router";
import { paypalRouter } from "./paypal-router";
import { couponRouter } from "./coupon-router";
import { stripeSubscriptionRouter } from "./stripe-subscription-router";
import { companiesRouter } from "./companies-router";

>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
import { createRouter, publicQuery } from "./middleware";
import { couponRouter } from "./coupon-router";
import { stripeSubscriptionRouter } from "./stripe-subscription-router";
import { companiesRouter } from "./companies-router";

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
<<<<<<< HEAD
  emailSettings: emailSettingsRouter,
  email: emailRouter,
=======
  reports: reportsRouter,
  companyProfile: companyProfileRouter,
  emailSettings: emailSettingsRouter,
  paymentSettings: paymentSettingsRouter,
  paypal: paypalRouter,
  coupon: couponRouter,
  stripeSubscription: stripeSubscriptionRouter,
  companies: companiesRouter,
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
});

export type AppRouter = typeof appRouter;

