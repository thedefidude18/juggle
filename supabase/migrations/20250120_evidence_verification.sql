-- Evidence verification schema
CREATE TABLE IF NOT EXISTS evidence_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  evidence_url text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verification_checklist jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Track multiple admin reviews
CREATE TABLE IF NOT EXISTS evidence_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid REFERENCES evidence_verifications(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('approved', 'rejected')),
  notes text,
  checklist_results jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE evidence_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage evidence verifications"
  ON evidence_verifications
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage evidence reviews"
  ON evidence_reviews
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );