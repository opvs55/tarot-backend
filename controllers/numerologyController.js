// controllers/numerologyController.js
import { reduceNumber, lifePathMeanings } from '../utils/numerologyHelpers.js';

export const calculateNumerology = (req, res) => {
  try {
    const { birthDate } = req.body; // Espera 'YYYY-MM-DD'

    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return res.status(400).json({ error: 'Data de nascimento inválida. Use o formato YYYY-MM-DD.' });
    }

    const [year, month, day] = birthDate.split('-').map(Number);

    const reducedDay = reduceNumber(day);
    const reducedMonth = reduceNumber(month);
    const reducedYear = reduceNumber(year);
    const lifePathNumber = reduceNumber(reducedDay + reducedMonth + reducedYear);
    const lifePathMeaning = lifePathMeanings[lifePathNumber] || "Significado não encontrado.";

    res.status(200).json({
      input_date: birthDate,
      life_path_number: lifePathNumber,
      life_path_meaning: lifePathMeaning,
    });

  } catch (error) {
    console.error("LOG: Erro no Numerology Controller:", error);
    res.status(500).json({ error: 'Falha ao processar o cálculo numerológico.' });
  }
};