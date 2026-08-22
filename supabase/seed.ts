// Semeia o utilizador inicial (a partir de variáveis de ambiente).
// Idempotente — pode correr-se várias vezes.
//
// Script TS (não SQL puro, ao contrário de schema.sql/policies.sql/
// seed.sql das categorias): criar um utilizador tem de passar pela Admin
// API do Supabase Auth (auth.admin.createUser), não por um "insert" direto
// — só ela sabe gerar o hash da password e criar a entrada em auth.users
// que o trigger handle_new_user (ver schema.sql) espera para criar o perfil.
//
//   npm run seed

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !chaveServico) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY em falta no .env.");
  process.exit(1);
}

const bd = createClient(url, chaveServico, { auth: { autoRefreshToken: false, persistSession: false } });

async function seedInitialUser() {
  const email = process.env.INITIAL_USER_EMAIL;
  const password = process.env.INITIAL_USER_PASSWORD;
  const name = process.env.INITIAL_USER_NAME ?? "Admin";

  if (!email || !password) {
    console.warn(
      "INITIAL_USER_EMAIL / INITIAL_USER_PASSWORD não definidos — nenhum utilizador foi criado."
    );
    return;
  }

  const { data: existentes, error: erroListar } = await bd.auth.admin.listUsers();
  if (erroListar) throw new Error(erroListar.message);

  const existente = existentes.users.find((u) => u.email === email);
  if (existente) {
    const { error } = await bd.auth.admin.updateUserById(existente.id, { password, user_metadata: { name } });
    if (error) throw new Error(error.message);
    console.log(`Utilizador "${email}" atualizado.`);
    return;
  }

  const { error } = await bd.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error) throw new Error(error.message);
  console.log(`Utilizador "${email}" criado.`);
}

seedInitialUser().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
