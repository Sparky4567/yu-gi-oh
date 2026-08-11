import { YugiohCard } from '../types/yugioh';
import { CLASSIC_CARDS } from '../data/defaultCards';

const BASE_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

export async function searchYugiohCards(query: string): Promise<YugiohCard[]> {
  if (!query || query.trim().length < 2) {
    return CLASSIC_CARDS;
  }

  try {
    const response = await fetch(`${BASE_URL}?fname=${encodeURIComponent(query.trim())}`);
    if (!response.ok) {
      throw new Error(`YGOPRODeck API error: ${response.status}`);
    }
    const json = await response.json();
    if (!json.data || !Array.isArray(json.data)) {
      return filterLocalCards(query);
    }

    return json.data.slice(0, 50).map(mapApiCardToYugiohCard);
  } catch (err) {
    console.warn("YGOPRODeck API fetch failed, using local filter:", err);
    return filterLocalCards(query);
  }
}

export async function getRandomYugiohCards(count: number = 20): Promise<YugiohCard[]> {
  try {
    const response = await fetch(`${BASE_URL}?num=${count}&offset=0`);
    if (!response.ok) throw new Error("Failed to fetch random cards");
    const json = await response.json();
    return json.data.map(mapApiCardToYugiohCard);
  } catch (e) {
    console.warn("Using default cards fallback");
    return CLASSIC_CARDS;
  }
}

function filterLocalCards(query: string): YugiohCard[] {
  const q = query.toLowerCase();
  return CLASSIC_CARDS.filter(
    c => c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)
  );
}

function mapApiCardToYugiohCard(apiCard: any): YugiohCard {
  let cardType: YugiohCard['type'] = 'Normal Monster';
  const typeStr = (apiCard.type || '').toLowerCase();

  if (typeStr.includes('spell')) {
    cardType = 'Spell Card';
  } else if (typeStr.includes('trap')) {
    cardType = 'Trap Card';
  } else if (typeStr.includes('fusion')) {
    cardType = 'Fusion Monster';
  } else if (typeStr.includes('synchro')) {
    cardType = 'Synchro Monster';
  } else if (typeStr.includes('xyz')) {
    cardType = 'Xyz Monster';
  } else if (typeStr.includes('effect')) {
    cardType = 'Effect Monster';
  }

  const imgObj = apiCard.card_images?.[0] || {};

  return {
    id: apiCard.id,
    name: apiCard.name,
    type: cardType,
    frameType: apiCard.frameType,
    desc: apiCard.desc || '',
    atk: apiCard.atk,
    def: apiCard.def,
    level: apiCard.level || apiCard.rank,
    race: apiCard.race,
    attribute: apiCard.attribute,
    imageUrl: imgObj.image_url || `https://images.ygoprodeck.com/images/cards/${apiCard.id}.jpg`,
    imageUrlSmall: imgObj.image_url_small || `https://images.ygoprodeck.com/images/cards_small/${apiCard.id}.jpg`,
  };
}
