import OperacoesManager from "../../components/operacoes/OperacoesManager";
import { supabaseAdmin } from "../../lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OperacoesPage() {
  const [
    operacoesResult,
    clientesResult,
    veiculosResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("operacoes")
      .select(`
        id,
        cliente_id,
        veiculo_id,
        tipo,
        descricao,
        valor_total,
        entrada,
        caucao_prevista,
        caucao_recebida,
        caucao_status,
        quantidade_parcelas,
        valor_parcela,
        periodicidade,
        primeiro_vencimento,
        status,
        observacoes,
        created_at,

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
          placa,
          status
        ),

        parcelas (
          id,
          numero,
          vencimento,
          valor,
          valor_pago,
          desconto_valor,
          status,
          pago_em,

          pagamentos (
            id,
            valor,
            data_pagamento,
            forma_pagamento,
            comprovante_path,
            desconto_percentual,
            desconto_valor
          )
        ),

        operacao_documentos (
          id,
          tipo,
          nome_arquivo,
          caminho_storage
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
      .eq("status", "ativo")
      .order("nome"),

    supabaseAdmin
      .from("veiculos")
      .select(`
        id,
        marca,
        modelo,
        placa,
        ano_modelo,
        ano_fabricacao,
        status
      `)
      .order("marca"),
  ]);

  if (operacoesResult.error) {
    console.error(
      "Erro operações:",
      operacoesResult.error
    );
  }

  if (clientesResult.error) {
    console.error(
      "Erro clientes:",
      clientesResult.error
    );
  }

  if (veiculosResult.error) {
    console.error(
      "Erro veículos:",
      veiculosResult.error
    );
  }

  return (
    <OperacoesManager
      initialOperations={
        operacoesResult.data ?? []
      }
      clients={
        clientesResult.data ?? []
      }
      vehicles={
        veiculosResult.data ?? []
      }
    />
  );
}