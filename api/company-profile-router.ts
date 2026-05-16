import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { clients, vehicleImages } from "@db/schema";

export const companyProfileRouter = createRouter({
  // Get current client's company profile
  get: clientAuthedQuery.query(async ({ ctx }) => {
    const clientId = ctx.clientUser.clientId;
    const [client] = await getDb()
      .select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        website: clients.website,
        phone: clients.phone,
        description: clients.description,
        domain: clients.domain,
        logoUrl: clients.logoUrl,
        primaryColor: clients.primaryColor,
        taxRate: clients.taxRate,
        depositEnabled: clients.depositEnabled,
        depositPercentage: clients.depositPercentage,
        plan: clients.plan,
        status: clients.status,
        apiKey: clients.apiKey,
      })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    return client || null;
  }),

  // Update company profile
  update: clientAuthedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        email: z.string().email().max(320).optional(),
        website: z.string().max(255).nullable().optional(),
        phone: z.string().max(50).nullable().optional(),
        description: z.string().nullable().optional(),
        domain: z.string().max(255).nullable().optional(),
        logoUrl: z.string().nullable().optional(),
        primaryColor: z.string().max(7).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const clientId = ctx.clientUser.clientId;

      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.website !== undefined) updateData.website = input.website;
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.domain !== undefined) updateData.domain = input.domain;
      if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;
      if (input.primaryColor !== undefined) updateData.primaryColor = input.primaryColor;

      await getDb()
        .update(clients)
        .set(updateData)
        .where(eq(clients.id, clientId));

      return { success: true };
    }),

  // Get all vehicle image presets for this client
  getVehicleImages: clientAuthedQuery.query(async ({ ctx }) => {
    const clientId = ctx.clientUser.clientId;
    const images = await getDb()
      .select()
      .from(vehicleImages)
      .where(eq(vehicleImages.clientId, clientId));
    return images;
  }),

  // Upsert (create or update) a vehicle image preset
  upsertVehicleImage: clientAuthedQuery
    .input(
      z.object({
        id: z.number().optional(),
        vehicleType: z.string().min(1).max(100),
        imageUrl: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const clientId = ctx.clientUser.clientId;

      if (input.id) {
        // Update existing
        await getDb()
          .update(vehicleImages)
          .set({
            vehicleType: input.vehicleType,
            imageUrl: input.imageUrl,
          })
          .where(
            and(
              eq(vehicleImages.id, input.id),
              eq(vehicleImages.clientId, clientId)
            )
          );
        return { id: input.id, success: true };
      } else {
        // Insert new - check if type already exists for this client
        const [existing] = await getDb()
          .select({ id: vehicleImages.id })
          .from(vehicleImages)
          .where(
            and(
              eq(vehicleImages.clientId, clientId),
              eq(vehicleImages.vehicleType, input.vehicleType)
            )
          )
          .limit(1);

        if (existing) {
          // Update existing by type
          await getDb()
            .update(vehicleImages)
            .set({ imageUrl: input.imageUrl })
            .where(eq(vehicleImages.id, existing.id));
          return { id: existing.id, success: true };
        }

        // Insert new
        const [result] = await getDb()
          .insert(vehicleImages)
          .values({
            clientId,
            vehicleType: input.vehicleType,
            imageUrl: input.imageUrl,
          });
        return { id: Number(result.insertId), success: true };
      }
    }),

  // Delete a vehicle image preset
  deleteVehicleImage: clientAuthedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const clientId = ctx.clientUser.clientId;
      await getDb()
        .delete(vehicleImages)
        .where(
          and(
            eq(vehicleImages.id, input.id),
            eq(vehicleImages.clientId, clientId)
          )
        );
      return { success: true };
    }),
});
