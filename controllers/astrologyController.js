// controllers/astrologyController.js
const ASTROLOGY_API_URL =
  process.env.ASTROLOGY_API_URL || 'https://oraculo-tarot-api.onrender.com/api/astral-chart';

export const getAstralChart = async (req, res) => {
  try {
    const response = await fetch(ASTROLOGY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body ?? {}),
    });

    const rawText = await response.text();

    if (!response.ok) {
      console.error('[Astrology Controller] Falha ao chamar serviço astral.', {
        status: response.status,
        body: rawText,
      });
      return res.status(response.status).json({
        error: 'Erro no servidor astral.',
        details: rawText,
      });
    }

    try {
      const parsed = JSON.parse(rawText);
      return res.status(200).json(parsed);
    } catch (parseError) {
      console.error('[Astrology Controller] Resposta não é JSON válido.', {
        error: parseError.message,
      });
      return res.status(200).send(rawText);
    }
  } catch (error) {
    console.error('[Astrology Controller] Erro ao chamar serviço astral:', error);
    return res.status(502).json({ error: 'Falha ao chamar serviço astral.' });
  }
};
