"use client";

import { useEffect, useState } from "react";

export type FormaPagamento = "dinheiro" | "cartao" | "pix";

export const FORMAS_PAGAMENTO: Array<{ valor: FormaPagamento; nome: string }> = [
  { valor: "dinheiro", nome: "Dinheiro" },
  { valor: "cartao", nome: "Cartão" },
  { valor: "pix", nome: "Pix" },
];

export type Produto = {
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
  validade: string;
};

export type ItemVenda = {
  produtoId: string;
  codigo: string;
  nome: string;
  categoria: string;
  valorUnitario: number;
  quantidade: number;
};

export type Venda = {
  id: string;
  numero: number;
  data: string;
  itens: ItemVenda[];
  subtotal: number;
  desconto: number;
  total: number;
  formaPagamento: FormaPagamento;
  valorRecebido: number;
  troco: number;
};

export type Categoria = {
  valor: string;
  nome: string;
};

export type ExclusaoVenda = {
  id: string;
  vendaId: string;
  numeroVenda: number;
  data: string;
  totalVenda: number;
  itens: Array<{
    nome: string;
    codigo: string;
    quantidade: number;
    valorUnitario: number;
  }>;
};

export type Fornecedor = {
  id: string;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  observacoes: string;
};

export type Dados = {
  versao: number;
  categorias: Categoria[];
  produtos: Produto[];
  vendas: Venda[];
  exclusoes: ExclusaoVenda[];
  fornecedores: Fornecedor[];
  proximoNumeroVenda: number;
};

const CHAVE = "ph-gestao:dados:v1";
const VERSAO_DADOS = 7;

export function formatarNumeroVenda(numero: number) {
  return `#${String(numero).padStart(4, "0")}`;
}
const EVENTO = "ph-gestao:dados-atualizados";

const NOMES_CATEGORIAS: Record<string, string> = {
  cervejas: "Cervejas (Unidade)",
  "cervejas-caixinha": "Cervejas (Caixinha)",
  whiskys: "Whiskys",
  refrigerantes: "Refrigerantes",
  salgadinhos: "Salgadinhos",
  cigarros: "Cigarros",
  pirulitos: "Pirulitos",
  balinhas: "Balinhas",
  esqueiros: "Esqueiros",
  "caixinha-de-hemp": "Caixinha de Hemp",
  "hemp-avulso": "Hemp Avulso",
};

const CATEGORIAS_INICIAIS: Categoria[] = Object.entries(NOMES_CATEGORIAS).map(
  ([valor, nome]) => ({ valor, nome })
);

