// controllers/numerologyController.js (USANDO CLIENTE POR REQUISIÇÃO)
import { reduceNumber, lifePathMeanings, birthdayNumberMeanings } from '../utils/numerologyHelpers.js';
// <<< MUDANÇA: Importa a FUNÇÃO para criar o cliente >>>
import { createSupabaseServerClient } from '../config/supabaseClient.js';

// --- Função Principal para Calcular ou Obter Leitura ---
export const getOrCalculateNumerology = async (req, res) => {
  try {
  	const { birthDate } = req.body; // Pega a data do corpo
    // <<< 1. EXTRAIR TOKEN DO CABEÇALHO >>>
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]; // Extrai o token
    }

    if (!token) {
      console.warn("[Numerology Controller] Tentativa de acesso sem token Bearer válido.");
      return res.status(401).json({ error: 'Token de autenticação inválido ou ausente.' });
    }

    // <<< 2. CRIAR CLIENTE SUPABASE AUTENTICADO PARA ESTA REQUISIÇÃO >>>
    let supabase; // Declara a variável do cliente
    try {
      supabase = createSupabaseServerClient(token); // Cria o cliente com o token
    } catch (clientError) {
      console.error("[Numerology Controller] Erro ao criar cliente Supabase:", clientError.message);
      return res.status(401).json({ error: clientError.message || 'Falha ao inicializar autenticação.' });
    }

    // <<< 3. OBTER USUÁRIO A PARTIR DO CLIENTE AUTENTICADO >>>
    // Isso valida o token e obtém o ID do usuário de forma segura
     const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
     if (userError || !supabaseUser) {
        console.error("[Numerology Controller] Erro ao obter usuário do Supabase com token:", userError);
        return res.status(401).json({ error: 'Não foi possível validar o usuário com o token fornecido.' });
     }
     const userId = supabaseUser.id;
     console.log(`[Numerology Controller] Requisição autenticada para user ${userId}`);


    // 4. Tenta buscar leitura existente (usando o cliente autenticado 'supabase')
    console.log(`[Numerology Controller] Verificando leitura existente para user ${userId}`);
    const { data: existingReading, error: fetchError } = await supabase // <<< USA O CLIENTE DA REQUISIÇÃO
      .from('numerology_readings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {/* ... (erro fetch) ... */ throw new Error('Erro ao buscar.'); }
    if (existingReading) { /* ... (retorna existente) ... */ return res.status(200).json(existingReading); }

    // 5. Validação da Data (se não encontrou e data foi enviada)
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      console.log(`[Numerology Controller] Leitura não encontrada e data inválida/ausente.`);
      return res.status(404).json({ error: 'Leitura não encontrada. Forneça data válida.' });
    }

    // 6. Calcular (como antes)
    console.log(`[Numerology Controller] Calculando nova leitura para user ${userId} com data ${birthDate}`);
    const [year, month, day] = birthDate.split('-').map(Number);
    const lifePathNumber = reduceNumber(/*...*/); // Assume que reduceNumber e meanings estão importados
    const lifePathMeaning = lifePathMeanings[lifePathNumber] || "...";
    const birthdayNumber = reduceNumber(day);
    const birthdayMeaning = birthdayNumberMeanings[day] || "...";

    // 7. Preparar dados (usando userId validado)
    const newReadingData = {
      user_id: userId,
      input_birth_date: birthDate,
      life_path_number: lifePathNumber,
      life_path_meaning: lifePathMeaning,
      birthday_number: birthdayNumber,
      birthday_meaning: birthdayMeaning,
    };

    // 8. Inserir na tabela (usando o cliente autenticado 'supabase')
    console.log(`[Numerology Controller] Inserindo nova leitura para user ${userId}`);
    const { data: insertedReading, error: insertError } = await supabase // <<< USA O CLIENTE DA REQUISIÇÃO
      .from('numerology_readings')
      .insert(newReadingData)
      .select()
      .single();

    if (insertError) { /* ... (tratamento de erro insert, incluindo 409) ... */ throw new Error('Erro ao salvar.'); }

    // 9. Atualizar profiles (usando o cliente autenticado 'supabase')
    console.log(`[Numerology Controller] Atualizando perfil ${userId}`);
    const { error: profileUpdateError } = await supabase // <<< USA O CLIENTE DA REQUISIÇÃO
      .from('profiles')
      .update({ life_path_number: lifePathNumber, birthday_number: birthdayNumber })
      .eq('id', userId);

    if (profileUpdateError) { /* ... (log erro não fatal) ... */ insertedReading.warning = "..."; }
    else { console.log(`[Numerology Controller] Perfil ${userId} atualizado.`); }

    return res.status(201).json(insertedReading);

  } catch (error) {
    console.error("LOG: Erro geral em getOrCalculateNumerology:", error);
    // Não precisamos mais limpar sessão aqui
    return res.status(500).json({ error: error.message || 'Falha ao processar.' });
  }
  // <<< REMOVIDO o bloco finally com signOut >>>
};

// --- Função para Resetar/Apagar a Leitura (MODIFICADA com cliente por requisição) ---
export const resetNumerologyReading = async (req, res) => {
  try {
    // <<< 1. EXTRAIR TOKEN >>>
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token) { return res.status(401).json({ error: 'Token inválido ou ausente.' }); }

    // <<< 2. CRIAR CLIENTE >>>
    let supabase;
    try {
      supabase = createSupabaseServerClient(token);
    } catch (clientError) {
      return res.status(401).json({ error: clientError.message || 'Falha ao inicializar autenticação.' });
    }

    // <<< 3. OBTER/VALIDAR USUÁRIO >>>
     const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
     if (userError || !supabaseUser) {
        return res.status(401).json({ error: 'Não foi possível validar o usuário.' });
     }
     const userId = supabaseUser.id;
     console.log(`[Numerology Controller - Reset] Requisição autenticada para user ${userId}`);

    // 4. Apagar da tabela numerology_readings (usando cliente autenticado)
    console.log(`[Numerology Controller - Reset] Apagando leitura para user ${userId}`);
    const { error: deleteError } = await supabase // <<< USA O CLIENTE DA REQUISIÇÃO
      .from('numerology_readings')
      .delete()
      .eq('user_id', userId);
    if (deleteError) { /* ... (throw error) ... */ throw new Error('Erro ao apagar.'); }
    console.log(`[Numerology Controller - Reset] Leitura apagada para user ${userId}`);

    // 5. Limpar perfil (usando cliente autenticado)
    console.log(`[Numerology Controller - Reset] Limpando perfil ${userId}`);
    const { error: profileClearError } = await supabase // <<< USA O CLIENTE DA REQUISIÇÃO
      .from('profiles')
      .update({ life_path_number: null, birthday_number: null })
      .eq('id', userId);
    if (profileClearError) { /* ... (log erro não fatal) ... */ }
    else { console.log(`[Numerology Controller - Reset] Perfil ${userId} limpo.`); }

    res.status(200).json({ message: 'Leitura apagada.' });

  } catch (error) {
    console.error("LOG: Erro em resetNumerologyReading:", error);
    // Não precisamos limpar sessão aqui
    return res.status(500).json({ error: error.message || 'Falha ao resetar.' });
  }
  // <<< REMOVIDO o bloco finally com signOut >>>
};
