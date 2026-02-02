import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    {
      name: 'Super Admin',
      slug: 'super-admin',
      ruName: 'Супер-администратор',
    },
    {
      name: 'Admin',
      slug: 'admin',
      ruName: 'Администратор',
    },
    {
      name: 'User',
      slug: 'user',
      ruName: 'Пользователь',
    },
    {
      name: 'Moderator',
      slug: 'moderator',
      ruName: 'Модератор',
    },
  ];

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { slug: roleData.slug },
      update: {},
      create: {
        name: roleData.name,
        slug: roleData.slug,
      },
    });

    // Upsert Russian translation
    await prisma.roleTranslation.upsert({
      where: {
        roleId_locale: {
          roleId: role.id,
          locale: 'ru',
        },
      },
      update: {
        name: roleData.ruName,
      },
      create: {
        roleId: role.id,
        locale: 'ru',
        name: roleData.ruName,
      },
    });
    console.log(`Processed Russian translation for role: ${role.name}`);

    console.log(`Role ${role.name} processed.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
