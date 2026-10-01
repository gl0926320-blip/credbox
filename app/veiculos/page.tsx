import VeiculosManager from "../../components/veiculos/VeiculosManager";

import { supabaseAdmin } from "../../lib/supabase/admin";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

export default async function VeiculosPage() {
  const { data, error } =
    await supabaseAdmin
      .from("veiculos")
      .select(`
        id,
        tipo,
        marca,
        modelo,
        versao,
        ano_fabricacao,
        ano_modelo,
        placa,
        renavam,
        chassi,
        cor,
        combustivel,
        cambio,
        quilometragem,
        valor_compra,
        valor_fipe,
        valor_venda,
        data_compra,
        status,
        observacoes,
        created_at,

        veiculo_documentos (
          id,
          tipo,
          nome_arquivo,
          caminho_storage
        ),

        cliente_veiculos (
          id,
          ativo,
          tipo_vinculo,
          data_inicio,

          clientes (
            id,
            nome,
            cpf,
            telefone
          )
        )
      `)
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

  if (error) {
    console.error(
      "ERRO VEICULOS:",
      error
    );
  }

  return (
    <VeiculosManager
      initialVehicles={
        data ?? []
      }
    />
  );
}