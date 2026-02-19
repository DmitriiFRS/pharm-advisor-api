import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    {
      name: 'Super Admin',
      slug: 'super-admin',
      ruName: 'Супер-администратор',
      admin: true,
    },
    {
      name: 'Admin',
      slug: 'admin',
      ruName: 'Администратор',
      admin: true,
    },
    {
      name: 'User',
      slug: 'user',
      ruName: 'Пользователь',
      admin: false,
    },
    {
      name: 'Moderator',
      slug: 'moderator',
      ruName: 'Модератор',
      admin: true,
    },
  ];

  let userRoleId: number | null = null;

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { slug: roleData.slug },
      update: {
        admin: roleData.admin,
      },
      create: {
        name: roleData.name,
        slug: roleData.slug,
        admin: roleData.admin,
      },
    });

    if (role.slug === 'user') {
      userRoleId = role.id;
    }

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

  if (!userRoleId) {
    throw new Error('User role not found');
  }

  // Create 10 verified users
  const salt = await bcrypt.genSalt();
  const password = await bcrypt.hash('111111', salt);

  for (let i = 1; i <= 10; i++) {
    const email = `user${i}@example.com`;
    await prisma.user.upsert({
      where: { email },
      update: {
        roleId: userRoleId,
        isVerified: true,
      },
      create: {
        email,
        password,
        name: `User ${i}`,
        phoneNumber: `+1234567890${i}`,
        roleId: userRoleId,
        isVerified: true,
      },
    });
    console.log(`Created user: ${email}`);
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
