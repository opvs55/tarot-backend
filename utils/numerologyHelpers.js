// utils/numerologyHelpers.js

// Função auxiliar para reduzir números na numerologia
export const reduceNumber = (num) => {
  let numStr = String(num);
  if (numStr === '11' || numStr === '22' || numStr === '33') {
    return parseInt(numStr, 10);
  }
  let sum = 0;
  while (numStr.length > 1) {
    sum = 0;
    for (let digit of numStr) {
      sum += parseInt(digit, 10);
    }
    numStr = String(sum);
    if (numStr === '11' || numStr === '22' || numStr === '33') {
      return parseInt(numStr, 10);
    }
  }
  return parseInt(numStr, 10);
};

// Textos básicos para Caminho de Vida
export const lifePathMeanings = {
  1: "Liderança, independência, pioneirismo. Você veio para inovar e liderar.",
  2: "Cooperação, diplomacia, sensibilidade. Você busca harmonia e parcerias.",
  3: "Comunicação, criatividade, expressão. Você veio para inspirar e se expressar.",
  4: "Estrutura, trabalho, estabilidade. Você busca construir bases sólidas.",
  5: "Liberdade, aventura, mudança. Você busca experiências e versatilidade.",
  6: "Responsabilidade, família, serviço. Você busca cuidar e harmonizar o lar.",
  7: "Introspecção, sabedoria, análise. Você busca conhecimento e a verdade interior.",
  8: "Poder, ambição, sucesso material. Você busca realização e controle.",
  9: "Humanitarismo, compaixão, finalização. Você busca servir a um propósito maior.",
  11: "Intuição elevada, idealismo, inspiração. Um mestre espiritual com grande sensibilidade.",
  22: "Mestre construtor, poder prático, grandes realizações. Capaz de manifestar sonhos no plano material.",
  33: "Mestre servidor, compaixão universal, cura. Dedicado a elevar a consciência da humanidade."
};