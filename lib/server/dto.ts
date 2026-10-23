import type {
  ItemVenda as ItemVendaPrisma,
  Produto as ProdutoPrisma,
  Venda as VendaPrisma,
} from "@prisma/client";

export type ProdutoDTO = {
  id: string;
  codigo: string;
  nome: string;
  categoria: string;
  valorCusto: number;
  valorVenda: number;
  quantidade: number;
  estoqueMinimo: number;
  unidadeMedida: string;
  unidadesPorCaixinha: number;
  especificacao: string;
};

export type ItemVendaDTO = {
  produtoId: string | null;
  codigo: string;
  nome: string;
  categoria: string;
  valorUnitario: number;
  quantidade: number;
};

export type VendaDTO = {
  id: string;
  numero: number;
  data: string;
  itens: ItemVendaDTO[];
  subtotal: number;
  desconto: number;
  total: number;
  formaPagamento: "dinheiro" | "cartao" | "pix";
  valorRecebido: number;
  troco: number;
  status: "CONCLUIDA" | "CANCELADA";
  canceladaEm: string | null;
};

export function produtoDTO(produto: ProdutoPrisma): ProdutoDTO {
  return {
    id: produto.id,
    codigo: produto.codigo,
    nome: produto.nome,
    categoria: produto.categoria,
    valorCusto: Number(produto.valorCusto),
    valorVenda: Number(produto.valorVenda),
    quantidade: produto.quantidade,
    estoqueMinimo: produto.estoqueMinimo,
    unidadeMedida: produto.unidadeMedida,
    unidadesPorCaixinha: produto.unidadesPorCaixinha,
    especificacao: produto.especificacao,
  };
}

export function itemVendaDTO(item: ItemVendaPrisma): ItemVendaDTO {
  return {
    produtoId: item.produtoId,
    codigo: item.codigo,
    nome: item.nome,
    categoria: item.categoria,
    valorUnitario: Number(item.valorUnitario),
    quantidade: item.quantidade,
  };
}

export function formaPagamentoDTO(
  forma: "DINHEIRO" | "CARTAO" | "PIX"
): VendaDTO["formaPagamento"] {
  return forma.toLowerCase() as VendaDTO["formaPagamento"];
}

export function vendaDTO(
  venda: VendaPrisma & { itens: ItemVendaPrisma[] }
): VendaDTO {
  return {
    id: venda.id,
    numero: venda.numero,
    data: venda.data.toISOString(),
    itens: venda.itens.map(itemVendaDTO),
    subtotal: Number(venda.subtotal),
    desconto: Number(venda.desconto),
    total: Number(venda.total),
    formaPagamento: formaPagamentoDTO(venda.formaPagamento),
    valorRecebido: Number(venda.valorRecebido),
    troco: Number(venda.troco),
    status: venda.status,
    canceladaEm: venda.canceladaEm?.toISOString() ?? null,
  };
}

export function formaPagamentoPrisma(
  forma: "dinheiro" | "cartao" | "pix"
): "DINHEIRO" | "CARTAO" | "PIX" {
  return forma.toUpperCase() as "DINHEIRO" | "CARTAO" | "PIX";
}

export function arredondarMoeda(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
