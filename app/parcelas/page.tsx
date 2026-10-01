import ParcelasManager from "../../components/parcelas/ParcelasManager";
import { supabaseAdmin } from "../../lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ParcelasPage() {
  const { data, error } =
    await supabaseAdmin
      .from("parcelas")
      .select(`
        id,
        operacao_id,
        numero,
        vencimento,
        valor,
        valor_pago,
        desconto_valor,
        status,
        pago_em,
        observacoes,
        created_at,

        operacoes (
          id,
          tipo,
          descricao,
          valor_total,
          quantidade_parcelas,
          valor_parcela,
          periodicidade,
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
        ),

        pagamentos (
          id,
          valor,
          data_pagamento,
          forma_pagamento,
          comprovante_path,
          desconto_percentual,
          desconto_valor,
          observacoes,
          created_at
        )
      `)
      .order(
        "vencimento",
        {
          ascending: true,
        }
      );

  if (error) {
    console.error(
      "Erro ao carregar parcelas:",
      error
    );
  }

  return (
    <ParcelasManager
      initialInstallments={
        data ?? []
      }
    />
  );
}