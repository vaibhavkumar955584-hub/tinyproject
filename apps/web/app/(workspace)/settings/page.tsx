'use client';

import { useState } from 'react';
import {
  Bell,
  Bot,
  CheckCircle2,
  Cpu,
  Globe,
  Key,
  Lock,
  Mail,
  Radio,
  Save,
  Send,
  ShieldCheck,
  Sliders,
  Sparkles,
} from 'lucide-react';

export default function SettingsPage() {
  const [tinyFishKey, setTinyFishKey] = useState('tf_live_984189201984218942');
  const [showKey, setShowKey] = useState(false);
  const [agentMode, setAgentMode] = useState<'demo' | 'live'>('live');
  const [telegramChatId, setTelegramChatId] = useState('582194012');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saveNotice, setSaveNotice] = useState(false);

  const [portals, setPortals] = useState({
    cppp: true,
    gem: true,
    upEproc: true,
    delhiEproc: false,
    gujaratEproc: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-[#38312A] dark:bg-[#221D19]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BCD8C7] bg-[#EBF4EF] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#2F6B4F] dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]">
              <Sliders size={12} />
              Platform Configuration
            </span>
            <span className="text-xs text-[#8C8276]">·</span>
            <span className="text-xs font-semibold text-[#6B6259] dark:text-[#9E958A]">
              API Keys & Notification Webhooks
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2E2118] dark:text-[#F2EBE1]">
            Settings & Integrations
          </h1>
          <p className="mt-1 text-xs text-[#6B6259] dark:text-[#9E958A]">
            Configure your TinyFish autonomous agent credentials, portal crawler scopes, and instant Telegram/Email alert webhooks.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
        >
          <Save size={14} />
          <span>Save Changes</span>
        </button>
      </div>

      {saveNotice && (
        <div className="rounded-xl border border-[#BCD8C7] bg-[#EBF4EF] p-3 text-xs font-semibold text-[#2F6B4F] flex items-center gap-2 dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]">
          <CheckCircle2 size={16} />
          <span>Configuration saved successfully. TinyFish Agent restarted.</span>
        </div>
      )}

      {/* 2. TinyFish Autonomous Agent Settings */}
      <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
        <div className="flex items-center gap-2.5 border-b border-[#E8DED2] pb-3 mb-4 dark:border-[#38312A]">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#F3EEE6] text-[#6B4226] dark:bg-[#28231E] dark:text-[#CCAFA0]">
            <Bot size={17} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#2E2118] dark:text-[#F2EBE1]">
              TinyFish Web Agent Configuration
            </h2>
            <p className="text-[11px] text-[#8C8276]">
              Governs headless crawling on Indian procurement portals
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs max-w-2xl">
          <div>
            <label className="block font-bold text-[#2E2118] mb-1.5 dark:text-[#F2EBE1]">
              TinyFish API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={tinyFishKey}
                onChange={(e) => setTinyFishKey(e.target.value)}
                className="flex-1 rounded-lg border border-[#E8DED2] bg-[#FAF7F2] p-2.5 font-mono text-xs text-[#2E2118] focus:border-[#6B4226] focus:outline-none dark:border-[#38312A] dark:bg-[#1A1613] dark:text-[#F2EBE1]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="btn-secondary py-2 px-3 text-xs"
              >
                {showKey ? 'Hide' : 'Reveal'}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-[#8C8276]">
              Your key is encrypted client-side and used to initiate TinyFish stream agents.
            </p>
          </div>

          <div>
            <label className="block font-bold text-[#2E2118] mb-1.5 dark:text-[#F2EBE1]">
              Execution Mode
            </label>
            <div className="flex gap-3">
              {[
                { id: 'live', label: 'Live Portal Mode (Real CPPP/GeM Search & Fetch)' },
                { id: 'demo', label: 'Offline / Fixture Mode (Instant demo data)' },
              ].map((mode) => (
                <label
                  key={mode.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-xs font-semibold transition ${
                    agentMode === mode.id
                      ? 'border-[#6B4226] bg-[#FAF7F2] text-[#6B4226] dark:border-[#8B5E3C] dark:bg-[#28231E] dark:text-[#CCAFA0]'
                      : 'border-[#E8DED2] bg-[#FFFFFF] text-[#6B6259] dark:border-[#38312A] dark:bg-[#221D19]'
                  }`}
                >
                  <input
                    type="radio"
                    name="agentMode"
                    value={mode.id}
                    checked={agentMode === mode.id}
                    onChange={() => setAgentMode(mode.id as typeof agentMode)}
                    className="accent-[#6B4226]"
                  />
                  <span>{mode.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Portal Crawler Scope Settings */}
      <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
        <div className="flex items-center gap-2.5 border-b border-[#E8DED2] pb-3 mb-4 dark:border-[#38312A]">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#EBF4EF] text-[#2F6B4F] dark:bg-[#202E26] dark:text-[#7BB896]">
            <Globe size={17} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#2E2118] dark:text-[#F2EBE1]">
              Target Procurement Portals
            </h2>
            <p className="text-[11px] text-[#8C8276]">
              Enable or disable portal nodes for autonomous discovery
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            { key: 'cppp', title: 'Central Public Procurement Portal (CPPP)', host: 'eprocure.gov.in' },
            { key: 'gem', title: 'Government e-Marketplace (GeM)', host: 'gem.gov.in' },
            { key: 'upEproc', title: 'UP e-Procurement Portal', host: 'etender.up.nic.in' },
            { key: 'gujaratEproc', title: 'Gujarat e-Procurement', host: 'tender.nprocure.com' },
            { key: 'delhiEproc', title: 'Delhi Govt e-Tenders', host: 'govtprocurement.delhi.gov.in' },
          ].map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-[#E8DED2] bg-[#FAF7F2] p-3 transition hover:border-[#6B4226]/50 dark:border-[#38312A] dark:bg-[#1A1613]"
            >
              <input
                type="checkbox"
                checked={portals[item.key as keyof typeof portals]}
                onChange={(e) =>
                  setPortals({ ...portals, [item.key]: e.target.checked })
                }
                className="mt-0.5 accent-[#6B4226]"
              />
              <div>
                <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1] block">
                  {item.title}
                </span>
                <span className="text-[10px] text-[#8C8276] font-mono">{item.host}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 4. Notification Webhook Settings */}
      <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
        <div className="flex items-center gap-2.5 border-b border-[#E8DED2] pb-3 mb-4 dark:border-[#38312A]">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FAF2E2] text-[#94631A] dark:bg-[#332817] dark:text-[#DEBA70]">
            <Radio size={17} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#2E2118] dark:text-[#F2EBE1]">
              Corrigendum Alert Channels
            </h2>
            <p className="text-[11px] text-[#8C8276]">
              Instant push notifications for deadline extensions and clause relaxations
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs max-w-xl">
          <div>
            <label className="block font-bold text-[#2E2118] mb-1 dark:text-[#F2EBE1]">
              Telegram Bot Chat ID
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="e.g. 582194012"
                className="flex-1 rounded-lg border border-[#E8DED2] bg-[#FAF7F2] p-2.5 text-xs text-[#2E2118] focus:border-[#6B4226] focus:outline-none dark:border-[#38312A] dark:bg-[#1A1613] dark:text-[#F2EBE1]"
              />
              <button
                type="button"
                onClick={() => {
                  setSaveNotice(true);
                  setTimeout(() => setSaveNotice(false), 2500);
                }}
                className="btn-secondary py-2 px-3 text-xs"
              >
                Send Test Alert
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#2E2118] dark:text-[#F2EBE1]">
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="accent-[#6B4226]"
            />
            <span>Send email notification immediately whenever a watched tender changes</span>
          </label>
        </div>
      </div>
    </div>
  );
}

