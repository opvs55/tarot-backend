// controllers/numerologyController.js
import { reduceNumber, lifePathMeanings, birthdayNumberMeanings } from '../utils/numerologyHelpers.js';
// Importa o cliente Supabase configurado (ajuste o caminho se necessário)
import { supabase } from '../config/supabaseClient.js'; 

// --- Função Principal para Calcular ou Obter Leitura ---
export const getOrCalculateNumerology = async (req, res) => {
  try {
    // Assume que a autenticação (middleware?) coloca 'user' no 'req'
    // Ou que o frontend envia 'user' no body
    const { birthDate, user } = req.body; 

    // Validação de Autenticação
    if (!user || !user.id) {
      console.warn("[Numerology Controller] Tentativa de acesso não autenticada.");
      return res.status(401).json({ error: 'Autenticação necessária para acessar a numerologia.' });
    }
    const userId = user.id;

    // Validação da Data de Nascimento
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return res.status(400).json({ error: 'Data de nascimento inválida. Use o formato AAAA-MM-DD.' });
    }

    // 1. Tenta buscar leitura existente na nova tabela
    console.log(`[Numerology Controller] Verificando leitura existente para user ${userId}`);
    const { data: existingReading, error: fetchError } = await supabase
      .from('numerology_readings') // <<< Tabela correta
      .select('*') // Pega todos os dados da leitura salva
      .eq('user_id', userId)
      .maybeSingle(); // Retorna null se não encontrar, sem gerar erro

    if (fetchError) {
      console.error("[Numerology Controller] Erro ao buscar leitura existente:", fetchError);
      // Não expor detalhes do erro interno para o cliente
      throw new Error('Erro ao verificar histórico de numerologia. Tente novamente.'); 
    }

    // 2. Se já existe, retorna a existente
    if (existingReading) {
      console.log(`[Numerology Controller] Retornando leitura existente para user ${userId}`);
      return res.status(200).json(existingReading); // Retorna os dados completos da leitura salva
    }

    // 3. Se não existe, calcula os números
    console.log(`[Numerology Controller] Calculando nova leitura para user ${userId}`);
    const [year, month, day] = birthDate.split('-').map(Number);

    const reducedDay = reduceNumber(day);
    const reducedMonth = reduceNumber(month);
    const reducedYear = reduceNumber(year);
    const lifePathNumber = reduceNumber(reducedDay + reducedMonth + reducedYear);
    const lifePathMeaning = lifePathMeanings[lifePathNumber] || "Significado do Caminho de Vida não encontrado.";
    
    const birthdayNumber = reduceNumber(day); // Número do aniversário é o dia reduzido
    const birthdayMeaning = birthdayNumberMeanings[day] || "Significado do dia de aniversário não encontrado."; // Significado usa o dia original (1-31)

    // 4. Prepara os dados para inserir na tabela numerology_readings
    const newReadingData = {
      user_id: userId,
      input_birth_date: birthDate,
      life_path_number: lifePathNumber,
      life_path_meaning: lifePathMeaning,
      birthday_number: birthdayNumber,
      birthday_meaning: birthdayMeaning,
    };

    // 5. Insere na tabela numerology_readings
    console.log(`[Numerology Controller] Inserindo nova leitura para user ${userId}`);
    const { data: insertedReading, error: insertError } = await supabase
      .from('numerology_readings')
      .insert(newReadingData)
      .select() // Pede ao Supabase para retornar o registro inserido
      .single(); // Espera apenas um registro

    if (insertError) {
      console.error("[Numerology Controller] Erro ao INSERIR nova leitura:", insertError);
      // Verifica erro específico de violação de chave única (usuário já tem leitura)
      if (insertError.code === '23505') { 
        // Este erro não deveria acontecer por causa da verificação inicial, mas é uma segurança extra
        console.warn(`[Numerology Controller] Tentativa de inserção duplicada para user ${userId}`);
        return res.status(409).json({ error: 'Erro de concorrência: Já existe uma leitura numerológica para este usuário.' });
      }
      // Para outros erros de inserção
      throw new Error('Erro ao salvar a nova leitura numerológica. Tente novamente.'); 
    }

    // 6. Atualiza a tabela profiles com os números calculados
    // Faz isso *depois* de inserir com sucesso na tabela principal
    console.log(`[Numerology Controller] Atualizando perfil ${userId} com números ${lifePathNumber}/${birthdayNumber}.`);
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ 
          life_path_number: lifePathNumber,
          birthday_number: birthdayNumber // Atualiza ambos os números no perfil
       }) 
      .eq('id', userId); // Garante que atualiza apenas o perfil do usuário correto

    if (profileUpdateError) {
      // Loga o erro mas não impede a resposta principal de sucesso
      console.error(`[Numerology Controller] Erro não fatal ao ATUALIZAR perfil ${userId}:`, profileUpdateError);
      // Pode-se adicionar um aviso na resposta se for crítico
      // insertedReading.warning = "Não foi possível atualizar seu perfil com os números.";
    } else {
      console.log(`[Numerology Controller] Perfil ${userId} atualizado com sucesso.`);
    }

    // 7. Retorna os dados da leitura recém-criada
    console.log(`[Numerology Controller] Nova leitura criada com sucesso para user ${userId}`);
    return res.status(201).json(insertedReading); // Status 201: Created

  } catch (error) {
    // Captura erros gerais lançados no try block
    console.error("LOG: Erro geral em getOrCalculateNumerology:", error);
    // Retorna uma mensagem genérica para o cliente
    return res.status(500).json({ error: error.message || 'Falha ao processar a solicitação de numerologia.' });
  }
};

