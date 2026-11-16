import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Server, 
  Cloud, 
  ExternalLink, 
  Radio, 
  Fingerprint, 
  Save, 
  Cpu, 
  HardDrive
} from 'lucide-react';
import { BiometricDeviceConfig } from '../types/school';
import { 
  saveBiometricConfig, 
  testBiometricDeviceConnection, 
  testZlinkCloudConnection 
} from '../utils/biometricAttendanceLogic';

interface BiometricConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BiometricDeviceConfig;
  onSave: (newConfig: BiometricDeviceConfig) => void;
}

export const BiometricConfigModal: React.FC<BiometricConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [formData, setFormData] = useState<BiometricDeviceConfig>({ ...config });
  const [connectionMode, setConnectionMode] = useState<'cloud' | 'local' | 'usb'>(() => {
    if (config.protocol === 'zk_tcp') return 'local';
    return 'cloud';
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    if (connectionMode === 'cloud') {
      const res = await testZlinkCloudConnection(
        formData.cloudEndpointUrl || 'https://zlink.minervaiot.com',
        formData.cloudOrgCode || 'ANANDO-PATHSHALA-2026'
      );
      setIsTesting(false);
      setTestResult({
        success: res.success,
        message: res.messageBn,
      });
    } else {
      const res = await testBiometricDeviceConnection(formData.ipAddress, formData.port);
      setIsTesting(false);
      setTestResult({
        success: res.success,
        message: res.messageBn,
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: BiometricDeviceConfig = {
      ...formData,
      protocol: connectionMode === 'local' ? 'zk_tcp' : 'zlink_cloud',
      cloudPlatform: connectionMode === 'cloud' ? 'zlink_minerva' : 'standalone_tcp',
      connectionStatus: 'connected',
      lastSyncTimestamp: Date.now(),
      lastSyncTimeStr: 'এইমাত্র কনফিগারেশন আপডেট করা হয়েছে',
    };

    saveBiometricConfig(updated);
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-scaleUp max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-3 text-indigo-900">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">
                বায়োমেট্রিক ও ডিজিটাল মেশিন কনফিগারেশন
              </h3>
              <p className="text-xs text-slate-500">
                নতুন ডিভাইস যোগ করুন বা বর্তমান ডিভাইসের তথ্য পরিবর্তন করে সংরক্ষণ করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleFormSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 text-slate-800 text-xs">
          {/* Connection Mode Selection Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              মেশিনের সংযোগ মাধ্যম (Connection Mode):
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setConnectionMode('cloud')}
                className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  connectionMode === 'cloud'
                    ? 'border-sky-500 bg-sky-50 text-sky-950 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Cloud className={`w-5 h-5 ${connectionMode === 'cloud' ? 'text-sky-600' : 'text-slate-400'}`} />
                <span className="font-black text-xs">ক্লাউড মোড</span>
                <span className="text-[10px] text-slate-500">ZLink Minerva</span>
              </button>

              <button
                type="button"
                onClick={() => setConnectionMode('local')}
                className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  connectionMode === 'local'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-950 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Server className={`w-5 h-5 ${connectionMode === 'local' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="font-black text-xs">লোকাল নেটওয়ার্ক</span>
                <span className="text-[10px] text-slate-500">Wi-Fi / LAN IP</span>
              </button>

              <button
                type="button"
                onClick={() => setConnectionMode('usb')}
                className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  connectionMode === 'usb'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <HardDrive className={`w-5 h-5 ${connectionMode === 'usb' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="font-black text-xs">পেনড্রাইভ / ফাইল</span>
                <span className="text-[10px] text-slate-500">DAT / CSV ইমপোর্ট</span>
              </button>
            </div>
          </div>

          {/* Section 1: Device Identification */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>ডিভাইস পরিচিতি ও হার্ডওয়্যার তথ্য</span>
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                মেশিনের নাম ও অবস্থান <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nameBn}
                onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                placeholder="যেমন: আনন্দ পাঠশালা প্রধান ফটক টার্মিনাল ১"
                className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  মেশিনের মডেল <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="যেমন: ZKTeco SenseFP M1 বা K40 বা Realtime"
                  className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  সিরিয়াল নম্বর (Serial Number / SN) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.terminalSerial}
                  onChange={(e) => setFormData({ ...formData, terminalSerial: e.target.value })}
                  placeholder="মেশিনের পেছনের স্টিকারের কোড (যেমন: SenseFP-M1-AP2026)"
                  className="w-full text-xs font-mono font-semibold p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                অবস্থান বিবরণ (Location Description)
              </label>
              <input
                type="text"
                value={formData.locationBn || ''}
                onChange={(e) => setFormData({ ...formData, locationBn: e.target.value })}
                placeholder="যেমন: বিদ্যালয়ের প্রধান প্রবেশদ্বার (গ্রাউন্ড ফ্লোর)"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
              />
            </div>
          </div>

          {/* Section 2: Connection Parameters */}
          {connectionMode === 'cloud' && (
            <div className="p-4 bg-sky-50/80 rounded-2xl border-2 border-sky-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-sky-600" />
                  <h4 className="font-black text-sky-950 text-xs">ZLink Minerva IoT ক্লাউড সেটিংস</h4>
                </div>
                <a
                  href="https://zlink.minervaiot.com/home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>ZLink পোর্টাল খুলুন</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ক্লাউড প্ল্যাটফর্ম URL
                </label>
                <input
                  type="text"
                  value={formData.cloudEndpointUrl || 'https://zlink.minervaiot.com'}
                  onChange={(e) => setFormData({ ...formData, cloudEndpointUrl: e.target.value })}
                  placeholder="https://zlink.minervaiot.com"
                  className="w-full text-xs font-mono p-2.5 border border-sky-300 rounded-xl bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    প্রতিষ্ঠান / স্কুল কোড (Org Code)
                  </label>
                  <input
                    type="text"
                    value={formData.cloudOrgCode || 'ANANDO-PATHSHALA-2026'}
                    onChange={(e) => setFormData({ ...formData, cloudOrgCode: e.target.value })}
                    placeholder="ANANDO-PATHSHALA-2026"
                    className="w-full text-xs font-mono p-2 border border-sky-300 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ক্লাউড এপিআই টোকেন (ঐচ্ছিক)
                  </label>
                  <input
                    type="password"
                    value={formData.cloudApiKey || ''}
                    onChange={(e) => setFormData({ ...formData, cloudApiKey: e.target.value })}
                    placeholder="ZLink API Key বা Secret"
                    className="w-full text-xs font-mono p-2 border border-sky-300 rounded-xl bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {connectionMode === 'local' && (
            <div className="p-4 bg-indigo-50/80 rounded-2xl border-2 border-indigo-200 space-y-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                <h4 className="font-black text-indigo-950 text-xs">লোকাল নেটওয়ার্ক আইপি ও পোর্ট</h4>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ডিভাইস আইপি অ্যাড্রেস (IP Address)
                  </label>
                  <input
                    type="text"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    placeholder="192.168.1.201"
                    className="w-full text-xs font-mono font-semibold p-2.5 border border-indigo-300 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    পোর্ট (Port)
                  </label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                    placeholder="4370"
                    className="w-full text-xs font-mono font-semibold p-2.5 border border-indigo-300 rounded-xl bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Test Connection Button & Status */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">ডিভাইস সংযোগ যাচাই:</span>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{isTesting ? 'সংযোগ পরীক্ষা হচ্ছে...' : 'কানেকশন টেস্ট'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Section 3: Auto-Sync & Automation Settings */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  স্বয়ংক্রিয় ব্যাকগ্রাউন্ড সিঙ্ক (Auto-Sync)
                </label>
                <p className="text-[11px] text-slate-500">
                  সফটওয়্যার ওপেন থাকাকালীন নিজে থেকে ক্লাউড চেক করে হাজিরা ডাটা আপডেট করবে
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.autoSyncEnabled}
                onChange={(e) => setFormData({ ...formData, autoSyncEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  সিঙ্ক বিরতি (Auto-Sync Interval)
                </label>
                <p className="text-[11px] text-slate-500">কত সেকেন্ড পর পর ব্যাকগ্রাউন্ডে চেক করবে</p>
              </div>
              <select
                value={formData.autoSyncIntervalSeconds}
                onChange={(e) => setFormData({ ...formData, autoSyncIntervalSeconds: Number(e.target.value) })}
                className="text-xs font-bold p-1.5 border border-slate-300 rounded-lg bg-white text-slate-800"
              >
                <option value={15}>১৫ সেকেন্ড</option>
                <option value={30}>৩০ সেকেন্ড (সুপারিশকৃত)</option>
                <option value={60}>১ মিনিট</option>
                <option value={300}>৫ মিনিট</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-900 block">
                  তাৎক্ষণিক অভিভাবক SMS অ্যালার্ট
                </label>
                <p className="text-[11px] text-slate-500">পাঞ্চ হওয়ার সাথে সাথে অভিভাবকের ফোনে প্রবেশ/প্রস্থান নোটিফিকেশন</p>
              </div>
              <input
                type="checkbox"
                checked={formData.autoSmsAlertEnabled}
                onChange={(e) => setFormData({ ...formData, autoSmsAlertEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Modal Footer / Save Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>কনফিগারেশন সেভ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
