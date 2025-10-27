// controllers/numerologyController.js (COM LOGS DETALHADOS NO CÁLCULO)
import { reduceNumber, lifePathMeanings, birthdayNumberMeanings } from '../utils/numerologyHelpers.js';
import { createSupabaseServerClient } from '../config/supabaseClient.js';

// --- Função Principal para Calcular ou Obter Leitura ---
export const getOrCalculateNumerology = async (req, res) => {
  try {
  	const { birthDate } = req.body;
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      console.warn("[Numerology Controller] Tentativa de acesso sem token Bearer válido.");
      return res.status(401).json({ error: 'Token de autenticação inválido ou ausente.' });
    }

    // Cria cliente Supabase autenticado
    let supabase;
    try {
      supabase = createSupabaseServerClient(token);
      console.log("[Numerology Controller] Cliente Supabase autenticado criado.");
    } catch (clientError) {
      console.error("[Numerology Controller] Erro ao criar cliente Supabase:", clientError.message);
      return res.status(401).json({ error: clientError.message || 'Falha ao inicializar autenticação.' });
    }

    // Obtém/Valida usuário
     const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
     if (userError || !supabaseUser) {
        console.error("[Numerology Controller] Erro ao obter usuário do Supabase com token:", userError);
        return res.status(401).json({ error: 'Não foi possível validar o usuário com o token fornecido.' });
     }
     const userId = supabaseUser.id;
     console.log(`[Numerology Controller] Requisição autenticada para user ${userId}`);


    // Busca leitura existente
    console.log(`[Numerology Controller] Verificando leitura existente para user ${userId}`);
    const { data: existingReading, error: fetchError } = await supabase
      .from('numerology_readings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
       console.error("[Numerology Controller] Erro DETALHADO ao buscar leitura existente:", fetchError);
       throw new Error('Erro ao verificar histórico.');
    }
    if (existingReading) {
       console.log(`[Numerology Controller] Leitura existente encontrada para ${userId}. Retornando.`);
       return res.status(200).json(existingReading);
    }

    // Validação da Data (se não encontrou e data foi enviada)
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      console.log(`[Numerology Controller] Leitura não encontrada e data inválida/ausente.`);
      return res.status(404).json({ error: 'Leitura não encontrada. Forneça data válida.' });
    }

    // --- BLOCO DE CÁLCULO COM LOGS DETALHADOS ---
    console.log(`[Numerology Controller] Iniciando bloco de cálculo para ${userId}, data ${birthDate}`); // <<< LOG INÍCIO BLOCO
    const [year, month, day] = birthDate.split('-').map(Number);
    console.log(`[Numerology Controller] Data split: Y=${year}, M=${month}, D=${day}`); // <<< LOG 1

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        console.error(`[Numerology Controller] Erro no split/map da data: Y=${year}, M=${month}, D=${day}`);
        throw new Error("Falha ao processar os componentes da data.");
    }

    console.log(`[Numerology Controller] Reduzindo dia ${day}...`); // <<< LOG 2
    const reducedDay = reduceNumber(day);
    console.log(`[Numerology Controller] -> reducedDay = ${reducedDay}`); // <<< LOG 3

    console.log(`[Numerology Controller] Reduzindo mês ${month}...`); // <<< LOG 4
    const reducedMonth = reduceNumber(month);
    console.log(`[Numerology Controller] -> reducedMonth = ${reducedMonth}`); // <<< LOG 5

    console.log(`[Numerology Controller] Reduzindo ano ${year}...`); // <<< LOG 6
    const reducedYear = reduceNumber(year);
    console.log(`[Numerology Controller] -> reducedYear = ${reducedYear}`); // <<< LOG 7

    const sumBeforeFinalReduction = reducedDay + reducedMonth + reducedYear;
    console.log(`[Numerology Controller] Soma parcial ${sumBeforeFinalReduction} (${reducedDay}+${reducedMonth}+${reducedYear}). Reduzindo para Caminho de Vida...`); // <<< LOG 8
    const lifePathNumber = reduceNumber(sumBeforeFinalReduction);
    console.log(`[Numerology Controller] -> lifePathNumber = ${lifePathNumber}`); // <<< LOG 9

    console.log(`[Numerology Controller] Buscando significado para LP ${lifePathNumber}...`); // <<< LOG 10
    const lifePathMeaning = lifePathMeanings[lifePathNumber] || `Significado não encontrado para ${lifePathNumber}.`;
    // Log apenas se o significado foi encontrado para evitar erros com undefined
    if (lifePathMeaning) {
        console.log(`[Numerology Controller] -> lifePathMeaning obtido (primeiras 20 chars): ${lifePathMeaning.substring(0, 20)}...`); // <<< LOG 11
    } else {
        console.warn(`[Numerology Controller] -> lifePathMeaning NÃO encontrado para ${lifePathNumber}`);
    }


    const birthdayNumber = reducedDay; // Reutiliza reducedDay
    console.log(`[Numerology Controller] -> birthdayNumber = ${birthdayNumber} (baseado no dia ${day})`); // <<< LOG 12

    console.log(`[Numerology Controller] Buscando significado para Aniversário (dia ${day})...`); // <<< LOG 13
    const birthdayMeaning = birthdayNumberMeanings[day] || `Significado não encontrado para dia ${day}.`;
    console.log(`[Numerology Controller] -> birthdayMeaning obtido: ${birthdayMeaning}`); // <<< LOG 14

    console.log(`[Numerology Controller] FIM do bloco de cálculo para ${userId}. Preparando para inserir.`); // <<< LOG 15 (FIM BLOCO)
    // --- FIM DO BLOCO DE CÁLCULO ---


    // Preparar dados
    const newReadingData = {
      user_id: userId,
      input_birth_date: birthDate,
      life_path_number: lifePathNumber,
      life_path_meaning: lifePathMeaning,
      birthday_number: birthdayNumber,
      birthday_meaning: birthdayMeaning,
    };

    // --- OPERAÇÃO DE INSERT ---
    console.log(`[Numerology Controller] ===> TENTANDO INSERT em numerology_readings para user ${userId}`);
    const { data: insertedReading, error: insertError } = await supabase
      .from('numerology_readings')
      .insert(newReadingData)
      .select()
      .single();
    console.log(`[Numerology Controller] <=== INSERT em numerology_readings CONCLUÍDO.`);


    if (insertError) {
      console.error("[Numerology Controller] Erro DETALHADO ao INSERIR leitura:", insertError);
      if (insertError.code === '23505') {
        console.warn(`[Numerology Controller] Violação UNIQUE (inserção duplicada?) para user ${userId}`);
        return res.status(409).json({ error: 'Erro de concorrência: Já existe uma leitura.' });
      }
      throw new Error(`Erro ao salvar leitura (Insert): ${insertError.message}`);
    }
    console.log(`[Numerology Controller] Insert bem-sucedido, dados:`, insertedReading);


    // --- OPERAÇÃO DE UPDATE ---
    console.log(`[Numerology Controller] ===> TENTANDO UPDATE em profiles para user ${userId}`);
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ life_path_number: lifePathNumber, birthday_number: birthdayNumber })
      .eq('id', userId);
    console.log(`[Numerology Controller] <=== UPDATE em profiles CONCLUÍDO.`);


    if (profileUpdateError) {
      console.error(`[Numerology Controller] Erro DETALHADO ao ATUALIZAR perfil ${userId}:`, profileUpdateError);
      insertedReading.warning = "A leitura foi salva, mas houve um erro ao atualizar seu perfil com os números.";
    } else {
      console.log(`[Numerology Controller] Perfil ${userId} atualizado com sucesso.`);
    }

    // Retorna sucesso
    console.log(`[Numerology Controller] Retornando leitura criada com status 201 para ${userId}.`);
    return res.status(201).json(insertedReading);

  } catch (error) {
    console.error("[Numerology Controller] ERRO GERAL CAPTURADO em getOrCalculateNumerology:", { message: error.message, stack: error.stack });
    return res.status(500).json({ error: error.message || 'Falha interna ao processar numerologia.' });
  }
};

