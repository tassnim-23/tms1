-- =====================================================
-- Migration: V1.0.1 - Add Client Approval System
-- Description: Ajoute le système d'approbation des clients
-- Date: 2026-04-15
-- =====================================================

-- 1️⃣  Ajouter colonnes à la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS statut_approval VARCHAR(20) DEFAULT 'EN_ATTENTE',
ADD COLUMN IF NOT EXISTS client_id BIGINT;

-- Ajouter contrainte de clé étrangère si elle n'existe pas
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS fk_users_client_id 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- 2️⃣  Modifier demande_inscription pour ajouter la relation User
ALTER TABLE demande_inscription 
ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- Ajouter contrainte de clé étrangère unique pour la relation OneToOne
ALTER TABLE demande_inscription 
ADD CONSTRAINT IF NOT EXISTS fk_demande_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Créer index unique pour la relation OneToOne
CREATE UNIQUE INDEX IF NOT EXISTS idx_demande_user_id ON demande_inscription(user_id);

-- 3️⃣  Créer table support_messages
CREATE TABLE IF NOT EXISTS support_messages (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    sujet VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'NUEVO',
    date_envoi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_support_messages_client_id 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_support_messages_client_id ON support_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_statut ON support_messages(statut);
CREATE INDEX IF NOT EXISTS idx_support_messages_date_envoi ON support_messages(date_envoi);

-- 4️⃣  Créer table factures
CREATE TABLE IF NOT EXISTS factures (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    commande_id BIGINT,
    numero VARCHAR(50) NOT NULL UNIQUE,
    date_facture TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    montant NUMERIC(10, 2) NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    pdf_content BYTEA,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_factures_client_id 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_factures_commande_id 
        FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE SET NULL
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_factures_client_id ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);
CREATE INDEX IF NOT EXISTS idx_factures_numero ON factures(numero);
CREATE INDEX IF NOT EXISTS idx_factures_commande_id ON factures(commande_id);

-- 5️⃣  Ajouter index sur users pour les performances
CREATE INDEX IF NOT EXISTS idx_users_statut_approval ON users(statut_approval);
CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);

-- ✅ Migration complète!
