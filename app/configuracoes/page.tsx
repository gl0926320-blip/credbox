import ConfiguracoesManager from "@/components/configuracoes/ConfiguracoesManager";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ConfiguracoesPage() {
  const [
    clientesResult,
    usuariosResult,
    configResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("clientes")
      .select(`
        id,
        nome,
        cpf,
        telefone,
        email,
        data_nascimento,
        status
      `)
      .order("nome", {
        ascending: true,
      }),

    supabaseAdmin
      .from("portal_usuarios")
      .select(`
        id,
        auth_user_id,
        cliente_id,
        ativo,
        primeiro_acesso,
        ultimo_acesso,
        created_at,

        clientes (
          id,
          nome,
          cpf,
          telefone,
          email
        )
      `)
      .order("created_at", {
        ascending: false,
      }),

    supabaseAdmin
      .from("portal_configuracoes")
      .select(`
        id,
        desconto_antecipacao_ativo,
        desconto_maximo_percentual,
        mensagem_antecipacao,
        mostrar_contratos,
        mostrar_comprovantes,
        mostrar_veiculo,
        created_at,
        updated_at
      `)
      .limit(1)
      .maybeSingle(),
  ]);

  if (clientesResult.error) {
    console.error(
      "Erro ao carregar clientes:",
      clientesResult.error
    );
  }

  if (usuariosResult.error) {
    console.error(
      "Erro ao carregar usuários do portal:",
      usuariosResult.error
    );
  }

  if (configResult.error) {
    console.error(
      "Erro ao carregar configurações do portal:",
      configResult.error
    );
  }

  return (
    <ConfiguracoesManager
      clients={
        clientesResult.data ?? []
      }
      portalUsers={
        usuariosResult.data ?? []
      }
      config={
        configResult.data ?? null
      }
    />
  );
}