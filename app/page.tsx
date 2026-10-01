import DashboardManager from "../components/dashboard/DashboardManager";
import { supabaseAdmin } from "../lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const [
    clientsResult,
    vehiclesResult,
    operationsResult,
    contractsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("clientes")
      .select(`
        id,
        nome,
        cpf,
        telefone,
        status,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      }),

    supabaseAdmin
      .from("veiculos")
      .select(`
        id,
        tipo,
        marca,
        modelo,
        placa,
        status,
        valor_compra,
        valor_fipe,
        valor_venda,
        created_at,

        cliente_veiculos (
          id,
          ativo,
          tipo_vinculo,

          clientes (
            id,
            nome
          )
        )
      `)
      .order("created_at", {
        ascending: false,
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
        entrada,
        caucao_prevista,
        caucao_recebida,
        caucao_status,
        quantidade_parcelas,
        valor_parcela,
        periodicidade,
        primeiro_vencimento,
        status,
        created_at,

        clientes (
          id,
          nome,
          telefone
        ),

        veiculos (
          id,
          marca,
          modelo,
          placa
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
            desconto_valor,
            created_at
          )
        )
      `)
      .order("created_at", {
        ascending: false,
      }),

    supabaseAdmin
      .from("contratos")
      .select(`
        id,
        titulo,
        numero,
        tipo,
        status,
        valor_contrato,
        data_assinatura,
        inicio_vigencia,
        fim_vigencia,
        created_at,

        clientes (
          id,
          nome
        )
      `)
      .order("created_at", {
        ascending: false,
      }),
  ]);

  if (clientsResult.error) {
    console.error(
      "Dashboard clientes:",
      clientsResult.error
    );
  }

  if (vehiclesResult.error) {
    console.error(
      "Dashboard veículos:",
      vehiclesResult.error
    );
  }

  if (operationsResult.error) {
    console.error(
      "Dashboard operações:",
      operationsResult.error
    );
  }

  if (contractsResult.error) {
    console.error(
      "Dashboard contratos:",
      contractsResult.error
    );
  }

  return (
    <DashboardManager
      clients={
        clientsResult.data ?? []
      }
      vehicles={
        vehiclesResult.data ?? []
      }
      operations={
        operationsResult.data ?? []
      }
      contracts={
        contractsResult.data ?? []
      }
    />
  );
}