// controllers/astrologyController.js
const DEFAULT_ASTROLOGY_API_URL = 'https://oraculo-tarot-api.onrender.com/api/astral-chart';
const FALLBACK_ASTROLOGY_API_URL = 'https://oraculo-tarot-api.onrender.com/astral-chart';

const getAstrologyApiUrls = () => {
  if (process.env.ASTROLOGY_API_URL) {
    return [process.env.ASTROLOGY_API_URL];
  }

  return [DEFAULT_ASTROLOGY_API_URL, FALLBACK_ASTROLOGY_API_URL];
};

export const getAstralChart = async (req, res) => {
  try {
    const urlsToTry = getAstrologyApiUrls();
    let response = null;
    let rawText = '';

    for (const url of urlsToTry) {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body ?? {}),
      });
      rawText = await response.text();

      if (response.ok) {
        break;
      }

      if (response.status !== 404) {
        break;
      }
    }

    if (!response || !response.ok) {
      console.error('[Astrology Controller] Falha ao chamar serviço astral.', {
        status: response?.status,
        body: rawText,
      });
      return res.status(response?.status ?? 502).json({
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
