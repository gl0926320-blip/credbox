import {
  redirect,
} from "next/navigation";

import {
  CalendarDays,
  Car,
  CheckCircle2,
  FileText,
  Gauge,
  MessageCircle,
  Percent,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

import PortalLogoutButton from "@/components/portal/PortalLogoutButton";

import PortalParcelasTable from "@/components/portal/PortalParcelasTable";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

type AnyRow =
  Record<
    string,
    any
  >;

function single<T>(
  value:
    | T
    | T[]
    | null
    | undefined
): T | null {
  if (
    Array.isArray(
      value
    )
  ) {
    return (
      value[0] ??
      null
    );
  }

  return (
    value ??
    null
  );
}

function currency(
  value:
    | number
    | null
    | undefined
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    }
  ).format(
    Number(
      value ?? 0
    )
  );
}

function formatDate(
  value?:
    | string
    | null
) {
  if (!value) {
    return "—";
  }

  const dateOnly =
    value.slice(
      0,
      10
    );

  const [
    year,
    month,
    day,
  ] =
    dateOnly.split(
      "-"
    );

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function firstName(
  fullName?: string | null
) {
  if (!fullName) {
    return "Cliente";
  }

  return (
    fullName
      .trim()
      .split(/\s+/)[0] ||
    "Cliente"
  );
}

function normalizePhone(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  let phone =
    value.replace(
      /\D/g,
      ""
    );

  if (
    phone &&
    !phone.startsWith(
      "55"
    )
  ) {
    phone =
      `55${phone}`;
  }

  return phone;
}

function operationName(
  value?: string | null
) {
  const map:
    Record<
      string,
      string
    > = {
    locacao_compra:
      "Locação com compra final",

    venda_veiculo:
      "Venda de veículo",

    venda_parcelada:
      "Venda parcelada",

    emprestimo:
      "Empréstimo",

    outro:
      "Operação financeira",
  };

  return (
    map[
      value ?? ""
    ] ??
    value ??
    "Operação financeira"
  );
}

export default async function PortalPage() {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/portal/login"
    );
  }

  /*
   * USUÁRIO DO PORTAL
   */

  const {
    data:
      portalUser,
  } =
    await supabaseAdmin
      .from(
        "portal_usuarios"
      )
      .select(`
        id,
        cliente_id,
        ativo,
        primeiro_acesso
      `)
      .eq(
        "auth_user_id",
        user.id
      )
      .maybeSingle();

  if (
    !portalUser ||
    !portalUser.ativo
  ) {
    redirect(
      "/portal/login"
    );
  }

  const clienteId =
    portalUser.cliente_id;

  /*
   * CLIENTE
   */

  const {
    data:
      client,
  } =
    await supabaseAdmin
      .from(
        "clientes"
      )
      .select(`
        id,
        nome,
        cpf,
        telefone,
        email
      `)
      .eq(
        "id",
        clienteId
      )
      .maybeSingle();

  /*
   * OPERAÇÕES
   */

  const {
    data:
      operations,
  } =
    await supabaseAdmin
      .from(
        "operacoes"
      )
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

        veiculos (
          id,
          tipo,
          marca,
          modelo,
          placa,
          renavam,
          chassi,
          ano_fabricacao,
          ano_modelo,
          cor,
          combustivel,
          cambio,
          quilometragem,
          valor_compra,
          valor_fipe,
          valor_venda
        ),

        parcelas (
          id,
          numero,
          vencimento,
          valor,
          valor_pago,
          desconto_valor,
          status,
          pago_em
        )
      `)
      .eq(
        "cliente_id",
        clienteId
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      );

  const safeOperations =
    operations ??
    [];

  const mainOperation =
    safeOperations.find(
      (
        operation
      ) =>
        operation.status ===
        "ativa"
    ) ??
    safeOperations[0] ??
    null;

  const vehicle =
    mainOperation
      ? single(
          mainOperation.veiculos
        )
      : null;

  const installments =
    mainOperation &&
    Array.isArray(
      mainOperation.parcelas
    )
      ? mainOperation.parcelas
      : [];

  /*
   * CONTRATO + ARQUIVOS
   */

  const {
    data:
      contracts,
  } =
    await supabaseAdmin
      .from(
        "contratos"
      )
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

        contrato_arquivos (
          id,
          nome_arquivo,
          caminho_storage,
          mime_type,
          tamanho_bytes,
          created_at
        )
      `)
      .eq(
        "cliente_id",
        clienteId
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      );

  const safeContracts =
    contracts ?? [];

  const currentContract =
    safeContracts.find(
      (
        contract
      ) =>
        contract.operacao_id ===
        mainOperation?.id
    ) ??
    safeContracts[0] ??
    null;

  /*
   * GERA URLs TEMPORÁRIAS
   * PARA ARQUIVOS PRIVADOS
   */

  const contractFiles:
    {
      id: string;
      name: string;
      url: string;
      type?: string | null;
    }[] = [];

  if (
    currentContract &&
    Array.isArray(
      currentContract.contrato_arquivos
    )
  ) {
    for (
      const file of currentContract.contrato_arquivos
    ) {
      const {
        data:
          signedData,
      } =
        await supabaseAdmin
          .storage
          .from(
            "contract-documents"
          )
          .createSignedUrl(
            file.caminho_storage,
            60 * 60
          );

      if (
        signedData?.signedUrl
      ) {
        contractFiles.push({
          id:
            file.id,

          name:
            file.nome_arquivo,

          url:
            signedData.signedUrl,

          type:
            file.mime_type,
        });
      }
    }
  }

  /*
   * CONFIGURAÇÃO DO PORTAL
   */

  const {
    data:
      portalConfig,
  } =
    await supabaseAdmin
      .from(
        "portal_configuracoes"
      )
      .select("*")
      .limit(1)
      .maybeSingle();

  /*
   * CÁLCULOS
   */

  const totalPaid =
    installments.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.valor_pago ??
            0
        ),
      0
    );

  const totalDiscounts =
    installments.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.desconto_valor ??
            0
        ),
      0
    );

  const totalInstallments =
    installments.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.valor ??
            0
        ),
      0
    );

  const balance =
    Math.max(
      0,
      totalInstallments -
        totalPaid -
        totalDiscounts
    );

  const paidCount =
    installments.filter(
      (
        installment
      ) =>
        installment.status ===
        "pago"
    ).length;

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const openInstallments =
    installments
      .filter(
        (
          installment
        ) =>
          installment.status !==
          "pago"
      )
      .sort(
        (
          a,
          b
        ) =>
          a.vencimento.localeCompare(
            b.vencimento
          )
      );

  const nextInstallment =
    openInstallments[0] ??
    null;

  const paidPercent =
    installments.length >
    0
      ? Math.min(
          100,
          (paidCount /
            installments.length) *
            100
        )
      : 0;

  const supportPhone =
    normalizePhone(
      portalConfig
        ?.telefone_suporte ??
        portalConfig
          ?.whatsapp_suporte ??
        "62994096995"
    );

  const supportMessage =
    encodeURIComponent(
      `Olá! Sou ${client?.nome ?? "cliente"} e preciso de suporte sobre minha contratação no CredBox.`
    );

  const supportUrl =
    supportPhone
      ? `https://wa.me/${supportPhone}?text=${supportMessage}`
      : "#";

  const maxDiscount =
    Number(
      portalConfig
        ?.desconto_maximo_percentual ??
        90
    );

  return (
    <main className="portal-v2">
      {/* HEADER */}

      <header className="portal-v2-header">
        <div className="portal-v2-brand">
          <div className="portal-v2-brand-icon">
            <WalletCards
              size={
                20
              }
            />
          </div>

          <div>
            <strong>
              CredBox
            </strong>

            <span>
              Portal do Cliente
            </span>
          </div>
        </div>

        <div className="portal-v2-header-actions">
          <a
            href={
              supportUrl
            }
            target="_blank"
            rel="noreferrer"
            className="portal-v2-support"
          >
            <MessageCircle
              size={
                15
              }
            />

            <span>
              Suporte
            </span>
          </a>

          <PortalLogoutButton />
        </div>
      </header>

      <div className="portal-v2-container">
        {/* WELCOME */}

        <section className="portal-v2-welcome">
          <div>
            <span className="portal-v2-eyebrow">
              BEM-VINDO
            </span>

            <h1>
              Olá,{" "}
              {firstName(
                client?.nome
              )}
              👋
            </h1>

            <p>
              Bem-vindo ao Portal CredBox.
              Aqui você acompanha as
              informações da sua contratação,
              pagamentos e documentos.
            </p>
          </div>

          {mainOperation && (
            <div className="portal-v2-contract-type">
              <span>
                SUA CONTRATAÇÃO
              </span>

              <strong>
                {operationName(
                  mainOperation.tipo
                )}
              </strong>
            </div>
          )}
        </section>

        {/* PRINCIPAIS KPIs */}

        <section className="portal-v2-kpis">
          <article className="portal-v2-kpi portal-v2-kpi-main">
            <span>
              Saldo restante
            </span>

            <strong>
              {currency(
                balance
              )}
            </strong>

            <small>
              Valor ainda em
              aberto
            </small>
          </article>

          <article className="portal-v2-kpi">
            <span>
              Total pago
            </span>

            <strong>
              {currency(
                totalPaid
              )}
            </strong>

            <small>
              {paidCount} de{" "}
              {
                installments.length
              }{" "}
              parcelas
            </small>
          </article>

          <article className="portal-v2-kpi">
            <span>
              Próxima parcela
            </span>

            <strong>
              {nextInstallment
                ? currency(
                    Number(
                      nextInstallment.valor
                    ) -
                      Number(
                        nextInstallment.valor_pago ??
                          0
                      ) -
                      Number(
                        nextInstallment.desconto_valor ??
                          0
                      )
                  )
                : "Quitado"}
            </strong>

            <small>
              {nextInstallment
                ? formatDate(
                    nextInstallment.vencimento
                  )
                : "Nenhuma parcela em aberto"}
            </small>
          </article>

          <article className="portal-v2-kpi">
            <span>
              Caução recebida
            </span>

            <strong>
              {currency(
                Number(
                  mainOperation?.caucao_recebida ??
                    0
                )
              )}
            </strong>

            <small>
              {mainOperation
                ?.caucao_status ??
                "Consultar contrato"}
            </small>
          </article>
        </section>

        {/* PROGRESSO */}

        <section className="portal-v2-panel">
          <header className="portal-v2-panel-header">
            <div>
              <span>
                SUA EVOLUÇÃO
              </span>

              <h2>
                Progresso da contratação
              </h2>
            </div>

            <strong>
              {paidPercent.toFixed(
                0
              )}
              %
            </strong>
          </header>

          <div className="portal-v2-progress">
            <div>
              <div
                style={{
                  width: `${paidPercent}%`,
                }}
              />
            </div>

            <footer>
              <span>
                {
                  paidCount
                }{" "}
                parcelas pagas
              </span>

              <span>
                {
                  installments.length -
                  paidCount
                }{" "}
                restantes
              </span>
            </footer>
          </div>
        </section>

        {/* VEÍCULO + DESCONTO */}

        <section className="portal-v2-two-columns">
          <article className="portal-v2-panel">
            <header className="portal-v2-panel-header">
              <div>
                <span>
                  PATRIMÔNIO
                </span>

                <h2>
                  Seu veículo
                </h2>
              </div>

              <Car
                size={
                  18
                }
              />
            </header>

            {vehicle ? (
              <div className="portal-v2-vehicle">
                <div className="portal-v2-vehicle-main">
                  <div className="portal-v2-vehicle-icon">
                    <Car
                      size={
                        21
                      }
                    />
                  </div>

                  <div>
                    <strong>
                      {
                        vehicle.marca
                      }{" "}
                      {
                        vehicle.modelo
                      }
                    </strong>

                    <span>
                      {vehicle.placa ??
                        "Sem placa"}
                    </span>
                  </div>
                </div>

                <div className="portal-v2-vehicle-data">
                  <div>
                    <span>
                      Ano
                    </span>

                    <strong>
                      {vehicle.ano_modelo ??
                        vehicle.ano_fabricacao ??
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      RENAVAM
                    </span>

                    <strong>
                      {vehicle.renavam ??
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Chassi
                    </span>

                    <strong>
                      {vehicle.chassi ??
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Cor
                    </span>

                    <strong>
                      {vehicle.cor ??
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Combustível
                    </span>

                    <strong>
                      {vehicle.combustivel ??
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      FIPE
                    </span>

                    <strong>
                      {currency(
                        vehicle.valor_fipe
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="portal-v2-empty">
                Nenhum veículo vinculado.
              </div>
            )}
          </article>

          <article className="portal-v2-discount">
            <div className="portal-v2-discount-icon">
              <Percent
                size={
                  21
                }
              />
            </div>

            <span>
              ANTECIPAÇÃO
            </span>

            <h2>
              Pague antes.
              Economize mais.
            </h2>

            <p>
              Quer reduzir o custo
              da sua contratação?
              Consulte as condições
              disponíveis para
              antecipação de parcelas
              ou quitação.
            </p>

            <div className="portal-v2-discount-number">
              <small>
                condições de até
              </small>

              <strong>
                {maxDiscount}%
              </strong>

              <span>
                de desconto*
              </span>
            </div>

            <a
              href={
                supportUrl
              }
              target="_blank"
              rel="noreferrer"
              className="portal-v2-discount-button"
            >
              <MessageCircle
                size={
                  16
                }
              />

              Consultar condição
            </a>

            <small className="portal-v2-disclaimer">
              *Percentual máximo sujeito
              às condições da operação,
              quantidade de parcelas
              antecipadas e aprovação.
            </small>
          </article>
        </section>

        {/* PARCELAS */}

        <section className="portal-v2-panel">
          <header className="portal-v2-panel-header">
            <div>
              <span>
                FINANCEIRO
              </span>

              <h2>
                Suas parcelas
              </h2>
            </div>

            <CalendarDays
              size={
                18
              }
            />
          </header>

          <PortalParcelasTable
            installments={
              installments
            }
          />
        </section>

        {/* CONTRATO */}

        <section className="portal-v2-panel">
          <header className="portal-v2-panel-header">
            <div>
              <span>
                DOCUMENTOS
              </span>

              <h2>
                Contrato e anexos
              </h2>
            </div>

            <FileText
              size={
                18
              }
            />
          </header>

          {currentContract ? (
            <div className="portal-v2-contract">
              <div className="portal-v2-contract-info">
                <div className="portal-v2-file-icon">
                  <FileText
                    size={
                      19
                    }
                  />
                </div>

                <div>
                  <strong>
                    {
                      currentContract.titulo
                    }
                  </strong>

                  <span>
                    {currentContract.numero
                      ? `Contrato nº ${currentContract.numero}`
                      : "Contrato"}
                    {" • "}
                    {formatDate(
                      currentContract.data_assinatura
                    )}
                  </span>

                  <small>
                    Status:{" "}
                    {
                      currentContract.status
                    }
                  </small>
                </div>
              </div>

              {contractFiles.length >
              0 ? (
                <div className="portal-v2-files">
                  {contractFiles.map(
                    (
                      file
                    ) => (
                      <a
                        key={
                          file.id
                        }
                        href={
                          file.url
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FileText
                          size={
                            15
                          }
                        />

                        <div>
                          <strong>
                            {
                              file.name
                            }
                          </strong>

                          <span>
                            Abrir documento
                          </span>
                        </div>
                      </a>
                    )
                  )}
                </div>
              ) : (
                <div className="portal-v2-file-warning">
                  <FileText
                    size={
                      18
                    }
                  />

                  <div>
                    <strong>
                      Contrato encontrado,
                      mas nenhum arquivo
                      anexado foi localizado.
                    </strong>

                    <span>
                      Confira em Contratos →
                      Editar contrato se o PDF
                      foi realmente enviado.
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="portal-v2-empty">
              Nenhum contrato
              disponível.
            </div>
          )}
        </section>

        {/* CAUÇÃO */}

        <section className="portal-v2-panel">
          <header className="portal-v2-panel-header">
            <div>
              <span>
                GARANTIA
              </span>

              <h2>
                Caução
              </h2>
            </div>

            <ShieldCheck
              size={
                18
              }
            />
          </header>

          <div className="portal-v2-caution-grid">
            <div>
              <span>
                Caução prevista
              </span>

              <strong>
                {currency(
                  Number(
                    mainOperation?.caucao_prevista ??
                      0
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Caução recebida
              </span>

              <strong>
                {currency(
                  Number(
                    mainOperation?.caucao_recebida ??
                      0
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Situação
              </span>

              <strong>
                {mainOperation
                  ?.caucao_status ??
                  "Não informado"}
              </strong>
            </div>
          </div>
        </section>

        {/* SUPORTE */}

        <section className="portal-v2-help">
          <div>
            <span>
              PRECISA DE AJUDA?
            </span>

            <h2>
              Estamos aqui para ajudar.
            </h2>

            <p>
              Dúvidas sobre pagamento,
              contrato, caução, veículo
              ou antecipação?
            </p>
          </div>

          <a
            href={
              supportUrl
            }
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle
              size={
                17
              }
            />

            Falar com suporte
          </a>
        </section>

        <footer className="portal-v2-footer">
          <ShieldCheck
            size={
              13
            }
          />

          Ambiente exclusivo do
          cliente • CredBox
        </footer>
      </div>
    </main>
  );
}