// --- Função para Resetar/Apagar a Leitura (com logs detalhados) ---
export const resetNumerologyReading = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) { token = authHeader.split(' ')[1]; }
    if (!token) { return res.status(401).json({ error: 'Token inválido ou ausente.' }); }

    let supabase;
    try { supabase = createSupabaseServerClient(token); }
    catch (clientError) { return res.status(401).json({ error: clientError.message || 'Falha auth.' }); }

     const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
     if (userError || !supabaseUser) { return res.status(401).json({ error: 'Usuário inválido.' }); }
     const userId = supabaseUser.id;
     console.log(`[Numerology Controller - Reset] Requisição autenticada para user ${userId}`);

    // --- OPERAÇÃO DELETE ---
    console.log(`[Numerology Controller - Reset] ===> TENTANDO DELETE em numerology_readings para user ${userId}`);
    const { error: deleteError } = await supabase
      .from('numerology_readings')
      .delete()
      .eq('user_id', userId);
    console.log(`[Numerology Controller - Reset] <=== DELETE em numerology_readings CONCLUÍDO.`);

    if (deleteError) {
      console.error(`[Numerology Controller - Reset] Erro DETALHADO ao APAGAR leitura para user ${userId}:`, deleteError);
      throw new Error(`Erro ao apagar leitura (Delete): ${deleteError.message}`);
    }
    console.log(`[Numerology Controller - Reset] Leitura apagada para user ${userId}`);

    // --- OPERAÇÃO UPDATE (Limpar Perfil) ---
    console.log(`[Numerology Controller - Reset] ===> TENTANDO UPDATE (null) em profiles para user ${userId}`);
    const { error: profileClearError } = await supabase
      .from('profiles')
      .update({ life_path_number: null, birthday_number: null })
      .eq('id', userId);
    console.log(`[Numerology Controller - Reset] <=== UPDATE (null) em profiles CONCLUÍDO.`);

    if (profileClearError) {
      console.error(`[Numerology Controller - Reset] Erro DETALHADO ao LIMPAR perfil ${userId}:`, profileClearError);
    } else {
      console.log(`[Numerology Controller - Reset] Perfil ${userId} limpo.`);
    }

    return res.status(200).json({ message: 'Leitura numerológica apagada com sucesso.' });

  } catch (error) {
    console.error("[Numerology Controller - Reset] ERRO GERAL CAPTURADO:", { message: error.message, stack: error.stack });
    return res.status(500).json({ error: error.message || 'Falha ao resetar.' });
  }
};
