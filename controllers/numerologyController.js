// controllers/numerologyController.js
import { reduceNumber, lifePathMeanings, birthdayNumberMeanings } from '../utils/numerologyHelpers.js';
import { supabase } from '../config/supabaseClient.js'; // <<< IMPORTANTE: Precisamos do cliente Supabase aqui

export const calculateNumerology = async (req, res) => { // <<< Tornar a função async
  try {
    const { birthDate, user } = req.body; // Espera 'YYYY-MM-DD' e opcionalmente o objeto user { id: '...' }

    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return res.status(400).json({ error: 'Data de nascimento inválida. Use o formato YYYY-MM-DD.' });
    }

    const [year, month, day] = birthDate.split('-').map(Number);

    // Calcular Caminho de Vida
    const reducedDay = reduceNumber(day);
    const reducedMonth = reduceNumber(month);
    const reducedYear = reduceNumber(year);
    const lifePathNumber = reduceNumber(reducedDay + reducedMonth + reducedYear);
    const lifePathMeaning = lifePathMeanings[lifePathNumber] || "Significado não encontrado.";

    // <<< NOVO: Calcular Número do Aniversário >>>
    const birthdayNumber = reduceNumber(day); // Reduz apenas o dia
    // Para o significado, usamos o 'day' original (1 a 31) como chave
    const birthdayMeaning = birthdayNumberMeanings[day] || "Talento específico não descrito."; 

    // <<< NOVO: Salvar no perfil se user estiver logado >>>
    let profileUpdateError = null;
    if (user && user.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ life_path_number: lifePathNumber }) // <<< Assumindo que a coluna se chama 'life_path_number'
          .eq('id', user.id);
        
        if (error) throw error;
        console.log(`[Numerology Controller] Caminho de Vida ${lifePathNumber} salvo para user ${user.id}`);
      } catch (dbError) {
        console.error(`[Numerology Controller] Erro ao salvar Caminho de Vida para user ${user.id}:`, dbError);
        profileUpdateError = "Não foi possível salvar o número no seu perfil."; // Guarda o erro para informar o frontend, mas não impede a resposta
      }
    }

    // Devolver todos os resultados
    res.status(200).json({
      input_date: birthDate,
      life_path_number: lifePathNumber,
      life_path_meaning: lifePathMeaning,
      birthday_number: birthdayNumber, // Número do aniversário reduzido
      birthday_meaning: birthdayMeaning, // Significado baseado no dia original
      ...(profileUpdateError && { warning: profileUpdateError }) // Inclui aviso se falhou ao salvar
    });

  } catch (error) {
    console.error("LOG: Erro no Numerology Controller:", error);
    res.status(500).json({ error: 'Falha ao processar o cálculo numerológico.' });
  }
};
