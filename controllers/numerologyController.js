// controllers/numerologyController.js (COM LOGS DE DEPURAÇÃO ADICIONAIS)
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
      console.log("[Numerology Controller] Cliente Supabase autenticado criado."); // Log
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

    // Calcular
    console.log(`[Numerology Controller] Calculando nova leitura para user ${userId} com data ${birthDate}`);
    const [year, month, day] = birthDate.split('-').map(Number);
    const lifePathNumber = reduceNumber(/*...*/); // Assume que reduceNumber e meanings estão importados
    const lifePathMeaning = lifePathMeanings[lifePathNumber] || "Significado não disponível.";
    const birthdayNumber = reduceNumber(day);
    const birthdayMeaning = birthdayNumberMeanings[day] || "Significado não disponível.";
    console.log(`[Numerology Controller] Números calculados para ${userId}: LP=${lifePathNumber}, BD=${birthdayNumber}. Preparando para inserir.`); // <-- Log Adicional


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
    console.log(`[Numerology Controller] ===> TENTANDO INSERT em numerology_readings para user ${userId}`); // <<< LOG ANTES
    const { data: insertedReading, error: insertError } = await supabase
      .from('numerology_readings')
      .insert(newReadingData)
      .select()
      .single();
    console.log(`[Numerology Controller] <=== INSERT em numerology_readings CONCLUÍDO.`); // <<< LOG DEPOIS


    if (insertError) {
      console.error("[Numerology Controller] Erro DETALHADO ao INSERIR leitura:", insertError); // <<< LOG DO ERRO DETALHADO
      if (insertError.code === '23505') {
        console.warn(`[Numerology Controller] Violação UNIQUE (inserção duplicada?) para user ${userId}`);
        return res.status(409).json({ error: 'Erro de concorrência: Já existe uma leitura.' });
      }
      // Lança erro para ser pego pelo catch geral
      throw new Error(`Erro ao salvar leitura (Insert): ${insertError.message}`);
    }
    console.log(`[Numerology Controller] Insert bem-sucedido, dados:`, insertedReading); // Log dados inseridos


    // --- OPERAÇÃO DE UPDATE ---
    console.log(`[Numerology Controller] ===> TENTANDO UPDATE em profiles para user ${userId}`); // <<< LOG ANTES
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ life_path_number: lifePathNumber, birthday_number: birthdayNumber })
      .eq('id', userId);
    console.log(`[Numerology Controller] <=== UPDATE em profiles CONCLUÍDO.`); // <<< LOG DEPOIS


    if (profileUpdateError) {
      console.error(`[Numerology Controller] Erro DETALHADO ao ATUALIZAR perfil ${userId}:`, profileUpdateError); // <<< LOG DO ERRO DETALHADO
      // Adiciona aviso, mas não impede o sucesso da criação da leitura
      insertedReading.warning = "A leitura foi salva, mas houve um erro ao atualizar seu perfil com os números.";
    } else {
      console.log(`[Numerology Controller] Perfil ${userId} atualizado com sucesso.`);
    }

    // Retorna sucesso
    console.log(`[Numerology Controller] Retornando leitura criada com status 201 para ${userId}.`);
    return res.status(201).json(insertedReading);

  } catch (error) {
    // Captura qualquer erro lançado nos blocos try
    console.error("[Numerology Controller] ERRO GERAL CAPTURADO em getOrCalculateNumerology:", { message: error.message, stack: error.stack }); // Log mais completo
    return res.status(500).json({ error: error.message || 'Falha interna ao processar numerologia.' });
  }
  // Removido o finally para simplificar depuração - o cliente por requisição não precisa de signOut
};

// --- Função para Resetar/Apagar a Leitura ---
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
    console.log(`[Numerology Controller - Reset] ===> TENTANDO DELETE em numerology_readings para user ${userId}`); // <<< LOG ANTES
    const { error: deleteError } = await supabase
      .from('numerology_readings')
      .delete()
      .eq('user_id', userId);
    console.log(`[Numerology Controller - Reset] <=== DELETE em numerology_readings CONCLUÍDO.`); // <<< LOG DEPOIS

    if (deleteError) {
      console.error(`[Numerology Controller - Reset] Erro DETALHADO ao APAGAR leitura para user ${userId}:`, deleteError); // <<< LOG DO ERRO DETALHADO
      throw new Error(`Erro ao apagar leitura (Delete): ${deleteError.message}`);
    }
    console.log(`[Numerology Controller - Reset] Leitura apagada para user ${userId}`);

    // --- OPERAÇÃO UPDATE (Limpar Perfil) ---
    console.log(`[Numerology Controller - Reset] ===> TENTANDO UPDATE (null) em profiles para user ${userId}`); // <<< LOG ANTES
    const { error: profileClearError } = await supabase
      .from('profiles')
      .update({ life_path_number: null, birthday_number: null })
      .eq('id', userId);
    console.log(`[Numerology Controller - Reset] <=== UPDATE (null) em profiles CONCLUÍDO.`); // <<< LOG DEPOIS

    if (profileClearError) {
      console.error(`[Numerology Controller - Reset] Erro DETALHADO ao LIMPAR perfil ${userId}:`, profileClearError); // <<< LOG DO ERRO DETALHADO
      // Loga o erro mas continua, pois a leitura principal foi apagada
    } else {
      console.log(`[Numerology Controller - Reset] Perfil ${userId} limpo.`);
    }

    return res.status(200).json({ message: 'Leitura numerológica apagada com sucesso.' });

  } catch (error) {
    console.error("[Numerology Controller - Reset] ERRO GERAL CAPTURADO:", { message: error.message, stack: error.stack }); // Log mais completo
    return res.status(500).json({ error: error.message || 'Falha ao resetar.' });
  }
  // Removido o finally
};
