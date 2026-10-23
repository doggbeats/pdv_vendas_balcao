import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const produtos = [
  { codigo: "PROD-0001", nome: "Skol Lata 350ml", categoria: "cervejas", valorCusto: 3.2, valorVenda: 4.5, quantidade: 48, estoqueMinimo: 12, unidadeMedida: "UN", unidadesPorCaixinha: 1, especificacao: "Cerveja pilsen lata 350ml" },
  { codigo: "PROD-0002", nome: "Brahma Lata 350ml", categoria: "cervejas", valorCusto: 3.3, valorVenda: 4.7, quantidade: 36, estoqueMinimo: 12, unidadeMedida: "UN", unidadesPorCaixinha: 1, especificacao: "Cerveja pilsen lata 350ml" },
  { codigo: "PROD-0003", nome: "Heineken Long Neck 330ml", categoria: "cervejas", valorCusto: 7, valorVenda: 9.9, quantidade: 24, estoqueMinimo: 6, unidadeMedida: "UN", unidadesPorCaixinha: 1, especificacao: "Cerveja long neck 330ml" },
  { codigo: "PROD-0004", nome: "Coca-Cola Lata 350ml", categoria: "refrigerantes", valorCusto: 4, valorVenda: 5.5, quantidade: 40, estoqueMinimo: 12, unidadeMedida: "UN", unidadesPorCaixinha: 1, especificacao: "Refrigerante lata 350ml" },
  { codigo: "PROD-0005", nome: "Guaraná Antarctica 350ml", categoria: "refrigerantes", valorCusto: 3.2, valorVenda: 4.5, quantidade: 36, estoqueMinimo: 12, unidadeMedida: "UN", unidadesPorCaixinha: 1, especificacao: "Refrigerante lata 350ml" },
  { codigo: "PROD-0006", nome: "Batata Ruffles Original 80g", categoria: "salgadinhos", valorCusto: 6, valorVenda: 8.9, quantidade: 20, estoqueMinimo: 6, unidadeMedida: "UN", unidadesPorCaixinha: 1, especificacao: "Batata chips sabor original 80g" },
  { codigo: "PROD-0007", nome: "Doritos Nacho 55g", categoria: "salgadinhos", valorCusto: 5.5, valorVenda: 7.9, quantidade: 18, estoqueMinimo: 6, unidadeMedida: "UN", unidadesPorCaixinha: 1, especificacao: "Salgadinho sabor nacho 55g" },
  { codigo: "PROD-0008", nome: "Red Label 1L", categoria: "whiskys", valorCusto: 55, valorVenda: 79.9, quantidade: 8, estoqueMinimo: 3, unidadeMedida: "UN", unidadesPorCaixinha: 1, especificacao: "Whisky escocês 1 litro" },
  { codigo: "PROD-0009", nome: "Marlboro Vermelho", categoria: "cigarros", valorCusto: 9, valorVenda: 12.5, quantidade: 30, estoqueMinimo: 10, unidadeMedida: "UN", unidadesPorCaixinha: 1, especificacao: "Cigarro maço vermelho" },
  { codigo: "PROD-0010", nome: "Pirulito Diamante", categoria: "pirulitos", valorCusto: 1, valorVenda: 1.5, quantidade: 100, estoqueMinimo: 20, unidadeMedida: "UN", unidadesPorCaixinha: 1, especificacao: "Pirulito de açúcar" },
  { codigo: "PROD-0011", nome: "Balinha Mentos", categoria: "balinhas", valorCusto: 2, valorVenda: 3, quantidade: 50, estoqueMinimo: 10, unidadeMedida: "UN", unidadesPorCaixinha: 1, especificacao: "Balinha mastigável" },
  { codigo: "PROD-0012", nome: "Skol Caixinha 12un", categoria: "cervejas", valorCusto: 36, valorVenda: 49.9, quantidade: 4, estoqueMinimo: 1, unidadeMedida: "CX", unidadesPorCaixinha: 12, especificacao: "Caixinha com 12 latas de 350ml" },
  { codigo: "PROD-0013", nome: "Brahma Caixinha 12un", categoria: "cervejas", valorCusto: 37, valorVenda: 51.9, quantidade: 3, estoqueMinimo: 1, unidadeMedida: "CX", unidadesPorCaixinha: 12, especificacao: "Caixinha com 12 latas de 350ml" },
  { codigo: "PROD-0014", nome: "Heineken Caixinha 12un", categoria: "cervejas", valorCusto: 80, valorVenda: 109.9, quantidade: 2, estoqueMinimo: 1, unidadeMedida: "CX", unidadesPorCaixinha: 12, especificacao: "Caixinha com 12 long necks de 330ml" },
  { codigo: "PROD-0015", nome: "Marlboro Unidade", categoria: "cigarros", valorCusto: 1, valorVenda: 1.5, quantidade: 200, estoqueMinimo: 40, unidadeMedida: "UN", unidadesPorCaixinha: 1, especificacao: "Cigarro Marlboro vendido avulso (unidade)" },
  { codigo: "PROD-0016", nome: "Dunhill Unidade", categoria: "cigarros", valorCusto: 1, valorVenda: 1.75, quantidade: 150, estoqueMinimo: 30, unidadeMedida: "UN", unidadesPorCaixinha: 1, especificacao: "Cigarro Dunhill vendido avulso (unidade)" },
  { codigo: "PROD-0017", nome: "Rothmans Unidade", categoria: "cigarros", valorCusto: 0.9, valorVenda: 1.5, quantidade: 150, estoqueMinimo: 30, unidadeMedida: "UN", unidadesPorCaixinha: 1, especificacao: "Cigarro Rothmans vendido avulso (unidade)" },
];

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@codeph.local").toLowerCase();
  const adminSenha = process.env.ADMIN_PASSWORD ?? "Admin@12345";
  const adminNome = process.env.ADMIN_NOME ?? "Proprietário";

  const adminExistente = await prisma.usuario.findUnique({
    where: { email: adminEmail },
  });

  if (!adminExistente) {
    await prisma.usuario.create({
      data: {
        nome: adminNome,
        email: adminEmail,
        senhaHash: await hash(adminSenha, 12),
        papel: "ADMIN",
      },
    });
    console.log(`Administrador criado: ${adminEmail}`);
  } else {
    await prisma.usuario.update({
      where: { id: adminExistente.id },
      data: { papel: "ADMIN", ativo: true, nome: adminNome },
    });
    console.log(`Administrador já existente: ${adminEmail}`);
  }

  const operadorEmail = process.env.OPERADOR_EMAIL;
  const operadorSenha = process.env.OPERADOR_PASSWORD;

  if (operadorEmail && operadorSenha) {
    const operadorExistente = await prisma.usuario.findUnique({
      where: { email: operadorEmail.toLowerCase() },
    });

    if (!operadorExistente) {
      await prisma.usuario.create({
        data: {
          nome: process.env.OPERADOR_NOME ?? "Operador",
          email: operadorEmail.toLowerCase(),
          senhaHash: await hash(operadorSenha, 12),
          papel: "OPERADOR",
        },
      });
      console.log(`Operador criado: ${operadorEmail}`);
    }
  }

  let criados = 0;
  for (const produto of produtos) {
    const existente = await prisma.produto.findUnique({
      where: { codigo: produto.codigo },
    });

    if (existente) continue;

    const criado = await prisma.produto.create({ data: produto });
    if (criado.quantidade > 0) {
      await prisma.movimentoEstoque.create({
        data: {
          produtoId: criado.id,
          tipo: "ENTRADA",
          quantidade: criado.quantidade,
          motivo: "Cadastro inicial do produto",
        },
      });
    }
    criados += 1;
  }

  console.log(`Produtos criados: ${criados}`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
