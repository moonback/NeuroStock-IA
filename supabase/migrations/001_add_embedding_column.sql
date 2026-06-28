
-- Ajout de la colonne embedding à la table inventory_items
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Création d'un index pour la recherche sémantique (pgvector)
CREATE INDEX IF NOT EXISTS inventory_items_embedding_idx 
ON inventory_items 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Commentaire sur la colonne
COMMENT ON COLUMN inventory_items.embedding IS 'Embedding vectorisé du produit pour la recherche sémantique (openai/text-embedding-3-small: 1536 dimensions)';
