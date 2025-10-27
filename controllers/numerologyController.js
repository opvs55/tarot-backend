// controllers/numerologyController.js
import { reduceNumber, lifePathMeanings, birthdayNumberMeanings } from '../utils/numerologyHelpers.js';
// Importa o cliente Supabase configurado (garanta que o caminho ../config/ está correto)
import { supabase } from '../config/supabaseClient.js';

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
      .maybeSingle(); // Retorna null se não encontrar, sem gerar erro

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
       // Se a data for inválida ou ausente E não achamos leitura existente:
       // Retorna 404 Not Found, indicando que a leitura não existe e precisa de uma data válida para ser criada.
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
      if (insertError.code === '23505') { // UNIQUE constraint violation
        console.warn(`[Numerology Controller] Tentativa de inserção duplicada (race condition?) para user ${userId}`);
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
      // Adiciona um aviso aos dados retornados se a atualização do perfil falhar
      insertedReading.warning = "Não foi possível atualizar seu perfil com os números.";
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

// --- Função para Resetar/Apagar a Leitura (sem alterações lógicas) ---
export const resetNumerologyReading = async (req, res) => {
  try {
    const { user } = req.body;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Autenticação necessária.' });
    }
    const userId = user.id;

    // 1. Apaga da tabela numerology_readings
    console.log(`[Numerology Controller] Tentando apagar leitura para user ${userId}`);
    const { error: deleteError } = await supabase
      .from('numerology_readings')
      .delete()
      .eq('user_id', userId);
    if (deleteError) {
      console.error(`[Numerology Controller] Erro ao APAGAR leitura para user ${userId}:`, deleteError);
      throw new Error('Erro ao apagar a leitura numerológica existente.');
    }
    console.log(`[Numerology Controller] Leitura apagada com sucesso para user ${userId}`);

    // 2. Limpa os campos no perfil
    console.log(`[Numerology Controller] Limpando números do perfil ${userId}`);
    const { error: profileClearError } = await supabase
      .from('profiles')
      .update({ life_path_number: null, birthday_number: null })
      .eq('id', userId);
    if (profileClearError) {
      console.error(`[Numerology Controller] Erro não fatal ao LIMPAR perfil ${userId} após reset:`, profileClearError);
    } else {
      console.log(`[Numerology Controller] Perfil ${userId} limpo após reset.`);
    }

    return res.status(200).json({ message: 'Leitura numerológica apagada com sucesso. Você pode calcular uma nova.' });

  } catch (error) {
    console.error("LOG: Erro em resetNumerologyReading:", error);
    return res.status(500).json({ error: error.message || 'Falha ao resetar a numerologia.' });
  }
};
