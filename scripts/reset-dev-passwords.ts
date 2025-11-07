import bcrypt from "bcrypt";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

const DEV_PASSWORDS = {
  "investor@example.com": "investor123",
  "manager@example.com": "manager123",
  "investor2@example.com": "investor123"
};

async function resetDevPasswords() {
  console.log("🔐 Resetting development user passwords...\n");

  for (const [email, password] of Object.entries(DEV_PASSWORDS)) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, email))
        .returning();

      if (result.length > 0) {
        console.log(`✅ Reset password for: ${email}`);
        console.log(`   Username: ${result[0].username}`);
        console.log(`   Role: ${result[0].role}`);
        console.log(`   Password: ${password}\n`);
      } else {
        console.log(`⚠️  User not found: ${email}\n`);
      }
    } catch (error) {
      console.error(`❌ Error resetting password for ${email}:`, error);
    }
  }

  console.log("\n📋 Development Login Credentials:");
  console.log("═══════════════════════════════════════════════════════");
  console.log("\n👨‍💼 Manager Account:");
  console.log("   Email:    manager@example.com");
  console.log("   Password: manager123");
  console.log("   Role:     manager (full access)");
  
  console.log("\n💰 Investor Account 1:");
  console.log("   Email:    investor@example.com");
  console.log("   Password: investor123");
  console.log("   Role:     investor (portfolio view only)");
  
  console.log("\n💰 Investor Account 2:");
  console.log("   Email:    investor2@example.com");
  console.log("   Password: investor123");
  console.log("   Role:     investor (portfolio view only)");
  
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("⚠️  These are DEVELOPMENT credentials only!");
  console.log("   Never use these passwords in production.\n");

  process.exit(0);
}

resetDevPasswords().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
