import { z } from "zod";
import bcrypt from "bcryptjs";
import { createRouter, clientAuthedQuery } from "./middleware";
import { getRawDb } from "./queries/connection";

export const companyProfileRouter = createRouter({
  get: clientAuthedQuery.query(async ({ ctx }) => {
    try {
      const clientId = ctx.clientUser.clientId;
      console.log("[CompanyProfile] GET clientId:", clientId);
      const rawDb = getRawDb();
      const [rows] = await rawDb.query(
        "SELECT id, name, email, website, phone, description, domain, logoUrl, primaryColor, plan, status, apiKey FROM clients WHERE id = ? LIMIT 1",
        [clientId]
      );
      const result = (rows as any[])[0] || null;
      console.log("[CompanyProfile] GET result:", result ? JSON.stringify(result).substring(0,200) : "null");
      return result;
    } catch (err: any) {
      console.error("[CompanyProfile] GET ERROR:", err?.message || String(err));
      throw err;
    }
  }),

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
      try {
        const clientId = ctx.clientUser.clientId;
        console.log("[CompanyProfile] UPDATE clientId:", clientId);
        const rawDb = getRawDb();

        // Build SET clause dynamically - only update fields that exist in TiDB
        const sets: string[] = [];
        const values: any[] = [];

        if (input.name !== undefined) { sets.push("name = ?"); values.push(input.name); }
        if (input.email !== undefined) { sets.push("email = ?"); values.push(input.email); }
        if (input.website !== undefined) { sets.push("website = ?"); values.push(input.website); }
        if (input.phone !== undefined) { sets.push("phone = ?"); values.push(input.phone); }
        if (input.description !== undefined) { sets.push("description = ?"); values.push(input.description); }
        if (input.domain !== undefined) { sets.push("domain = ?"); values.push(input.domain); }
        if (input.logoUrl !== undefined) { sets.push("logoUrl = ?"); values.push(input.logoUrl); }
        if (input.primaryColor !== undefined) { sets.push("primaryColor = ?"); values.push(input.primaryColor); }

        if (sets.length === 0) {
          return { success: true };
        }

        values.push(clientId);
        const sql = `UPDATE clients SET ${sets.join(", ")} WHERE id = ?`;
        console.log("[CompanyProfile] UPDATE sql:", sql);

        await rawDb.query(sql, values);
        console.log("[CompanyProfile] UPDATE success");
        return { success: true };
      } catch (err: any) {
        console.error("[CompanyProfile] UPDATE ERROR:", err?.message || String(err));
        throw err;
      }
    }),

  updateLoginEmail: clientAuthedQuery
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newEmail: z.string().email().max(320),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.clientUser.id;
        const rawDb = getRawDb();

        // 1. Fetch current user with password hash
        const [userRows] = await rawDb.query(
          "SELECT id, email, password_hash as passwordHash, role FROM client_users WHERE id = ? LIMIT 1",
          [userId]
        );
        const user = (userRows as any[])[0];
        if (!user) throw new Error("User not found");

        // Protect super_admin
        if (user.role === "super_admin") {
          throw new Error("Cannot change super admin email through this endpoint");
        }

        // 2. Verify current password
        const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!valid) throw new Error("Current password is incorrect");

        // 3. Check if new email is already taken by another user
        const [existingRows] = await rawDb.query(
          "SELECT id FROM client_users WHERE email = ? AND id != ? LIMIT 1",
          [input.newEmail.toLowerCase(), userId]
        );
        if ((existingRows as any[]).length > 0) {
          throw new Error("This email is already in use by another account");
        }

        // 4. Update email in client_users
        await rawDb.query(
          "UPDATE client_users SET email = ?, updated_at = NOW() WHERE id = ?",
          [input.newEmail.toLowerCase(), userId]
        );

        // 5. Also update email in clients table (company contact email)
        await rawDb.query(
          "UPDATE clients SET email = ? WHERE id = ?",
          [input.newEmail.toLowerCase(), ctx.clientUser.clientId]
        );

        console.log("[CompanyProfile] UPDATE_LOGIN_EMAIL success:", userId);
        return { success: true, message: "Login email updated successfully" };
      } catch (err: any) {
        console.error("[CompanyProfile] UPDATE_LOGIN_EMAIL ERROR:", err?.message || String(err));
        throw err;
      }
    }),

  updatePassword: clientAuthedQuery
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.clientUser.id;
        const rawDb = getRawDb();

        // 1. Fetch current user with password hash
        const [userRows] = await rawDb.query(
          "SELECT id, password_hash as passwordHash, role FROM client_users WHERE id = ? LIMIT 1",
          [userId]
        );
        const user = (userRows as any[])[0];
        if (!user) throw new Error("User not found");

        // 2. Verify current password
        const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!valid) throw new Error("Current password is incorrect");

        // 3. Hash new password
        const newPasswordHash = await bcrypt.hash(input.newPassword, 12);

        // 4. Update password
        await rawDb.query(
          "UPDATE client_users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
          [newPasswordHash, userId]
        );

        console.log("[CompanyProfile] UPDATE_PASSWORD success:", userId);
        return { success: true, message: "Password updated successfully" };
      } catch (err: any) {
        console.error("[CompanyProfile] UPDATE_PASSWORD ERROR:", err?.message || String(err));
        throw err;
      }
    }),
});
