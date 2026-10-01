import ContratosManager from "../../components/contratos/ContratosManager";
import { supabaseAdmin } from "../../lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContratosPage() {
  const [
    contratosResult,
    clientesResult,
    operacoesResult,
    veiculosResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("contratos")
      .select(`
        id,
        cliente_id,
        operacao_id,
        veiculo_id,
        numero,
        titulo,
        tipo,
        data_assinatura,
        inicio_vigencia,
        fim_vigencia,
        valor_contrato,
        status,
        observacoes,
        created_at,

        clientes (
          id,
          nome,
          cpf,
          telefone
        ),

        operacoes (
          id,
          cliente_id,
          veiculo_id,
          tipo,
          descricao,
          valor_total,
          status
        ),

        veiculos (
          id,
          marca,
          modelo,
          placa
        ),

        contrato_arquivos (
          id,
          nome_arquivo,
          caminho_storage,
          mime_type,
          tamanho_bytes,
          created_at
        )
      `)
      .order("created_at", {
        ascending: false,
      }),

    supabaseAdmin
      .from("clientes")
      .select(`
        id,
        nome,
        cpf,
        telefone,
        status
      `)
      .order("nome", {
        ascending: true,
      }),

    supabaseAdmin
      .from("operacoes")
      .select(`
        id,
        cliente_id,
        veiculo_id,
        tipo,
        descricao,
        valor_total,
        status,

        clientes (
          id,
          nome,
          cpf,
          telefone
        ),

        veiculos (
          id,
          marca,
          modelo,
          placa
        )
      `)
      .order("created_at", {
        ascending: false,
      }),

    supabaseAdmin
      .from("veiculos")
      .select(`
        id,
        marca,
        modelo,
        placa,
        status
      `)
      .order("marca", {
        ascending: true,
      }),
  ]);

  if (contratosResult.error) {
    console.error(
      "Erro contratos:",
      contratosResult.error
    );
  }

  if (clientesResult.error) {
    console.error(
      "Erro clientes:",
      clientesResult.error
    );
  }

  if (operacoesResult.error) {
    console.error(
      "Erro operações:",
      operacoesResult.error
    );
  }

  if (veiculosResult.error) {
    console.error(
      "Erro veículos:",
      veiculosResult.error
    );
  }

  return (
    <ContratosManager
      initialContracts={
        contratosResult.data ?? []
      }
      clients={
        clientesResult.data ?? []
      }
      operations={
        operacoesResult.data ?? []
      }
      vehicles={
        veiculosResult.data ?? []
      }
    />
  );
}