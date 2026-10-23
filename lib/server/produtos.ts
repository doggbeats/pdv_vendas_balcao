import "server-only";

export function gerarCodigoProduto() {
  return (
    "PROD-" +
    Math.random().toString(36).slice(2, 8).toUpperCase() +
    "-" +
    Math.random().toString(36).slice(2, 5).toUpperCase()
  );
}