function formatarNomeCategoria(valor: string) {
  return valor
    .split("-")
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

export function nomeCategoria(categoria: string, categorias?: Categoria[]) {
  const encontrada = categorias?.find((item) => item.valor === categoria);
  if (encontrada) return encontrada.nome;
  return NOMES_CATEGORIAS[categoria] ?? formatarNomeCategoria(categoria);
}

export function normalizarBusca(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function combinaBusca(
  valores: Array<string | null | undefined>,
  termo: string
) {
  const alvo = normalizarBusca(termo);
  if (!alvo) return true;
  return valores.some((valor) =>
    normalizarBusca(valor ?? "").includes(alvo)
  );
}

function gerarValorCategoria(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const produtosBase: Array<
  Omit<Produto, "unidadesPorCaixinha" | "validade">
> = [
  {
    id: "prod-0001",
    codigo: "PROD-0001",
    nome: "Skol Lata 350ml",
    categoria: "cervejas",
    valorCusto: 3.2,
    valorVenda: 4.5,
    quantidade: 48,
    estoqueMinimo: 12,
    unidadeMedida: "UN",
    especificacao: "Cerveja pilsen lata 350ml",
  },
  {
    id: "prod-0002",
    codigo: "PROD-0002",
    nome: "Brahma Lata 350ml",
    categoria: "cervejas",
    valorCusto: 3.3,
    valorVenda: 4.7,
    quantidade: 36,
    estoqueMinimo: 12,
    unidadeMedida: "UN",
    especificacao: "Cerveja pilsen lata 350ml",
  },
  {
    id: "prod-0003",
    codigo: "PROD-0003",
    nome: "Heineken Long Neck 330ml",
    categoria: "cervejas",
    valorCusto: 7,
    valorVenda: 9.9,
    quantidade: 24,
    estoqueMinimo: 6,
    unidadeMedida: "UN",
    especificacao: "Cerveja long neck 330ml",
  },
  {
    id: "prod-0004",
    codigo: "PROD-0004",
    nome: "Coca-Cola Lata 350ml",
    categoria: "refrigerantes",
    valorCusto: 4,
    valorVenda: 5.5,
    quantidade: 40,
    estoqueMinimo: 12,
    unidadeMedida: "UN",
    especificacao: "Refrigerante lata 350ml",
  },
  {
    id: "prod-0005",
    codigo: "PROD-0005",
    nome: "Guaraná Antarctica 350ml",
    categoria: "refrigerantes",
    valorCusto: 3.2,
    valorVenda: 4.5,
    quantidade: 36,
    estoqueMinimo: 12,
    unidadeMedida: "UN",
    especificacao: "Refrigerante lata 350ml",
  },
  {
    id: "prod-0006",
    codigo: "PROD-0006",
    nome: "Batata Ruffles Original 80g",
    categoria: "salgadinhos",
    valorCusto: 6,
    valorVenda: 8.9,
    quantidade: 20,
    estoqueMinimo: 6,
    unidadeMedida: "UN",
    especificacao: "Batata chips sabor original 80g",
  },
  {
    id: "prod-0007",
    codigo: "PROD-0007",
    nome: "Doritos Nacho 55g",
    categoria: "salgadinhos",
    valorCusto: 5.5,
    valorVenda: 7.9,
    quantidade: 18,
    estoqueMinimo: 6,
    unidadeMedida: "UN",
    especificacao: "Salgadinho sabor nacho 55g",
  },
  {
    id: "prod-0008",
    codigo: "PROD-0008",
    nome: "Red Label 1L",
    categoria: "whiskys",
    valorCusto: 55,
    valorVenda: 79.9,
    quantidade: 8,
    estoqueMinimo: 3,
    unidadeMedida: "UN",
    especificacao: "Whisky escocês 1 litro",
  },
  {
    id: "prod-0009",
    codigo: "PROD-0009",
    nome: "Marlboro Vermelho",
    categoria: "cigarros",
    valorCusto: 9,
    valorVenda: 12.5,
    quantidade: 30,
    estoqueMinimo: 10,
    unidadeMedida: "UN",
    especificacao: "Cigarro maço vermelho",
  },
  {
    id: "prod-0010",
    codigo: "PROD-0010",
    nome: "Pirulito Diamante",
    categoria: "pirulitos",
    valorCusto: 1,
    valorVenda: 1.5,
    quantidade: 100,
    estoqueMinimo: 20,
    unidadeMedida: "UN",
    especificacao: "Pirulito de açúcar",
  },
  {
    id: "prod-0011",
    codigo: "PROD-0011",
    nome: "Balinha Mentos",
    categoria: "balinhas",
    valorCusto: 2,
    valorVenda: 3,
    quantidade: 50,
    estoqueMinimo: 10,
    unidadeMedida: "UN",
    especificacao: "Balinha mastigável",
  },
];

const produtosIniciais: Produto[] = [
  ...produtosBase.map((produto) => ({
    ...produto,
    unidadesPorCaixinha: 1,
    validade: "",
  })),
  {
    id: "prod-0012",
    codigo: "PROD-0012",
    nome: "Skol Caixinha 12un",
    categoria: "cervejas-caixinha",
    valorCusto: 36,
    valorVenda: 49.9,
    quantidade: 4,
    estoqueMinimo: 1,
    unidadeMedida: "CX",
    unidadesPorCaixinha: 12,
    especificacao: "Caixinha com 12 latas de 350ml",
    validade: "",
  },
  {
    id: "prod-0013",
    codigo: "PROD-0013",
    nome: "Brahma Caixinha 12un",
    categoria: "cervejas-caixinha",
    valorCusto: 37,
    valorVenda: 51.9,
    quantidade: 3,
    estoqueMinimo: 1,
    unidadeMedida: "CX",
    unidadesPorCaixinha: 12,
    especificacao: "Caixinha com 12 latas de 350ml",
    validade: "",
  },
  {
    id: "prod-0014",
    codigo: "PROD-0014",
    nome: "Heineken Caixinha 12un",
    categoria: "cervejas-caixinha",
    valorCusto: 80,
    valorVenda: 109.9,
    quantidade: 2,
    estoqueMinimo: 1,
    unidadeMedida: "CX",
    unidadesPorCaixinha: 12,
    especificacao: "Caixinha com 12 long necks de 330ml",
    validade: "",
  },
  {
    id: "prod-0015",
    codigo: "PROD-0015",
    nome: "Marlboro Unidade",
    categoria: "cigarros",
    valorCusto: 1,
    valorVenda: 1.5,
    quantidade: 200,
    estoqueMinimo: 40,
    unidadeMedida: "UN",
    unidadesPorCaixinha: 1,
    especificacao: "Cigarro Marlboro vendido avulso (unidade)",
    validade: "",
  },
  {
    id: "prod-0016",
    codigo: "PROD-0016",
    nome: "Dunhill Unidade",
    categoria: "cigarros",
    valorCusto: 1,
    valorVenda: 1.75,
    quantidade: 150,
    estoqueMinimo: 30,
    unidadeMedida: "UN",
    unidadesPorCaixinha: 1,
    especificacao: "Cigarro Dunhill vendido avulso (unidade)",
    validade: "",
  },
  {
    id: "prod-0017",
    codigo: "PROD-0017",
    nome: "Rothmans Unidade",
    categoria: "cigarros",
    valorCusto: 0.9,
    valorVenda: 1.5,
    quantidade: 150,
    estoqueMinimo: 30,
    unidadeMedida: "UN",
    unidadesPorCaixinha: 1,
    especificacao: "Cigarro Rothmans vendido avulso (unidade)",
    validade: "",
  },
];

function dadosIniciais(): Dados {
  return {
    versao: VERSAO_DADOS,
    categorias: CATEGORIAS_INICIAIS.map((categoria) => ({ ...categoria })),
    produtos: produtosIniciais.map((produto) => ({ ...produto })),
    vendas: [],
    exclusoes: [],
    fornecedores: [],
    proximoNumeroVenda: 1,
  };
}

export function gerarId(prefixo: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefixo}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefixo}-${Math.random().toString(36).slice(2, 10)}`;
}

function vendaPorIdNumero(vendas: Venda[], vendaId: string) {
  return vendas.find((venda) => venda.id === vendaId)?.numero ?? null;
}

export function carregarDados(): Dados {
  if (typeof window === "undefined") {
    return {
      versao: VERSAO_DADOS,
      categorias: CATEGORIAS_INICIAIS.map((categoria) => ({ ...categoria })),
      produtos: [],
      vendas: [],
      exclusoes: [],
      fornecedores: [],
      proximoNumeroVenda: 1,
    };
  }

  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) {
      const dados = dadosIniciais();
      window.localStorage.setItem(CHAVE, JSON.stringify(dados));
      return dados;
    }

    const salvo = JSON.parse(bruto) as Partial<Dados>;
    const produtos = Array.isArray(salvo.produtos)
      ? salvo.produtos.map((produto) => {
          const unidadesPorCaixinha = produto.unidadesPorCaixinha ?? 1;
          // Cerveja vendida em caixinha ganha categoria própria para
          // separar os relatórios por categoria.
          const categoria =
            produto.unidadeMedida === "CX" && produto.categoria === "cervejas"
              ? "cervejas-caixinha"
              : produto.categoria;
          return {
            ...produto,
            categoria,
            unidadesPorCaixinha,
            validade: produto.validade ?? "",
          };
        })
      : [];

    // Vendas antigas não possuem número sequencial: numera por ordem de data.
    const vendasBrutas = Array.isArray(salvo.vendas) ? salvo.vendas : [];
    const vendasPorData = [...vendasBrutas].sort((a, b) =>
      String(a.data).localeCompare(String(b.data))
    );
    const numerosPorId = new Map<string, number>();
    vendasPorData.forEach((venda, indice) => {
      numerosPorId.set(venda.id, (venda as Venda).numero ?? indice + 1);
    });
    const vendas: Venda[] = vendasBrutas.map((venda) => ({
      ...venda,
      numero: (venda as Venda).numero ?? numerosPorId.get(venda.id) ?? 1,
    }));

    // Exclusões antigas podem ter numeroVenda como texto (#ABC123).
    const exclusoes: ExclusaoVenda[] = (
      Array.isArray(salvo.exclusoes) ? salvo.exclusoes : []
    ).map((exclusao) => {
      const numero = (exclusao as { numeroVenda: number | string }).numeroVenda;
      if (typeof numero === "number") {
        return { ...exclusao, numeroVenda: numero } as ExclusaoVenda;
      }
      const doVenda = vendaPorIdNumero(vendas, exclusao.vendaId);
      return {
        ...exclusao,
        numeroVenda: doVenda ?? 0,
      } as ExclusaoVenda;
    });

    const proximoNumeroVenda =
      typeof salvo.proximoNumeroVenda === "number"
        ? salvo.proximoNumeroVenda
        : Math.max(
            0,
            ...vendas.map((venda) => venda.numero ?? 0),
            ...exclusoes.map((exclusao) => exclusao.numeroVenda)
          ) + 1;

    const fornecedores: Fornecedor[] = Array.isArray(salvo.fornecedores)
      ? salvo.fornecedores
      : [];

    const categorias: Categoria[] =
      Array.isArray(salvo.categorias) && salvo.categorias.length > 0
        ? salvo.categorias.map((categoria) => ({
            ...categoria,
            // Mantém os nomes conhecidos atualizados (ex.: "Cervejas (Unidade)").
            nome: NOMES_CATEGORIAS[categoria.valor] ?? categoria.nome,
          }))
        : CATEGORIAS_INICIAIS.map((categoria) => ({ ...categoria }));

    // Garante que categorias presentes em produtos antigos apareçam na lista.
    for (const produto of produtos) {
      if (!categorias.some((categoria) => categoria.valor === produto.categoria)) {
        categorias.push({
          valor: produto.categoria,
          nome: nomeCategoria(produto.categoria),
        });
      }
    }

    let versao = salvo.versao ?? 1;

    if (versao < VERSAO_DADOS) {
      const codigos = new Set(produtos.map((produto) => produto.codigo));
      for (const produtoInicial of produtosIniciais) {
        if (!codigos.has(produtoInicial.codigo)) {
          produtos.push({ ...produtoInicial });
        }
      }
      versao = VERSAO_DADOS;
      window.localStorage.setItem(
        CHAVE,
        JSON.stringify({
          versao,
          categorias,
          produtos,
          vendas,
          exclusoes,
          fornecedores,
          proximoNumeroVenda,
        })
      );
    }

    return {
      versao,
      categorias,
      produtos,
      vendas,
      exclusoes,
      fornecedores,
      proximoNumeroVenda,
    };
  } catch {
    return dadosIniciais();
  }
}

function salvarDados(dados: Dados) {
  window.localStorage.setItem(CHAVE, JSON.stringify(dados));
  window.dispatchEvent(new Event(EVENTO));
}

export function criarCategoria(nome: string): Categoria {
  const limpo = nome.trim();

  if (!limpo) {
    throw new Error("Informe o nome da categoria.");
  }

  const valor = gerarValorCategoria(limpo);

  if (!valor) {
    throw new Error("Informe um nome de categoria válido.");
  }

  const dados = carregarDados();
  const duplicada = dados.categorias.some(
    (categoria) =>
      categoria.valor === valor ||
      categoria.nome.toLowerCase() === limpo.toLowerCase()
  );

  if (duplicada) {
    throw new Error("Já existe uma categoria com este nome.");
  }

  const categoria: Categoria = { valor, nome: limpo };
  dados.categorias = [...dados.categorias, categoria];
  salvarDados(dados);
  return categoria;
}

export function removerCategoria(valor: string) {
  const dados = carregarDados();
  const categoria = dados.categorias.find((item) => item.valor === valor);

  if (!categoria) {
    throw new Error("Categoria não encontrada.");
  }

  const emUso = dados.produtos.filter(
    (produto) => produto.categoria === valor
  ).length;

  if (emUso > 0) {
    throw new Error(
      `Não é possível excluir: ${emUso} produto(s) usam esta categoria.`
    );
  }

  dados.categorias = dados.categorias.filter((item) => item.valor !== valor);
  salvarDados(dados);
}

export function criarProduto(
  entrada: Omit<Produto, "id">
): Produto {
  const dados = carregarDados();

  if (dados.produtos.some((produto) => produto.codigo === entrada.codigo)) {
    throw new Error("Já existe um produto com este código.");
  }

  const produto: Produto = { id: gerarId("prod"), ...entrada };
  dados.produtos = [produto, ...dados.produtos];
  salvarDados(dados);
  return produto;
}

export function atualizarProduto(entrada: Produto) {
  const dados = carregarDados();
  const existente = dados.produtos.find((p) => p.id === entrada.id);

  if (!existente) {
    throw new Error("Produto não encontrado.");
  }

  if (!entrada.nome.trim()) {
    throw new Error("Informe o nome do produto.");
  }

  if (
    !Number.isFinite(entrada.valorCusto) ||
    entrada.valorCusto < 0 ||
    !Number.isFinite(entrada.valorVenda) ||
    entrada.valorVenda < 0
  ) {
    throw new Error("Informe valores de custo e venda válidos.");
  }

  if (!Number.isFinite(entrada.quantidade) || entrada.quantidade < 0) {
    throw new Error("Informe uma quantidade válida.");
  }

  if (!Number.isFinite(entrada.estoqueMinimo) || entrada.estoqueMinimo < 0) {
    throw new Error("Informe um estoque mínimo válido.");
  }

  if (
    dados.produtos.some(
      (p) => p.id !== entrada.id && p.codigo === entrada.codigo
    )
  ) {
    throw new Error("Já existe um produto com este código.");
  }

  dados.produtos = dados.produtos.map((produto) =>
    produto.id === entrada.id
      ? {
          ...entrada,
          nome: entrada.nome.trim(),
          especificacao: entrada.especificacao.trim(),
          validade: entrada.validade?.trim() ?? "",
          quantidade: Math.floor(entrada.quantidade),
          estoqueMinimo: Math.floor(entrada.estoqueMinimo),
          unidadesPorCaixinha:
            entrada.unidadeMedida === "CX"
              ? Math.max(Math.floor(entrada.unidadesPorCaixinha) || 1, 1)
              : 1,
        }
      : produto
  );

  salvarDados(dados);
}

export function excluirProduto(produtoId: string) {
  const dados = carregarDados();
  const existe = dados.produtos.some((produto) => produto.id === produtoId);

  if (!existe) {
    throw new Error("Produto não encontrado.");
  }

  dados.produtos = dados.produtos.filter((produto) => produto.id !== produtoId);
  salvarDados(dados);
}

export function criarFornecedor(entrada: Omit<Fornecedor, "id">): Fornecedor {
  const dados = carregarDados();
  const nome = entrada.nome.trim();

  if (!nome) {
    throw new Error("Informe o nome do fornecedor.");
  }

  const fornecedor: Fornecedor = {
    id: gerarId("forn"),
    nome,
    cnpj: entrada.cnpj.trim(),
    telefone: entrada.telefone.trim(),
    email: entrada.email.trim(),
    endereco: entrada.endereco.trim(),
    observacoes: entrada.observacoes.trim(),
  };

  dados.fornecedores = [fornecedor, ...dados.fornecedores];
  salvarDados(dados);
  return fornecedor;
}

export function atualizarFornecedor(entrada: Fornecedor) {
  const dados = carregarDados();
  const existente = dados.fornecedores.find((f) => f.id === entrada.id);

  if (!existente) {
    throw new Error("Fornecedor não encontrado.");
  }

  const nome = entrada.nome.trim();
  if (!nome) {
    throw new Error("Informe o nome do fornecedor.");
  }

  dados.fornecedores = dados.fornecedores.map((fornecedor) =>
    fornecedor.id === entrada.id
      ? {
          ...entrada,
          nome,
          cnpj: entrada.cnpj.trim(),
          telefone: entrada.telefone.trim(),
          email: entrada.email.trim(),
          endereco: entrada.endereco.trim(),
          observacoes: entrada.observacoes.trim(),
        }
      : fornecedor
  );

  salvarDados(dados);
}

export function excluirFornecedor(fornecedorId: string) {
  const dados = carregarDados();
  const existe = dados.fornecedores.some(
    (fornecedor) => fornecedor.id === fornecedorId
  );

  if (!existe) {
    throw new Error("Fornecedor não encontrado.");
  }

  dados.fornecedores = dados.fornecedores.filter(
    (fornecedor) => fornecedor.id !== fornecedorId
  );
  salvarDados(dados);
}

export function registrarVenda(entrada: {
  itens: ItemVenda[];
  desconto: number;
  formaPagamento: FormaPagamento;
  valorRecebido: number;
}): Venda {
  const dados = carregarDados();

  if (entrada.itens.length === 0) {
    throw new Error("Adicione ao menos um produto ao carrinho.");
  }

  for (const item of entrada.itens) {
    const produto = dados.produtos.find((p) => p.id === item.produtoId);
    if (!produto) {
      throw new Error(`Produto "${item.nome}" não encontrado.`);
    }
    if (item.quantidade > produto.quantidade) {
      throw new Error(
        `Estoque insuficiente para "${produto.nome}". Disponível: ${produto.quantidade}.`
      );
    }
  }

  const subtotal = entrada.itens.reduce(
    (total, item) => total + item.valorUnitario * item.quantidade,
    0
  );
  const desconto = Math.min(Math.max(entrada.desconto, 0), subtotal);
  const total = subtotal - desconto;

  const venda: Venda = {
    id: gerarId("venda"),
    numero: dados.proximoNumeroVenda,
    data: new Date().toISOString(),
    itens: entrada.itens,
    subtotal,
    desconto,
    total,
    formaPagamento: entrada.formaPagamento,
    valorRecebido: entrada.valorRecebido,
    troco: Math.max(entrada.valorRecebido - total, 0),
  };

  dados.produtos = dados.produtos.map((produto) => {
    const item = entrada.itens.find((i) => i.produtoId === produto.id);
    if (!item) return produto;
    return { ...produto, quantidade: produto.quantidade - item.quantidade };
  });
  dados.vendas = [venda, ...dados.vendas];
  dados.proximoNumeroVenda = dados.proximoNumeroVenda + 1;

  salvarDados(dados);
  return venda;
}

export function excluirVenda(vendaId: string) {
  const dados = carregarDados();
  const venda = dados.vendas.find((item) => item.id === vendaId);

  if (!venda) {
    throw new Error("Venda não encontrada.");
  }

  const exclusao: ExclusaoVenda = {
    id: gerarId("exclusao"),
    vendaId: venda.id,
    numeroVenda: venda.numero ?? 0,
    data: venda.data,
    totalVenda: venda.total,
    itens: venda.itens.map((item) => ({
      nome: item.nome,
      codigo: item.codigo,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
    })),
  };

  dados.produtos = dados.produtos.map((produto) => {
    const item = venda.itens.find((i) => i.produtoId === produto.id);
    if (!item) return produto;
    return { ...produto, quantidade: produto.quantidade + item.quantidade };
  });

  dados.vendas = dados.vendas.filter((item) => item.id !== vendaId);
  dados.exclusoes = [exclusao, ...dados.exclusoes];
  salvarDados(dados);

  return exclusao;
}

export function useDados() {
  const [dados, setDados] = useState<Dados>({
    versao: VERSAO_DADOS,
    categorias: [],
    produtos: [],
    vendas: [],
    exclusoes: [],
    fornecedores: [],
    proximoNumeroVenda: 1,
  });
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    const sincronizar = () => {
      setDados(carregarDados());
      setCarregado(true);
    };

    sincronizar();

    window.addEventListener(EVENTO, sincronizar);
    window.addEventListener("storage", sincronizar);
    return () => {
      window.removeEventListener(EVENTO, sincronizar);
      window.removeEventListener("storage", sincronizar);
    };
  }, []);

  return { ...dados, carregado };
}

export function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarHora(data: string) {
  return new Date(data).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ehHoje(data: string) {
  const alvo = new Date(data);
  const hoje = new Date();
  return (
    alvo.getDate() === hoje.getDate() &&
    alvo.getMonth() === hoje.getMonth() &&
    alvo.getFullYear() === hoje.getFullYear()
  );
}

export function formatarData(validade: string) {
  if (!validade) return "";
  const [ano, mes, dia] = validade.split("-");
  if (!ano || !mes || !dia) return validade;
  return `${dia}/${mes}/${ano}`;
}

export function diasParaVencer(validade: string) {
  if (!validade) return null;
  const [ano, mes, dia] = validade.split("-").map(Number);
  if (!ano || !mes || !dia) return null;
  const alvo = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

export function estaVencido(validade: string) {
  const dias = diasParaVencer(validade);
  return dias !== null && dias < 0;
}