// --- NOVA Função para Resetar/Apagar a Leitura ---
export const resetNumerologyReading = async (req, res) => {
  try {
    // Assume que a autenticação (middleware?) coloca 'user' no 'req'
    // Ou que o frontend envia 'user' no body
    const { user } = req.body; 

    // Validação de Autenticação
    if (!user || !user.id) {
      console.warn("[Numerology Controller] Tentativa de reset não autenticada.");
      return res.status(401).json({ error: 'Autenticação necessária para apagar a leitura.' });
    }
    const userId = user.id;

    // 1. Apaga da tabela numerology_readings
    console.log(`[Numerology Controller] Tentando apagar leitura para user ${userId}`);
    const { error: deleteError } = await supabase
      .from('numerology_readings')
      .delete()
      .eq('user_id', userId); // Condição WHERE user_id = auth.uid() garantida pela Policy RLS

    if (deleteError) {
      console.error(`[Numerology Controller] Erro ao APAGAR leitura para user ${userId}:`, deleteError);
      throw new Error('Erro ao apagar a leitura numerológica existente.');
    }
    console.log(`[Numerology Controller] Leitura apagada com sucesso para user ${userId}`);

    // 2. Limpa os campos no perfil para consistência
    console.log(`[Numerology Controller] Limpando números do perfil ${userId}`);
    const { error: profileClearError } = await supabase
      .from('profiles')
      // Define os campos como NULL
      .update({ life_path_number: null, birthday_number: null }) 
      .eq('id', userId); // Condição WHERE id = auth.uid() garantida pela Policy RLS
    
    if (profileClearError) {
      // Loga o erro mas considera a operação principal (delete) como sucesso
      console.error(`[Numerology Controller] Erro não fatal ao LIMPAR perfil ${userId} após reset:`, profileClearError);
    } else {
        console.log(`[Numerology Controller] Perfil ${userId} limpo após reset.`);
    }

    // Retorna sucesso
    return res.status(200).json({ message: 'Leitura numerológica apagada com sucesso. Você pode calcular uma nova.' });

  } catch (error) {
    // Captura erros gerais
    console.error("LOG: Erro em resetNumerologyReading:", error);
    // Retorna uma mensagem genérica
    return res.status(500).json({ error: error.message || 'Falha ao resetar a numerologia.' });
  }
};
