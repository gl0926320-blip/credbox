import ClientesManager from "../../components/clientes/ClientesManager";
import { supabaseAdmin } from "../../lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClientesPage() {
  const [
    clientesResult,
    veiculosResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("clientes")
      .select(`
        id,
        nome,
        cpf,
        rg,
        telefone,
        telefone_secundario,
        email,
        data_nascimento,
        cnh,
        cep,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        contato_emergencia_nome,
        contato_emergencia_telefone,
        observacoes,
        status,
        created_at,

        cliente_veiculos (
          id,
          veiculo_id,
          tipo_vinculo,
          ativo,
          data_inicio,

          veiculos (
            id,
            tipo,
            marca,
            modelo,
            placa,
            ano_modelo,
            ano_fabricacao,
            status
          )
        )
      `)
      .order(
        "created_at",
        {
          ascending: false,
        }
      ),

    supabaseAdmin
      .from("veiculos")
      .select(`
        id,
        tipo,
        marca,
        modelo,
        placa,
        ano_modelo,
        ano_fabricacao,
        status
      `)
      .eq(
        "status",
        "disponivel"
      )
      .order(
        "marca",
        {
          ascending: true,
        }
      ),
  ]);

  if (
    clientesResult.error
  ) {
    console.error(
      "Erro clientes:",
      clientesResult.error
    );
  }

  if (
    veiculosResult.error
  ) {
    console.error(
      "Erro veículos disponíveis:",
      veiculosResult.error
    );
  }

  return (
    <ClientesManager
      initialClients={
        clientesResult.data ??
        []
      }
      availableVehicles={
        veiculosResult.data ??
        []
      }
    />
  );
}