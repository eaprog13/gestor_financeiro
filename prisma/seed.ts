import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

// Categorias base sugeridas para o dia a dia. `isDefault` impede que sejam
// apagadas por engano; o utilizador pode sempre criar categorias novas.
const defaultCategories = [
  { name: "Supermercado", icon: "ShoppingCart", color: "#16a34a" },
  { name: "Farmácia", icon: "Pill", color: "#dc2626" },
  { name: "Gasolina", icon: "Fuel", color: "#ea580c" },
  { name: "Eletricidade", icon: "Zap", color: "#eab308" },
  { name: "Gás", icon: "Flame", color: "#f97316" },
  { name: "Água", icon: "Droplet", color: "#0ea5e9" },
  { name: "Renda / Prestação", icon: "Home", color: "#7c3aed" },
  { name: "Internet", icon: "Wifi", color: "#2563eb" },
  { name: "Telemóvel", icon: "Smartphone", color: "#4f46e5" },
  { name: "Restaurante", icon: "UtensilsCrossed", color: "#db2777" },
  { name: "Transportes", icon: "Bus", color: "#0d9488" },
  { name: "Saúde", icon: "HeartPulse", color: "#e11d48" },
  { name: "Lazer", icon: "Gamepad2", color: "#9333ea" },
  { name: "Roupa", icon: "Shirt", color: "#0891b2" },
  { name: "Educação", icon: "GraduationCap", color: "#65a30d" },
  { name: "Outros", icon: "MoreHorizontal", color: "#6b7280" },
] as const;

async function main() {
  for (const [index, category] of defaultCategories.entries()) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: { ...category, isDefault: true, order: index },
    });
  }
  console.log(`Categorias base garantidas: ${defaultCategories.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
