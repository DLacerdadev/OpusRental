import { db } from "../server/db";
import { tenants, users, trailers, shares, rentalClients, rentalContracts, gpsDevices, partnerShops, brokerDispatches, auditLogs, financialRecords } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

async function seedDefaultTenant() {
  console.log("🏢 Creating default tenant for multi-tenancy...");

  try {
    // Create default tenant
    const [defaultTenant] = await db
      .insert(tenants)
      .values({
        name: "Opus Rental Capital",
        slug: "opus-rental",
        domain: null,
        logoUrl: null,
        primaryColor: "#2563eb",
        secondaryColor: "#3b82f6",
        accentColor: "#1d4ed8",
        subscriptionPlan: "enterprise",
        billingEmail: "billing@opusrentalcapital.com",
        maxUsers: 1000,
        maxTrailers: 10000,
        status: "active",
      })
      .onConflictDoNothing()
      .returning();

    if (!defaultTenant) {
      console.log("✅ Default tenant already exists");
      const [existingTenant] = await db.select().from(tenants).where(eq(tenants.slug, "opus-rental")).limit(1);
      if (existingTenant) {
        console.log(`✅ Using existing tenant: ${existingTenant.name} (${existingTenant.id})`);
        return existingTenant.id;
      }
      throw new Error("Failed to create or find default tenant");
    }

    const tenantId = defaultTenant.id;
    console.log(`✅ Created default tenant: ${defaultTenant.name} (${tenantId})`);

    // Update all users to have tenantId
    const usersUpdated = await db
      .update(users)
      .set({ tenantId })
      .where(isNull(users.tenantId));
    console.log(`✅ Updated users with tenant: ${usersUpdated.rowCount} rows`);

    // Update all trailers to have tenantId
    const trailersUpdated = await db
      .update(trailers)
      .set({ tenantId })
      .where(isNull(trailers.tenantId));
    console.log(`✅ Updated trailers with tenant: ${trailersUpdated.rowCount} rows`);

    // Update all shares to have tenantId
    const sharesUpdated = await db
      .update(shares)
      .set({ tenantId })
      .where(isNull(shares.tenantId));
    console.log(`✅ Updated shares with tenant: ${sharesUpdated.rowCount} rows`);

    // Update all rental clients to have tenantId
    const clientsUpdated = await db
      .update(rentalClients)
      .set({ tenantId })
      .where(isNull(rentalClients.tenantId));
    console.log(`✅ Updated rental clients with tenant: ${clientsUpdated.rowCount} rows`);

    // Update all rental contracts to have tenantId
    const contractsUpdated = await db
      .update(rentalContracts)
      .set({ tenantId })
      .where(isNull(rentalContracts.tenantId));
    console.log(`✅ Updated rental contracts with tenant: ${contractsUpdated.rowCount} rows`);

    // Update all GPS devices to have tenantId
    const gpsUpdated = await db
      .update(gpsDevices)
      .set({ tenantId })
      .where(isNull(gpsDevices.tenantId));
    console.log(`✅ Updated GPS devices with tenant: ${gpsUpdated.rowCount} rows`);

    // Update all partner shops to have tenantId
    const shopsUpdated = await db
      .update(partnerShops)
      .set({ tenantId })
      .where(isNull(partnerShops.tenantId));
    console.log(`✅ Updated partner shops with tenant: ${shopsUpdated.rowCount} rows`);

    // Update all broker dispatches to have tenantId
    const dispatchesUpdated = await db
      .update(brokerDispatches)
      .set({ tenantId })
      .where(isNull(brokerDispatches.tenantId));
    console.log(`✅ Updated broker dispatches with tenant: ${dispatchesUpdated.rowCount} rows`);

    // Update all audit logs to have tenantId
    const auditUpdated = await db
      .update(auditLogs)
      .set({ tenantId })
      .where(isNull(auditLogs.tenantId));
    console.log(`✅ Updated audit logs with tenant: ${auditUpdated.rowCount} rows`);

    // Update all financial records to have tenantId
    const financialUpdated = await db
      .update(financialRecords)
      .set({ tenantId })
      .where(isNull(financialRecords.tenantId));
    console.log(`✅ Updated financial records with tenant: ${financialUpdated.rowCount} rows`);

    console.log("\n🎉 Multi-tenancy migration completed successfully!");
    console.log(`📊 All existing data now belongs to tenant: ${defaultTenant.name}`);
    
    return tenantId;
  } catch (error) {
    console.error("❌ Error seeding default tenant:", error);
    throw error;
  }
}

// Run the seeder
seedDefaultTenant()
  .then(() => {
    console.log("✅ Seeder completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeder failed:", error);
    process.exit(1);
  });
