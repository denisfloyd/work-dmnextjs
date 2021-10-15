export default function cepCalculate(cep: string) {
  return cep.replace(/\D/g, "").slice(0, 8);
}
