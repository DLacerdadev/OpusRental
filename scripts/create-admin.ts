import bcrypt from "bcrypt";
import { db } from "../server/db";
import { users, tenants } from "../shared/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "admin@opuscapital.com";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Admin@2025!";
const DEFAULT_SLUG = "opus-rental";

async function createAdmin() {
  console.log("🔐 Configurando conta admin...\n");

  let tenant;

  const existingBySlug = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, DEFAULT_SLUG))
    .limit(1);

  if (existingBySlug.length > 0) {
    tenant = existingBySlug[0];
    console.log(`Tenant encontrado (slug=${DEFAULT_SLUG}): ${tenant.name} (${tenant.id})\n`);
  } else {
    const allTenants = await db.select().from(tenants).limit(5);
    if (allTenants.length > 0) {
      const updated = await db
        .update(tenants)
        .set({ slug: DEFAULT_SLUG })
        .where(eq(tenants.id, allTenants[0].id))
        .returning();
      tenant = updated[0];
      console.log(`Tenant atualizado para slug="${DEFAULT_SLUG}": ${tenant.name} (${tenant.id})\n`);
    } else {
      const inserted = await db
        .insert(tenants)
        .values({
          name: "Opus Capital",
          slug: DEFAULT_SLUG,
          subscriptionPlan: "enterprise",
          status: "active",
        })
        .returning();
      tenant = inserted[0];
      console.log(`✅ Tenant criado: ${tenant.name} (${tenant.id})\n`);
    }
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL));

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  if (existing.length > 0) {
    const result = await db
      .update(users)
      .set({ password: hashedPassword, role: "admin", tenantId: tenant.id })
      .where(eq(users.email, ADMIN_EMAIL))
      .returning();
    console.log(`✅ Conta admin atualizada: ${result[0].email}`);
    console.log(`   Role: ${result[0].role}`);
  } else {
    const result = await db
      .insert(users)
      .values({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        firstName: "Admin",
        lastName: "Opus Capital",
        role: "admin",
        tenantId: tenant.id,
      })
      .returning();
    console.log(`✅ Conta admin criada: ${result[0].email}`);
    console.log(`   ID: ${result[0].id}`);
    console.log(`   Role: ${result[0].role}`);
    console.log(`   Tenant: ${tenant.name} (slug=${tenant.slug})`);
  }

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("🛡️  Credenciais da Conta Admin:");
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Senha:    ${ADMIN_PASSWORD}`);
  console.log(`   Role:     admin (acesso máximo - financeiro completo)`);
  console.log("═══════════════════════════════════════════════════════\n");

  process.exit(0);
}

createAdmin().catch((error) => {
  console.error("Erro ao criar admin:", error);
  process.exit(1);
});
