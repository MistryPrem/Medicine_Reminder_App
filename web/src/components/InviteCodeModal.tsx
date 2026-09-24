import React, { useState } from 'react';
import { X, Copy, Check, Users } from 'lucide-react';
import { createCaregiverInviteApi } from '../services/relationshipService';

interface InviteCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteCodeModal: React.FC<InviteCodeModalProps> = ({ isOpen, onClose }) => {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      const res = await createCaregiverInviteApi('full');
      setInviteCode(res.inviteCode);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <Users size={20} className="icon-blue" />
            <h2>Connect Senior Family Member</h2>
          </div>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        <div className="invite-modal-body">
          <p className="invite-desc">
            Generate an easy 6-character pairing code. Share this code with your elderly family member to link their mobile or web portal.
          </p>

          {!inviteCode ? (
            <div className="generate-wrapper">
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="btn-primary btn-generate"
              >
                {isLoading ? 'Generating Code...' : 'Generate New Pairing Code'}
              </button>
            </div>
          ) : (
            <div className="code-display-card">
              <span className="code-label">PAIRING CODE (VALID FOR 48 HOURS)</span>
              <div className="code-box">
                <span className="code-text">{inviteCode}</span>
                <button onClick={handleCopy} className="btn-copy" title="Copy to clipboard">
                  {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
                </button>
              </div>
              <p className="code-instructions">
                Instruct your senior to tap <strong>"Enter Caregiver Code"</strong> in their app and enter this code.
              </p>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
