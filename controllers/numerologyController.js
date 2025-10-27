// controllers/numerologyController.js
import { reduceNumber, lifePathMeanings, birthdayNumberMeanings } from '../utils/numerologyHelpers.js';
import { supabase } from '../config/supabaseClient.js'; // Garanta que este caminho está correto

// --- Função Principal para Calcular ou Obter Leitura (MODIFICADA) ---
export const getOrCalculateNumerology = async (req, res) => {
  try {
    // birthDate agora é opcional na requisição para permitir a busca
    const { birthDate, user } = req.body; 

    // Validação de Autenticação (essencial)
    if (!user || !user.id) {
      console.warn("[Numerology Controller] Tentativa de acesso não autenticada.");
      return res.status(401).json({ error: 'Autenticação necessária para acessar a numerologia.' });
    }
    const userId = user.id;

    // 1. Tenta buscar leitura existente primeiro (sempre faz isso)
    console.log(`[Numerology Controller] Verificando leitura existente para user ${userId}`);
    const { data: existingReading, error: fetchError } = await supabase
      .from('numerology_readings') 
      .select('*') 
      .eq('user_id', userId)
      .maybeSingle(); 

    if (fetchError) {
      console.error("[Numerology Controller] Erro ao buscar leitura existente:", fetchError);
      throw new Error('Erro ao verificar histórico de numerologia. Tente novamente.'); 
    }

    // 2. Se já existe, retorna a existente IMEDIATAMENTE
    if (existingReading) {
      console.log(`[Numerology Controller] Retornando leitura existente para user ${userId}`);
      return res.status(200).json(existingReading); 
    }

    // --- Lógica de CÁLCULO (só executa se NÃO encontrou existente E birthDate foi fornecida) ---

    // 3. Validação da Data de Nascimento (APENAS se não encontrou existente e data foi enviada)
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
       // Se a data for inválida ou ausente E não achamos leitura existente, 
       // significa que o usuário precisa fornecer a data.
       // Retornamos 404 Not Found ou talvez 400 Bad Request indicando a necessidade da data?
       // Vamos retornar 404 indicando que a leitura não existe e precisa ser criada com uma data.
      console.log(`[Numerology Controller] Leitura não encontrada para user ${userId} e data inválida/ausente fornecida.`);
      return res.status(404).json({ error: 'Nenhuma leitura encontrada. Forneça uma data de nascimento válida para calcular.' });
    }

    // 4. Se chegou aqui: Não há leitura existente E temos uma data válida -> Calcula
    console.log(`[Numerology Controller] Calculando nova leitura para user ${userId} com data ${birthDate}`);
    const [year, month, day] = birthDate.split('-').map(Number);

    const reducedDay = reduceNumber(day);
    const reducedMonth = reduceNumber(month);
    const reducedYear = reduceNumber(year);
    const lifePathNumber = reduceNumber(reducedDay + reducedMonth + reducedYear);
    const lifePathMeaning = lifePathMeanings[lifePathNumber] || "Significado do Caminho de Vida não encontrado.";
    const birthdayNumber = reduceNumber(day); 
    const birthdayMeaning = birthdayNumberMeanings[day] || "Significado do dia de aniversário não encontrado."; 

    // 5. Prepara os dados para inserir na nova tabela
    const newReadingData = {
      user_id: userId,
      input_birth_date: birthDate,
      life_path_number: lifePathNumber,
      life_path_meaning: lifePathMeaning,
      birthday_number: birthdayNumber,
      birthday_meaning: birthdayMeaning,
    };

    // 6. Insere na tabela numerology_readings
    console.log(`[Numerology Controller] Inserindo nova leitura para user ${userId}`);
    const { data: insertedReading, error: insertError } = await supabase
      .from('numerology_readings')
      .insert(newReadingData)
      .select() 
      .single(); 

    if (insertError) {
      console.error("[Numerology Controller] Erro ao INSERIR nova leitura:", insertError);
      // Segurança extra contra condição de corrida (race condition)
      if (insertError.code === '23505') { 
        console.warn(`[Numerology Controller] Tentativa de inserção duplicada para user ${userId}`);
        return res.status(409).json({ error: 'Erro de concorrência: Já existe uma leitura.' });
      }
      throw new Error('Erro ao salvar a nova leitura numerológica.'); 
    }

    // 7. Atualiza a tabela profiles com os números calculados
    console.log(`[Numerology Controller] Atualizando perfil ${userId} com números ${lifePathNumber}/${birthdayNumber}.`);
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ 
          life_path_number: lifePathNumber,
          birthday_number: birthdayNumber 
       }) 
      .eq('id', userId); 

    if (profileUpdateError) {
      console.error(`[Numerology Controller] Erro não fatal ao ATUALIZAR perfil ${userId}:`, profileUpdateError);
      // Pode adicionar um aviso na resposta se for crítico
      // insertedReading.warning = "Não foi possível atualizar seu perfil com os números.";
    } else {
      console.log(`[Numerology Controller] Perfil ${userId} atualizado com sucesso.`);
    }

    // 8. Retorna os dados da leitura recém-criada
    console.log(`[Numerology Controller] Nova leitura criada com sucesso para user ${userId}`);
    return res.status(201).json(insertedReading); // Status 201: Created

  } catch (error) {
    console.error("LOG: Erro geral em getOrCalculateNumerology:", error);
    return res.status(500).json({ error: error.message || 'Falha ao processar a solicitação de numerologia.' });
  }
};

// --- Função para Resetar/Apagar a Leitura (sem alterações) ---
export const resetNumerologyReading = async (req, res) => {
  // ... (código da função resetNumerologyReading permanece o mesmo) ...
  try {
    const { user } = req.body; 
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Autenticação necessária.' });
    }
    const userId = user.id;

    // 1. Apaga da tabela numerology_readings
    const { error: deleteError } = await supabase
      .from('numerology_readings')
      .delete()
      .eq('user_id', userId);
    if (deleteError) throw new Error('Erro ao apagar a leitura.');
    console.log(`[Numerology Controller] Leitura apagada para user ${userId}`);

    // 2. Limpa os campos no perfil
    const { error: profileClearError } = await supabase
      .from('profiles')
      .update({ life_path_number: null, birthday_number: null })
      .eq('id', userId);
    if (profileClearError) console.error(`[Numerology Controller] Erro ao LIMPAR perfil ${userId}:`, profileClearError);
    else console.log(`[Numerology Controller] Perfil ${userId} limpo.`);

    res.status(200).json({ message: 'Leitura apagada.' });

  } catch (error) {
    console.error("LOG: Erro em resetNumerologyReading:", error);
    res.status(500).json({ error: error.message || 'Falha ao resetar.' });
  }
};
