import { db } from "./db";
import { storage } from "./storage";
import {
  users,
  trailers,
  shares,
  payments,
  trackingData,
  documents,
  auditLogs,
  financialRecords,
} from "@shared/schema";

async function seed() {
  console.log("Starting database seed...");

  // Create users
  const investor = await storage.createUser({
    username: "investor1",
    email: "investor@example.com",
    password: "password123",
    firstName: "John",
    lastName: "Investor",
    role: "investor",
  });

  const manager = await storage.createUser({
    username: "manager1",
    email: "manager@example.com",
    password: "password123",
    firstName: "Jane",
    lastName: "Manager",
    role: "manager",
  });

  console.log("Users created");

  // Create trailers
  const trailer1 = await storage.createTrailer({
    trailerId: "TR001",
    purchaseValue: "50000.00",
    purchaseDate: "2024-01-15",
    status: "active",
    currentValue: "48000.00",
    depreciationRate: "0.05",
    expirationDate: "2027-01-15",
    location: "Los Angeles, CA",
    latitude: "34.0522",
    longitude: "-118.2437",
    lastActivity: new Date(),
  });

  const trailer2 = await storage.createTrailer({
    trailerId: "TR002",
    purchaseValue: "55000.00",
    purchaseDate: "2024-03-20",
    status: "active",
    currentValue: "53500.00",
    depreciationRate: "0.05",
    expirationDate: "2027-03-20",
    location: "Miami, FL",
    latitude: "25.7617",
    longitude: "-80.1918",
    lastActivity: new Date(),
  });

  const trailer3 = await storage.createTrailer({
    trailerId: "TR003",
    purchaseValue: "48000.00",
    purchaseDate: "2023-06-10",
    status: "active",
    currentValue: "45000.00",
    depreciationRate: "0.05",
    expirationDate: "2026-06-10",
    location: "Chicago, IL",
    latitude: "41.8781",
    longitude: "-87.6298",
    lastActivity: new Date(),
  });

  const trailer4 = await storage.createTrailer({
    trailerId: "TR004",
    purchaseValue: "52000.00",
    purchaseDate: "2024-09-01",
    status: "stock",
    currentValue: "52000.00",
    depreciationRate: "0.05",
    expirationDate: "2027-09-01",
    location: "Warehouse - Texas",
    latitude: "29.7604",
    longitude: "-95.3698",
    lastActivity: new Date(),
  });

  console.log("Trailers created");

  // Create shares for investor
  const share1 = await storage.createShare({
    userId: investor.id,
    trailerId: trailer1.id,
    purchaseValue: "50000.00",
    purchaseDate: "2024-01-15",
    status: "active",
    monthlyReturn: "2.00",
    totalReturns: "9000.00",
  });

  const share2 = await storage.createShare({
    userId: investor.id,
    trailerId: trailer2.id,
    purchaseValue: "55000.00",
    purchaseDate: "2024-03-20",
    status: "active",
    monthlyReturn: "2.00",
    totalReturns: "6600.00",
  });

  const share3 = await storage.createShare({
    userId: investor.id,
    trailerId: trailer3.id,
    purchaseValue: "48000.00",
    purchaseDate: "2023-06-10",
    status: "active",
    monthlyReturn: "2.00",
    totalReturns: "14400.00",
  });

  console.log("Shares created");

  // Create payments
  const months = [
    "September/2024",
    "August/2024",
    "July/2024",
    "June/2024",
    "May/2024",
    "April/2024",
  ];

  for (const month of months) {
    const total = 1000 + 1100 + 960; // 2% of each share value
    await storage.createPayment({
      shareId: share1.id,
      userId: investor.id,
      amount: total.toFixed(2),
      paymentDate: new Date().toISOString().split("T")[0],
      status: "paid",
      referenceMonth: month,
    });
  }

  console.log("Payments created");

  // Create tracking data
  await storage.createTrackingData({
    trailerId: trailer1.id,
    latitude: "34.0522",
    longitude: "-118.2437",
    speed: "65.5",
    location: "Los Angeles, CA",
    status: "moving",
    distanceToday: "350.5",
  });

  await storage.createTrackingData({
    trailerId: trailer2.id,
    latitude: "25.7617",
    longitude: "-80.1918",
    speed: "0",
    location: "Miami, FL",
    status: "stopped",
    distanceToday: "0",
  });

  await storage.createTrackingData({
    trailerId: trailer3.id,
    latitude: "41.8781",
    longitude: "-87.6298",
    speed: "55.0",
    location: "Chicago, IL",
    status: "moving",
    distanceToday: "280.0",
  });

  console.log("Tracking data created");

  // Create documents
  await storage.createDocument({
    userId: investor.id,
    shareId: share1.id,
    documentType: "contract",
    fileName: "Contract_TR001.pdf",
    fileUrl: "/documents/contract_tr001.pdf",
    status: "verified",
  });

  await storage.createDocument({
    userId: investor.id,
    shareId: share2.id,
    documentType: "contract",
    fileName: "Contract_TR002.pdf",
    fileUrl: "/documents/contract_tr002.pdf",
    status: "verified",
  });

  console.log("Documents created");

  // Create audit logs
  await storage.createAuditLog({
    userId: investor.id,
    action: "login",
    entityType: "user",
    entityId: investor.id,
    details: { success: true },
    ipAddress: "192.168.1.1",
  });

  await storage.createAuditLog({
    userId: manager.id,
    action: "create_trailer",
    entityType: "trailer",
    entityId: trailer4.id,
    details: { trailerId: "TR004" },
    ipAddress: "192.168.1.2",
  });

  console.log("Audit logs created");

  // Create financial records
  await storage.createFinancialRecord({
    month: "September/2024",
    totalRevenue: "30600.00",
    investorPayouts: "22950.00",
    operationalCosts: "2000.00",
    companyMargin: "5650.00",
  });

  await storage.createFinancialRecord({
    month: "August/2024",
    totalRevenue: "30600.00",
    investorPayouts: "22950.00",
    operationalCosts: "2000.00",
    companyMargin: "5650.00",
  });

  console.log("Financial records created");

  console.log("\n✅ Database seeded successfully!");
  console.log("\nTest credentials:");
  console.log("Investor: investor@example.com / password123");
  console.log("Manager: manager@example.com / password123");
}

seed()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
