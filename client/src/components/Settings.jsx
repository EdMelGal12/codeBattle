import { useState } from 'react';

export default function Settings({ username, onChangeUsername }) {
  const [open,        setOpen]        = useState(false);
  const [newName,     setNewName]     = useState(username);
  const [nameError,   setNameError]   = useState('');
  const [copied,      setCopied]      = useState(false);

  const handleSave = () => {
    const trimmed = newName.trim();
    if (!trimmed)            { setNameError('REQUIRED'); return; }
    if (trimmed.length > 20) { setNameError('MAX 20 CHARS'); return; }
    setNameError('');
    onChangeUsername(trimmed);
    setOpen(false);
  };

  const handleShare = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 200 }}>

      {/* Settings panel */}
      {open && (
        <div
          className="pixel-panel mb-2 p-5 flex flex-col gap-5 border border-gray-700"
          style={{ width: 240 }}
        >
          <p className="text-[7px] text-gray-600 pixel-shadow">&gt; SETTINGS</p>
          <hr className="term-divider" />

          {/* Change username */}
          <div className="flex flex-col gap-2">
            <label className="text-[7px] text-gray-600 pixel-shadow">CHANGE USERNAME</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setNameError(''); }}
              maxLength={20}
              className="term-input px-2 py-2 text-[8px] text-red-400 w-full"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            />
            {nameError && (
              <p className="text-[7px] text-red-600 pixel-shadow">{nameError}</p>
            )}
            <button
              onClick={handleSave}
              className="pixel-btn text-[7px] text-gray-400 py-2 border border-gray-700 hover:text-gray-200 hover:border-gray-500"
            >
              &gt; SAVE
            </button>
          </div>

          <hr className="term-divider" />

          {/* Share / referral */}
          <div className="flex flex-col gap-2">
            <label className="text-[7px] text-gray-600 pixel-shadow">SHARE CODEBATTLE</label>
            <button
              onClick={handleShare}
              className="pixel-btn text-[7px] py-2 border border-gray-700 hover:border-gray-500"
              style={{ color: copied ? '#44cc44' : '#666666' }}
            >
              {copied ? '> LINK COPIED!' : '> COPY LINK'}
            </button>
            <p className="text-[6px] text-gray-800 pixel-shadow leading-5">
              INVITE A FRIEND TO CHALLENGE YOU
            </p>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="pixel-btn text-[7px] text-gray-600 px-3 py-2 border border-gray-800 hover:text-gray-400 hover:border-gray-600 float-right"
      >
        {open ? '> CLOSE' : '> CFG'}
      </button>
    </div>
  );
}
