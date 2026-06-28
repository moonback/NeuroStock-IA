
import { InventoryItem } from '../types';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const EMBEDDING_MODEL = import.meta.env.VITE_OPENROUTER_EMBED_MODEL || 'openai/text-embedding-3-large';
const EMBEDDING_DIMENSIONS = parseInt(import.meta.env.VITE_OPENROUTER_EMBED_DIMENSIONS || '3072', 10);

/**
 * Simple hash function to generate a pseudo-embedding as fallback
 */
function generateFallbackEmbedding(text: string): number[] {
  const embedding = new Array(EMBEDDING_DIMENSIONS).fill(0);
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
    embedding[i % EMBEDDING_DIMENSIONS] = Math.sin(hash) * 0.5 + 0.5;
  }

  return embedding;
}

/**
 * Génère un embedding pour un produit via OpenRouter
 */
export async function generateProductEmbedding(product: Pick<InventoryItem, 'name' | 'brand' | 'category' | 'purchasePrice' | 'salesPrice'>): Promise<number[]> {
  // Créer un texte descriptif du produit pour l'embedding
  const productText = [
    `Nom: ${product.name}`,
    product.brand ? `Marque: ${product.brand}` : '',
    product.category ? `Catégorie: ${product.category}` : '',
    product.purchasePrice ? `Prix d'achat: ${product.purchasePrice}€` : '',
    product.salesPrice ? `Prix de vente: ${product.salesPrice}€` : '',
  ].filter(Boolean).join(' | ');

  if (!OPENROUTER_API_KEY) {
    console.warn('VITE_OPENROUTER_API_KEY not configured, using fallback embedding');
    return generateFallbackEmbedding(productText);
  }

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/embeddings',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'NeuroStock',
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: productText,
          dimensions: EMBEDDING_DIMENSIONS,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Failed to generate embedding via OpenRouter (${response.status}): ${errorText}`);
      console.warn('Falling back to pseudo-embedding');
      return generateFallbackEmbedding(productText);
    }

    const data = await response.json();
    if (data.data && data.data[0] && data.data[0].embedding) {
      return data.data[0].embedding;
    }

    console.warn('Invalid response from OpenRouter embedding API, using fallback');
    return generateFallbackEmbedding(productText);
  } catch (error) {
    console.warn('Error calling OpenRouter embedding API:', error);
    console.warn('Falling back to pseudo-embedding');
    return generateFallbackEmbedding(productText);
  }
}

/**
 * Calcul la similarité cosinus entre deux vecteurs
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    console.warn(`Vector length mismatch: ${a.length} vs ${b.length}`);
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Recherche sémantique complète avec embedding de la requête
 */
export async function fullSemanticSearch(
  query: string,
  products: InventoryItem[],
  limit = 5
): Promise<{ product: InventoryItem; similarity: number }[]> {
  const productsWithEmbeddings = products.filter((p) => p.embedding && p.embedding.length > 0);

  if (productsWithEmbeddings.length === 0) {
    console.warn('No products with embeddings available');
    return [];
  }

  // Générer l'embedding de la requête
  const queryEmbedding = await generateProductEmbedding({
    name: query,
    brand: '',
    category: '',
    purchasePrice: undefined,
    salesPrice: undefined
  });

  // Calculer la similarité pour chaque produit
  const results = productsWithEmbeddings.map((product) => ({
    product,
    similarity: cosineSimilarity(queryEmbedding, product.embedding),
  }));

  // Trier et limiter
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

export { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL };
