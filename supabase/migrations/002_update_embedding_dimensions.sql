
-- Mettre à jour la colonne embedding pour utiliser 1536 dimensions
-- ATTENTION: Cela supprimera tous les embeddings existants !

-- 1. Supprimer l'index existant
DROP INDEX IF EXISTS inventory_items_embedding_idx;

-- 2. Supprimer la colonne embedding
ALTER TABLE inventory_items 
DROP COLUMN IF EXISTS embedding;

-- 3. Ajouter la colonne avec 1536 dimensions
ALTER TABLE inventory_items 
ADD COLUMN embedding vector(1536);

-- 4. Recréer l'index
CREATE INDEX IF NOT EXISTS inventory_items_embedding_idx 
ON inventory_items 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 5. Mettre à jour le commentaire
COMMENT ON COLUMN inventory_items.embedding IS 'Embedding vectorisé du produit pour la recherche sémantique (openai/text-embedding-3-small: 1536 dimensions)';
